class JaguaresEspectrales extends Manifestacion {
  static id = "jaguares";
  constructor(jugador, world) {
    super(jugador, world);
    this.id = "jaguares";
    this.angulo = 0;
    this.felinos = [];
    this._reconstruir();
  }
  get cantidad() { return Math.min(CONFIG.armas.jaguares.maxFelinos, 1 + this.nivel); }
  get radio() { const c = CONFIG.armas.jaguares; return this.evolucionada ? c.radioEvo : c.radio; }
  _reconstruir() {
    this.felinos.forEach(f => f.destroy());
    this.felinos = [];
    for (let i = 0; i < this.cantidad; i++) {
      const s = 0.7;
      const g = new PIXI.Graphics();
      g.ellipse(0, 0, 13 * s, 8 * s).fill(0xdddddd);
      g.poly([-13 * s, -4 * s, -18 * s, -10 * s, -10 * s, -8 * s]).fill(0xffffff);
      g.poly([8 * s, -6 * s, 11 * s, -14 * s, 13 * s, -5 * s]).fill(0xffffff);
      g.circle(-12 * s, -5 * s, 1.6 * s).fill(0x441111);
      g.tint = this.evolucionada ? 0xff7722 : 0xffcf66;
      g.alpha = 0.9;
      this.world.addChild(g);
      this.felinos.push(g);
    }
  }
  subirNivel() { super.subirNivel(); this._reconstruir(); }
  evolucionar() { super.evolucionar(); this._reconstruir(); }
  update(delta, enemigos) {
    const c = CONFIG.armas.jaguares;
    this.angulo += (c.giroBase + this.nivel * c.giroPorNivel) * delta;
    const dpsPorFelino = (c.dpsBase + this.nivel * c.dpsPorNivel);
    const danoFrame = this._dmg(dpsPorFelino) / 60 * delta;
    const golpeRadio = this.evolucionada ? c.golpeRadioEvo : c.golpeRadio;
    for (let i = 0; i < this.felinos.length; i++) {
      const a = this.angulo + (i / this.felinos.length) * Math.PI * 2;
      const fx = this.jugador.x + Math.cos(a) * this.radio;
      const fy = this.jugador.y + Math.sin(a) * this.radio;
      const f = this.felinos[i];
      f.x = fx; f.y = fy;
      for (const e of enemigos) {
        if (e.distanciaXY(fx, fy) < golpeRadio + c.golpeMargen) {
          e.recibirDano(danoFrame);
          if (this.evolucionada) e.empujar(fx, fy, c.empujeEvo * delta);
        }
      }
    }
  }
  destroy() { this.felinos.forEach(f => f.destroy()); this.felinos = []; }
}
