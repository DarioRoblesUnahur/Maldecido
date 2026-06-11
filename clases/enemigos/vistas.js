const _Vistas = {
  guerrero(s = 1) {
    const g = new PIXI.Graphics();
    g.roundRect(-7 * s, -6 * s, 14 * s, 18 * s, 3).fill(0xdddddd);
    g.circle(0, -12 * s, 6 * s).fill(0xffffff);
    g.rect(8 * s, -8 * s, 3 * s, 18 * s).fill(0xbbbbbb);
    return g;
  },
  bestia(s = 1) {
    const g = new PIXI.Graphics();
    g.ellipse(0, 0, 13 * s, 8 * s).fill(0xdddddd);
    g.poly([-13 * s, -4 * s, -18 * s, -10 * s, -10 * s, -8 * s]).fill(0xffffff);
    g.poly([8 * s, -6 * s, 11 * s, -14 * s, 13 * s, -5 * s]).fill(0xffffff);
    g.circle(-12 * s, -5 * s, 1.6 * s).fill(0x441111);
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
    g.poly([-11 * s, 14 * s, 11 * s, 14 * s, 5 * s, -8 * s, -5 * s, -8 * s]).fill(0xdddddd);
    g.poly([-7 * s, -6 * s, 7 * s, -6 * s, 0, -20 * s]).fill(0xffffff);
    g.circle(0, -8 * s, 4 * s).fill(0x110022);
    return g;
  },
  golem(s = 1) {
    const g = new PIXI.Graphics();
    g.roundRect(-15 * s, -14 * s, 30 * s, 28 * s, 6).fill(0xcccccc);
    g.roundRect(-19 * s, -6 * s, 7 * s, 16 * s, 3).fill(0xbbbbbb);
    g.roundRect(12 * s, -6 * s, 7 * s, 16 * s, 3).fill(0xbbbbbb);
    g.rect(-9 * s, -7 * s, 5 * s, 3 * s).fill(0x552200);
    g.rect(4 * s, -7 * s, 5 * s, 3 * s).fill(0x552200);
    return g;
  },
  chaman(s = 1) {
    const g = new PIXI.Graphics();
    g.roundRect(-26 * s, -20 * s, 52 * s, 56 * s, 10).fill(0xdddddd);
    g.circle(0, -34 * s, 16 * s).fill(0xffffff);
    for (let i = -3; i <= 3; i++) {
      g.poly([i * 9 * s, -46 * s, i * 9 * s - 4 * s, -70 * s, i * 9 * s + 4 * s, -70 * s]).fill(0xffffff);
    }
    g.circle(-8 * s, -34 * s, 3 * s).fill(0x330000);
    g.circle(8 * s, -34 * s, 3 * s).fill(0x330000);
    return g;
  },
};
