/* ============================================================
   Manifestaciones Chamánicas (GDD §4)
   Armas y habilidades automáticas + tótems pasivos.
   Todas operan sobre el array de enemigos y dibujan sus efectos
   en el contenedor del mundo.
   ============================================================ */
class Manifestacion {
  constructor(jugador, world) {
    this.jugador = jugador;
    this.world = world;
    this.nivel = 1;
    this.cooldown = 0;
    this.evolucionada = false;
    this.esTotem = false;
  }
  // multiplicador de daño global (tótem fuego + altar)
  _dmg(base) { return base * this.jugador.danoMult; }
  subirNivel() { this.nivel++; }
  evolucionar() { this.evolucionada = true; }
  update(/* delta, enemigos, ctx */) {}
  destroy() {}
}

/* ---------- 1. Jaguares Espectrales (pasiva, daño cercano) ---------- */
class JaguaresEspectrales extends Manifestacion {
  static id = "jaguares";
  constructor(jugador, world) {
    super(jugador, world);
    this.id = "jaguares";
    this.angulo = 0;
    this.felinos = [];
    this._reconstruir();
  }
  get cantidad() { return Math.min(8, 1 + this.nivel); }
  get radio() { return this.evolucionada ? 110 : 78; }
  _reconstruir() {
    this.felinos.forEach(f => f.destroy());
    this.felinos = [];
    for (let i = 0; i < this.cantidad; i++) {
      const g = _Vistas.bestia(0.7);
      g.tint = this.evolucionada ? 0xff7722 : 0xffcf66;
      g.alpha = 0.9;
      this.world.addChild(g);
      this.felinos.push(g);
    }
  }
  subirNivel() { super.subirNivel(); this._reconstruir(); }
  evolucionar() { super.evolucionar(); this._reconstruir(); }
  update(delta, enemigos) {
    this.angulo += (0.04 + this.nivel * 0.004) * delta;
    const dpsPorFelino = (10 + this.nivel * 4);
    const danoFrame = this._dmg(dpsPorFelino) / 60 * delta;
    const golpeRadio = this.evolucionada ? 30 : 20;
    for (let i = 0; i < this.felinos.length; i++) {
      const a = this.angulo + (i / this.felinos.length) * Math.PI * 2;
      const fx = this.jugador.x + Math.cos(a) * this.radio;
      const fy = this.jugador.y + Math.sin(a) * this.radio;
      const f = this.felinos[i];
      f.x = fx; f.y = fy;
      for (const e of enemigos) {
        if (e.distanciaXY(fx, fy) < golpeRadio + 12) {
          e.recibirDano(danoFrame);
          if (this.evolucionada) e.empujar(fx, fy, 1.5 * delta);
        }
      }
    }
  }
  destroy() { this.felinos.forEach(f => f.destroy()); this.felinos = []; }
}

/* ---------- 2. Bolas de Veneno (activa, daño de área) ---------- */
class BolasDeVeneno extends Manifestacion {
  static id = "veneno";
  constructor(jugador, world) {
    super(jugador, world);
    this.id = "veneno";
    this.orbes = [];   // proyectiles
    this.charcos = []; // pozos
  }
  get cdDisparo() { return Math.max(18, 70 - this.nivel * 6); }
  update(delta, enemigos) {
    this.cooldown -= delta;
    if (this.cooldown <= 0) {
      this.cooldown = this.cdDisparo;
      const obj = this._enemigoMasCercano(enemigos, 520);
      if (obj) {
        const ang = Math.atan2(obj.y - this.jugador.y, obj.x - this.jugador.x);
        const g = new PIXI.Graphics();
        g.circle(0, 0, 6).fill(0x7CFC00);
        g.x = this.jugador.x; g.y = this.jugador.y;
        this.world.addChild(g);
        this.orbes.push({ g, vx: Math.cos(ang) * 6.5, vy: Math.sin(ang) * 6.5, vida: 70 });
      }
    }
    // mover orbes
    for (let i = this.orbes.length - 1; i >= 0; i--) {
      const o = this.orbes[i];
      o.g.x += o.vx * delta; o.g.y += o.vy * delta; o.vida -= delta;
      let impacto = o.vida <= 0;
      for (const e of enemigos) {
        if (e.distanciaXY(o.g.x, o.g.y) < 22) { impacto = true; break; }
      }
      if (impacto) {
        this._crearCharco(o.g.x, o.g.y);
        o.g.destroy(); this.orbes.splice(i, 1);
      }
    }
    // charcos: daño por tiempo
    const dps = (16 + this.nivel * 6) * (this.evolucionada ? 1.8 : 1);
    const danoFrame = this._dmg(dps) / 60 * delta;
    for (let i = this.charcos.length - 1; i >= 0; i--) {
      const c = this.charcos[i];
      c.vida -= delta;
      for (const e of enemigos) {
        if (e.distanciaXY(c.x, c.y) < c.r) e.recibirDano(danoFrame);
      }
      if (c.vida <= 0) { c.g.destroy(); this.charcos.splice(i, 1); }
    }
  }
  _crearCharco(x, y) {
    const r = (28 + this.nivel * 4) * (this.evolucionada ? 1.4 : 1);
    const g = new PIXI.Graphics();
    g.circle(0, 0, r).fill({ color: 0x3a8a1a, alpha: 0.4 });
    g.circle(0, 0, r * 0.6).fill({ color: 0x66dd33, alpha: 0.35 });
    g.x = x; g.y = y;
    this.world.addChildAt(g, 0);
    this.charcos.push({ g, x, y, r, vida: (90 + this.nivel * 15) * (this.evolucionada ? 1.5 : 1) });
  }
  _enemigoMasCercano(enemigos, max) {
    let mejor = null, dist = max;
    for (const e of enemigos) {
      const d = e.distanciaA(this.jugador);
      if (d < dist) { dist = d; mejor = e; }
    }
    return mejor;
  }
  destroy() {
    this.orbes.forEach(o => o.g.destroy()); this.orbes = [];
    this.charcos.forEach(c => c.g.destroy()); this.charcos = [];
  }
}

