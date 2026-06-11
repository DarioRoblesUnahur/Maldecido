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
        const g = _Vistas.bestia(0.8);
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
