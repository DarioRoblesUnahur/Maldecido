/* ============================================================
   Enemigos (GDD §7)  — todos extienden EntidadConSalud.
   Jerarquía:
     Enemigo (base)
       ├── Guerrero
       ├── Bestia
       ├── Sombra
       ├── Hechicero
       ├── Golem
       └── ChamanUsurpador  (jefe final)
   Las vistas se dibujan en blanco/grises y se tiñen con .tint
   para poder hacer "flash" al recibir daño.
   ============================================================ */

// ---- builders de vista (Graphics en tonos claros para teñir) ----
const _Vistas = {
  guerrero(s = 1) {
    const g = new PIXI.Graphics();
    g.roundRect(-7 * s, -6 * s, 14 * s, 18 * s, 3).fill(0xdddddd);   // torso
    g.circle(0, -12 * s, 6 * s).fill(0xffffff);                       // cabeza
    g.rect(8 * s, -8 * s, 3 * s, 18 * s).fill(0xbbbbbb);              // lanza
    return g;
  },
  bestia(s = 1) {
    const g = new PIXI.Graphics();
    g.ellipse(0, 0, 13 * s, 8 * s).fill(0xdddddd);                    // lomo
    g.poly([-13 * s, -4 * s, -18 * s, -10 * s, -10 * s, -8 * s]).fill(0xffffff); // hocico
    g.poly([8 * s, -6 * s, 11 * s, -14 * s, 13 * s, -5 * s]).fill(0xffffff);     // oreja
    g.circle(-12 * s, -5 * s, 1.6 * s).fill(0x441111);               // ojo
    return g;
  },
  sombra(s = 1) {
    const g = new PIXI.Graphics();
    g.moveTo(-9 * s, 6 * s);
    g.bezierCurveTo(-12 * s, -10 * s, 12 * s, -10 * s, 9 * s, 6 * s);
    g.lineTo(5 * s, 3 * s); g.lineTo(0, 7 * s); g.lineTo(-5 * s, 3 * s);
    g.closePath().fill(0xffffff);
    g.circle(-3.5 * s, -2 * s, 1.8 * s).fill(0x220033);
    g.circle(3.5 * s, -2 * s, 1.8 * s).fill(0x220033);
    return g;
  },
  hechicero(s = 1) {
    const g = new PIXI.Graphics();
    g.poly([-11 * s, 14 * s, 11 * s, 14 * s, 5 * s, -8 * s, -5 * s, -8 * s]).fill(0xdddddd); // túnica
    g.poly([-7 * s, -6 * s, 7 * s, -6 * s, 0, -20 * s]).fill(0xffffff); // capucha
    g.circle(0, -8 * s, 4 * s).fill(0x110022);                        // sombra de cara
    return g;
  },
  golem(s = 1) {
    const g = new PIXI.Graphics();
    g.roundRect(-15 * s, -14 * s, 30 * s, 28 * s, 6).fill(0xcccccc);  // cuerpo
    g.roundRect(-19 * s, -6 * s, 7 * s, 16 * s, 3).fill(0xbbbbbb);    // brazo
    g.roundRect(12 * s, -6 * s, 7 * s, 16 * s, 3).fill(0xbbbbbb);     // brazo
    g.rect(-9 * s, -7 * s, 5 * s, 3 * s).fill(0x552200);             // ojos
    g.rect(4 * s, -7 * s, 5 * s, 3 * s).fill(0x552200);
    return g;
  },
  chaman(s = 1) {
    const g = new PIXI.Graphics();
    g.roundRect(-26 * s, -20 * s, 52 * s, 56 * s, 10).fill(0xdddddd); // cuerpo
    g.circle(0, -34 * s, 16 * s).fill(0xffffff);                      // cabeza
    // tocado / plumas
    for (let i = -3; i <= 3; i++) {
      g.poly([i * 9 * s, -46 * s, i * 9 * s - 4 * s, -70 * s, i * 9 * s + 4 * s, -70 * s]).fill(0xffffff);
    }
    g.circle(-8 * s, -34 * s, 3 * s).fill(0x330000);
    g.circle(8 * s, -34 * s, 3 * s).fill(0x330000);
    return g;
  },
};

class Enemigo extends EntidadConSalud {
  constructor(x, y, base, dificultad = 1) {
    super(x, y, base.vista, Math.round(base.vida * dificultad));
    this.tipo            = base.tipo;
    this.dano            = base.dano;
    this.velocidad       = base.velocidad;
    this.espiritualidad  = base.espiritualidad;
    this.xpDrop          = base.xp;
    this.knockbackResist = base.kbResist || 0;
    this.rangoAtaque     = base.rango || 26;
    this.estacionario    = !!base.estacionario;
    this.cooldownAtaque  = 0;
    this.cooldownMax     = base.cdAtaque || 55;
    this.esElite         = false;   // marcado por Game (suelta tótem de oro)
    this.esBoss          = false;

    this.sprite.tint = base.color;
    this._colorBase  = base.color;
    if (base.alpha != null) this.sprite.alpha = base.alpha;
    this._t = Math.random() * 6.28; // fase para wobble
  }