/* ---------- 3. Cóndor Vigía (activa, monobjetivo) ---------- */
class CondorVigia extends Manifestacion {
  static id = "condor";
  constructor(jugador, world) {
    super(jugador, world);
    this.id = "condor";
    this.picadas = [];
  }
  get cdDisparo() { return Math.max(35, 120 - this.nivel * 9); }
  update(delta, enemigos) {
    this.cooldown -= delta;
    if (this.cooldown <= 0 && enemigos.length) {
      this.cooldown = this.cdDisparo;
      const cercanos = enemigos.filter(e => e.distanciaA(this.jugador) < 460);
      if (cercanos.length) {
        const obj = cercanos[Math.floor(Math.random() * cercanos.length)];
        const g = _Vistas.bestia(0.8); // silueta de ave reutilizada
        g.tint = 0x88ccff; g.rotation = Math.PI / 2;
        g.x = obj.x; g.y = obj.y - 180;
        this.world.addChild(g);
        this.picadas.push({ g, obj, ox: obj.x, oy: obj.y, t: 0, total: 12, hecho: false });
      }
    }
    for (let i = this.picadas.length - 1; i >= 0; i--) {
      const p = this.picadas[i];
      p.t += delta;
      const tx = (p.obj && !p.obj.muerto) ? p.obj.x : p.ox;
      const ty = (p.obj && !p.obj.muerto) ? p.obj.y : p.oy;
      const k = Math.min(1, p.t / p.total);
      p.g.x = tx; p.g.y = ty - 180 * (1 - k);
      if (!p.hecho && k >= 1) {
        p.hecho = true;
        const dano = this._dmg(40 + this.nivel * 22) * (this.evolucionada ? 1.6 : 1);
        const radio = this.evolucionada ? 70 : 30;
        for (const e of enemigos) {
          if (e.distanciaXY(tx, ty) < radio) e.recibirDano(dano);
        }
      }
      if (p.t > p.total + 8) { p.g.destroy(); this.picadas.splice(i, 1); }
    }
  }
  destroy() { this.picadas.forEach(p => p.g.destroy()); this.picadas = []; }
}

/* ---------- 4. Estallido de Huaca (activa, control de masas) ---------- */
class EstallidoDeHuaca extends Manifestacion {
  static id = "huaca";
  constructor(jugador, world) {
    super(jugador, world);
    this.id = "huaca";
    this.ondas = [];
    this.marcas = []; // sólo evolucionada
  }
  get cdDisparo() { return Math.max(110, 240 - this.nivel * 14); }
  get radioMax() { return 120 + this.nivel * 26; }
  update(delta, enemigos) {
    this.cooldown -= delta;
    if (this.cooldown <= 0) {
      this.cooldown = this.cdDisparo;
      const g = new PIXI.Graphics();
      g.x = this.jugador.x; g.y = this.jugador.y;
      this.world.addChild(g);
      this.ondas.push({ g, r: 10, x: this.jugador.x, y: this.jugador.y, golpeados: new Set() });
      if (this.evolucionada) {
        const m = new PIXI.Graphics();
        m.x = this.jugador.x; m.y = this.jugador.y;
        this.world.addChildAt(m, 0);
        this.marcas.push({ g: m, x: this.jugador.x, y: this.jugador.y, r: this.radioMax * 0.7, vida: 120, explotó: false });
      }
    }
    const knock = 16 + this.nivel * 3;
    const dano = this._dmg(22 + this.nivel * 9);
    for (let i = this.ondas.length - 1; i >= 0; i--) {
      const o = this.ondas[i];
      o.r += 7 * delta;
      o.g.clear();
      o.g.circle(0, 0, o.r).stroke({ width: 6, color: 0x66e0ff, alpha: Math.max(0, 1 - o.r / this.radioMax) });
      for (const e of enemigos) {
        const d = e.distanciaXY(o.x, o.y);
        if (Math.abs(d - o.r) < 22 && !o.golpeados.has(e)) {
          o.golpeados.add(e);
          e.recibirDano(dano);
          e.empujar(o.x, o.y, knock);
        }
      }
      if (o.r >= this.radioMax) { o.g.destroy(); this.ondas.splice(i, 1); }
    }
    // marcas (evolución con tótem de agua)
    const danoMarca = this._dmg(30 + this.nivel * 10);
    for (let i = this.marcas.length - 1; i >= 0; i--) {
      const m = this.marcas[i];
      m.vida -= delta;
      m.g.clear();
      m.g.circle(0, 0, m.r).fill({ color: 0x3399ff, alpha: 0.18 + (1 - m.vida / 120) * 0.2 });
      if (m.vida <= 0 && !m.explotó) {
        m.explotó = true;
        for (const e of enemigos) if (e.distanciaXY(m.x, m.y) < m.r) e.recibirDano(danoMarca);
        m.g.destroy(); this.marcas.splice(i, 1);
      }
    }
  }
  destroy() {
    this.ondas.forEach(o => o.g.destroy()); this.ondas = [];
    this.marcas.forEach(m => m.g.destroy()); this.marcas = [];
  }
}

