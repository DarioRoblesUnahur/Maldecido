class BolasDeVeneno extends Manifestacion {
  static id = "veneno";
  constructor(jugador, world) {
    super(jugador, world);
    this.id = "veneno";
    this.orbes = [];
    this.charcos = [];
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
