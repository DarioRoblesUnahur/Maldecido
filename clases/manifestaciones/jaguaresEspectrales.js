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
