class EstallidoDeHuaca extends Manifestacion {
  static id = "huaca";
  constructor(jugador, world) {
    super(jugador, world);
    this.id = "huaca";
    this.ondas = [];
    this.marcas = [];
  }
  get cdDisparo() { const c = CONFIG.armas.huaca; return Math.max(c.cdMin, c.cdBase - this.nivel * c.cdPorNivel); }
  get radioMax() { const c = CONFIG.armas.huaca; return c.radioBase + this.nivel * c.radioPorNivel; }
  update(delta, enemigos) {
    this.cooldown -= delta;
    if (this.cooldown <= 0) {
      this.cooldown = this.cdDisparo;
      this._lanzarOnda();
    }
    this._actualizarOndas(delta, enemigos);
    this._actualizarMarcas(delta, enemigos);
  }

  // Crea una onda expansiva; si está evolucionada, deja además una marca en el suelo.
  _lanzarOnda() {
    const g = new PIXI.Graphics();
    g.x = this.jugador.x; g.y = this.jugador.y;
    this.world.addChild(g);
    this.ondas.push({ g, r: 10, x: this.jugador.x, y: this.jugador.y, golpeados: new Set() });

    if (this.evolucionada) {
      const m = new PIXI.Graphics();
      m.x = this.jugador.x; m.y = this.jugador.y;
      this.world.addChildAt(m, 0);
      const cm = CONFIG.armas.huaca.marca;
      this.marcas.push({ g: m, x: this.jugador.x, y: this.jugador.y, r: this.radioMax * cm.factorRadio, vida: cm.vida, explotó: false });
    }
  }

  _actualizarOndas(delta, enemigos) {
    const c = CONFIG.armas.huaca;
    const knock = c.knockBase + this.nivel * c.knockPorNivel;
    const dano = this._dmg(c.danoBase + this.nivel * c.danoPorNivel);
    for (let i = this.ondas.length - 1; i >= 0; i--) {
      const o = this.ondas[i];
      o.r += c.velocidadOnda * delta;
      o.g.clear();
      o.g.circle(0, 0, o.r).stroke({ width: 6, color: 0x66e0ff, alpha: Math.max(0, 1 - o.r / this.radioMax) });
      for (const e of enemigos) {
        const d = e.distanciaXY(o.x, o.y);
        if (Math.abs(d - o.r) < c.grosorOnda && !o.golpeados.has(e)) {
          o.golpeados.add(e);
          e.recibirDano(dano);
          e.empujar(o.x, o.y, knock);
        }
      }
      if (o.r >= this.radioMax) { o.g.destroy(); this.ondas.splice(i, 1); }
    }
  }

  _actualizarMarcas(delta, enemigos) {
    const cm = CONFIG.armas.huaca.marca;
    const danoMarca = this._dmg(cm.danoBase + this.nivel * cm.danoPorNivel);
    for (let i = this.marcas.length - 1; i >= 0; i--) {
      const m = this.marcas[i];
      m.vida -= delta;
      m.g.clear();
      m.g.circle(0, 0, m.r).fill({ color: 0x3399ff, alpha: 0.18 + (1 - m.vida / cm.vida) * 0.2 });
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