  update(delta, jugador, ctx) {
    if (this.cooldownAtaque > 0) this.cooldownAtaque -= delta;

    if (!this.estacionario) {
      const dx = jugador.x - this.x;
      const dy = jugador.y - this.y;
      const dist = Math.hypot(dx, dy) || 1;

      // Sombra: trayectoria ondulante
      let perpX = 0, perpY = 0;
      if (this.tipo === "sombra") {
        this._t += 0.12 * delta;
        perpX = (-dy / dist) * Math.sin(this._t) * 0.6;
        perpY = (dx / dist) * Math.sin(this._t) * 0.6;
      }

      if (dist > this.rangoAtaque - 4) {
        this.x += ((dx / dist) + perpX) * this.velocidad * delta;
        this.y += ((dy / dist) + perpY) * this.velocidad * delta;
      }
      if (dx < 0) this.sprite.scale.x = -Math.abs(this.sprite.scale.x);
      else if (dx > 0) this.sprite.scale.x = Math.abs(this.sprite.scale.x);
    }

    // Ataque por contacto
    const d = this.distanciaA(jugador);
    if (d < this.rangoAtaque && this.cooldownAtaque <= 0) {
      this.cooldownAtaque = this.cooldownMax;
      if (jugador.recibirDano(this.dano)) ctx.gameOver();
    }

    this.regenerar(delta);
  }

  recibirDano(cantidad) {
    const m = super.recibirDano(cantidad);
    this.flash(0xffffff, 5);
    return m;
  }

  empujar(desdeX, desdeY, fuerza) {
    if (this.knockbackResist >= 1 || this.esBoss) return;
    const dx = this.x - desdeX, dy = this.y - desdeY;
    const dist = Math.hypot(dx, dy) || 1;
    const f = fuerza * (1 - this.knockbackResist);
    this.x += (dx / dist) * f;
    this.y += (dy / dist) * f;
  }
}

/* ---------------- Subclases ---------------- */

class Guerrero extends Enemigo {
  constructor(x, y, dif = 1) {
    super(x, y, {
      tipo: "guerrero", vista: _Vistas.guerrero(1), color: 0xc0392b,
      vida: 18, dano: 6, velocidad: 0.85, espiritualidad: 1, xp: 1, cdAtaque: 55,
    }, dif);
  }
}

class Bestia extends Enemigo {
  constructor(x, y, dif = 1) {
    super(x, y, {
      tipo: "bestia", vista: _Vistas.bestia(1), color: 0x6b4226,
      vida: 30, dano: 9, velocidad: 1.9, espiritualidad: 2, xp: 3, cdAtaque: 45, rango: 28,
    }, dif);
  }
}

class Sombra extends Enemigo {
  constructor(x, y, dif = 1) {
    super(x, y, {
      tipo: "sombra", vista: _Vistas.sombra(1), color: 0x7d3cff, alpha: 0.72,
      vida: 10, dano: 12, velocidad: 2.7, espiritualidad: 3, xp: 5, cdAtaque: 40, rango: 24,
    }, dif);
  }
}

class Hechicero extends Enemigo {
  constructor(x, y, dif = 1) {
    super(x, y, {
      tipo: "hechicero", vista: _Vistas.hechicero(1), color: 0x2980b9,
      vida: 55, dano: 0, velocidad: 0, espiritualidad: 5, xp: 10,
      estacionario: true, cdAtaque: 120, rango: 9999,
    }, dif);
    this.cooldownAtaque = 60 + Math.random() * 60;
  }
  update(delta, jugador, ctx) {
    if (this.cooldownAtaque > 0) this.cooldownAtaque -= delta;
    if (this.cooldownAtaque <= 0) {
      this.cooldownAtaque = this.cooldownMax;
      ctx.enemigoDispara(this.x, this.y, jugador.x, jugador.y, 8);
    }
    this.regenerar(delta);
  }
}

class Golem extends Enemigo {
  constructor(x, y, dif = 1) {
    super(x, y, {
      tipo: "golem", vista: _Vistas.golem(1), color: 0x95a5a6,
      vida: 180, dano: 18, velocidad: 0.55, espiritualidad: 10, xp: 30,
      kbResist: 0.85, cdAtaque: 75, rango: 34,
    }, dif);
  }
}

class ChamanUsurpador extends Enemigo {
  constructor(x, y, dif = 1) {
    super(x, y, {
      tipo: "chaman", vista: _Vistas.chaman(1), color: 0xc89222,
      vida: 4500, dano: 30, velocidad: 0.6, espiritualidad: 0, xp: 0,
      kbResist: 1, cdAtaque: 90, rango: 60,
    }, dif);
    this.esBoss = true;
    this.cooldownHabilidad = 180;
  }
  update(delta, jugador, ctx) {
    // se acerca lento al jugador
    const dx = jugador.x - this.x, dy = jugador.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist > this.rangoAtaque - 6) {
      this.x += (dx / dist) * this.velocidad * delta;
      this.y += (dy / dist) * this.velocidad * delta;
    }
    if (this.cooldownAtaque > 0) this.cooldownAtaque -= delta;
    if (dist < this.rangoAtaque && this.cooldownAtaque <= 0) {
      this.cooldownAtaque = this.cooldownMax;
      if (jugador.recibirDano(this.dano)) ctx.gameOver();
    }
    // habilidad: anillo de bolas de fuego
    this.cooldownHabilidad -= delta;
    if (this.cooldownHabilidad <= 0) {
      this.cooldownHabilidad = 200;
      const n = 12;
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2;
        ctx.enemigoDispara(this.x, this.y, this.x + Math.cos(ang) * 100, this.y + Math.sin(ang) * 100, 10);
      }
    }
    this.regenerar(delta);
  }
}