/* ---------- Tótems pasivos (GDD §4.2) ---------- */
class Totem extends Manifestacion {
  constructor(jugador, world) { super(jugador, world); this.esTotem = true; }
  subirNivel() { super.subirNivel(); this.aplicarEfecto(); }
  aplicarEfecto() {}
}
class TotemFuego extends Totem {
  constructor(j, w) { super(j, w); this.id = "fuego"; this.aplicarEfecto(); }
  aplicarEfecto() { this.jugador.danoMult = this.jugador._danoBaseMult * Math.pow(1.1, this.nivel); }
}
class TotemTierra extends Totem {
  constructor(j, w) { super(j, w); this.id = "tierra"; this.aplicarEfecto(); }
  aplicarEfecto() { this.jugador.reduccionDano = 1 - (1 - this.jugador._defBase) * Math.pow(0.9, this.nivel); }
}
class TotemAire extends Totem {
  constructor(j, w) { super(j, w); this.id = "aire"; this.aplicarEfecto(); }
  aplicarEfecto() { this.jugador.velocidadMult = this.jugador._velBaseMult * Math.pow(1.1, this.nivel); }
}
class TotemAgua extends Totem {
  constructor(j, w) { super(j, w); this.id = "agua"; this.aplicarEfecto(); }
  aplicarEfecto() { this.jugador.regenPorSeg = this.jugador._regenBase + 1.2 * this.nivel; }
}

/* ---------- Catálogo (para el menú de subida de nivel) ---------- */
const CATALOGO = [
  { id: "jaguares", nombre: "Jaguares Espectrales", icon: "🐆", desc: "Felinos que orbitan y dañan al contacto.", clase: JaguaresEspectrales, totem: false },
  { id: "veneno",   nombre: "Bolas de Veneno",      icon: "🟢", desc: "Orbes que estallan en charcos venenosos.", clase: BolasDeVeneno, totem: false },
  { id: "condor",   nombre: "Cóndor Vigía",          icon: "🦅", desc: "Picada automática a un enemigo cercano.", clase: CondorVigia, totem: false },
  { id: "huaca",    nombre: "Estallido de Huaca",    icon: "💥", desc: "Onda expansiva que empuja a los enemigos.", clase: EstallidoDeHuaca, totem: false },
  { id: "fuego",    nombre: "Tótem de Fuego",        icon: "🔥", desc: "+10% de daño por nivel.", clase: TotemFuego, totem: true },
  { id: "tierra",   nombre: "Tótem de Tierra",       icon: "🪨", desc: "+10% de defensa por nivel.", clase: TotemTierra, totem: true },
  { id: "aire",     nombre: "Tótem de Aire",         icon: "🌪", desc: "+10% de velocidad por nivel.", clase: TotemAire, totem: true },
  { id: "agua",     nombre: "Tótem de Agua",         icon: "💧", desc: "+ regeneración de vida por nivel.", clase: TotemAgua, totem: true },
];

// Evoluciones: arma base + tótem requerido -> nombre evolucionado
const EVOLUCIONES = {
  jaguares: { totem: "fuego",  nombre: "Jaguares Infernales", icon: "🔥", desc: "Aro de fuego que quema y empuja." },
  veneno:   { totem: "tierra", nombre: "Avalancha de Veneno", icon: "☣", desc: "Charcos enormes y persistentes." },
  condor:   { totem: "aire",   nombre: "Espíritu Aéreo",      icon: "💨", desc: "Picadas más amplias y potentes." },
  huaca:    { totem: "agua",   nombre: "Marca de la Huaca",   icon: "🌊", desc: "Deja marcas que explotan en el suelo." },
};

function metaDe(id) { return CATALOGO.find(c => c.id === id); }
