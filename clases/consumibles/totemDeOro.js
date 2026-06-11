class TotemDeOro extends ObjetoConsumible {
  constructor(x, y) {
    const c = new PIXI.Container();
    const halo = new PIXI.Graphics();
    halo.circle(0, 0, 22).fill({ color: 0xffcc00, alpha: 0.18 });
    const g = new PIXI.Graphics();
    g.roundRect(-9, -16, 18, 32, 4).fill(0xf0c040);
    g.poly([-9, -16, 9, -16, 0, -26]).fill(0xffe080);
    g.circle(0, -4, 5).fill(0x7a4a00);
    g.rect(-9, 4, 18, 3).fill(0x7a4a00);
    c.addChild(halo, g);
    super(x, y, c, 0);
    this.tipo = "totemOro";
    this.halo = halo;
  }

  update(delta, jugador) {
    this._t += 0.1 * delta;
    if (this.halo) this.halo.scale.set(1 + Math.sin(this._t) * 0.12);
    return super.update(delta, jugador);
  }

  recoger(jugador) {
    jugador._totemOroPendiente = true;
    return true;
  }
}
