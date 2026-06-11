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
