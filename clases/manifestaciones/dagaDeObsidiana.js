class DagaDeObsidiana extends Manifestacion {
  static id = "daga";

  constructor(jugador, world, capaSuelo) {
    super(jugador, world, capaSuelo);
    this.id = "daga";
    this.efectos = []; // destellos de golpe / arco del swing (visuales transitorios)
  }

  //////////
  // CONFIG (los números viven en CONFIG.armas.daga)
  //////////

  // Daga base: golpe rápido y de poco daño al enemigo más cercano.
  get cdGolpe()      { const c = CONFIG.armas.daga.golpe; return Math.max(c.cdMin, c.cdBase - this.nivel * c.cdPorNivel); }
  get danoGolpe()    { const c = CONFIG.armas.daga.golpe; return this._dmg(c.danoBase + this.nivel * c.danoPorNivel); }
  get alcanceGolpe() { return CONFIG.armas.daga.golpe.alcance; }
  get radioGolpe()   { return CONFIG.armas.daga.golpe.radio; }

  // Macuahuitl (evolución): corte en semicírculo hacia donde mira el jugador.
  get cdSwing()       { const c = CONFIG.armas.daga.macuahuitl; return Math.max(c.cdMin, c.cdBase - this.nivel * c.cdPorNivel); }
  get danoSwing()     { const c = CONFIG.armas.daga.macuahuitl; return this._dmg(c.danoBase + this.nivel * c.danoPorNivel); }
  get radioSwing()    { return CONFIG.armas.daga.macuahuitl.radio; }
  get roboVidaSwing() { return CONFIG.armas.daga.macuahuitl.roboVida; }
  get empujeSwing()   { return CONFIG.armas.daga.macuahuitl.empuje; }

  //////////
  // GAMELOOP
  //////////

  update(delta, enemigos) {
    this.cooldown -= delta;
    if (this.cooldown <= 0) {
      if (this.evolucionada) {
        this.cooldown = this.cdSwing;
        this._golpearEnSemicirculo(enemigos);
      } else {
        this.cooldown = this.cdGolpe;
        this._golpearAlMasCercano(enemigos);
      }
    }
    this._actualizarEfectos(delta);
  }

  //////////
  // DAGA — golpe al enemigo más cercano
  //////////

  _golpearAlMasCercano(enemigos) {
    const objetivo = this._enemigoMasCercano(enemigos, this.alcanceGolpe);
    if (!objetivo) return;
    // el golpe alcanza al objetivo y a lo que esté muy pegado a él
    for (const e of enemigos) {
      if (e.distanciaA(objetivo) <= this.radioGolpe) e.recibirDano(this.danoGolpe);
    }
    this._efectoGolpe(objetivo.x, objetivo.y);
  }

  //////////
  // MACUAHUITL — corte en semicírculo con robo de vida
  //////////

  _golpearEnSemicirculo(enemigos) {
    const ang = this._anguloMirada();
    let danoTotal = 0;
    for (const e of enemigos) {
      const dx = e.x - this.jugador.x;
      const dy = e.y - this.jugador.y;
      if (Math.hypot(dx, dy) > this.radioSwing) continue;
      const difAng = Math.abs(this._normalizarAngulo(Math.atan2(dy, dx) - ang));
      if (difAng > Math.PI / 2) continue; // fuera del semicírculo frontal
      e.recibirDano(this.danoSwing);
      e.empujar(this.jugador.x, this.jugador.y, this.empujeSwing);
      danoTotal += this.danoSwing;
    }
    if (danoTotal > 0) this.jugador.curar(danoTotal * this.roboVidaSwing);
    this._efectoSwing(ang);
  }

  // Ángulo (radianes) hacia donde mira el jugador, según su última dirección.
  _anguloMirada() {
    switch (this.jugador._dirAnim) {
      case 'right': return 0;
      case 'left':  return Math.PI;
      case 'up':    return -Math.PI / 2;
      default:      return Math.PI / 2; // 'down'
    }
  }

  // Lleva un ángulo al rango [-π, π].
  _normalizarAngulo(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  //////////
  // BÚSQUEDA
  //////////

  _enemigoMasCercano(enemigos, max) {
    let mejor = null;
    let dist = max;
    for (const e of enemigos) {
      const d = e.distanciaA(this.jugador);
      if (d < dist) { dist = d; mejor = e; }
    }
    return mejor;
  }

  //////////
  // EFECTOS VISUALES (transitorios)
  //////////

  _efectoGolpe(x, y) {
    const g = new PIXI.Graphics();
    g.poly([14, 0, -6, -6, -6, 6]).fill(0xffffff); // destello de tajo
    g.x = x; g.y = y;
    g.rotation = Math.random() * Math.PI;
    this.world.addChild(g);
    this.efectos.push({ g, vida: 8, total: 8 });
  }

  _efectoSwing(ang) {
    // wedge del semicírculo aproximado con un polígono
    const puntos = [0, 0];
    const pasos = 12;
    for (let i = 0; i <= pasos; i++) {
      const a = ang - Math.PI / 2 + (Math.PI * i / pasos);
      puntos.push(Math.cos(a) * this.radioSwing, Math.sin(a) * this.radioSwing);
    }
    const g = new PIXI.Graphics();
    g.poly(puntos).fill({ color: 0x9b30ff, alpha: 0.35 });
    g.x = this.jugador.x; g.y = this.jugador.y;
    this.world.addChild(g);
    this.efectos.push({ g, vida: 10, total: 10 });
  }

  _actualizarEfectos(delta) {
    for (let i = this.efectos.length - 1; i >= 0; i--) {
      const ef = this.efectos[i];
      ef.vida -= delta;
      ef.g.alpha = Math.max(0, ef.vida / ef.total);
      if (ef.vida <= 0) { ef.g.destroy(); this.efectos.splice(i, 1); }
    }
  }

  //////////
  // LIMPIEZA
  //////////

  destroy() {
    this.efectos.forEach(ef => ef.g.destroy());
    this.efectos = [];
  }
}
