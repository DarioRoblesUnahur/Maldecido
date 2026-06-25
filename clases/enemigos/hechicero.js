class Hechicero extends Enemigo {

  constructor(x, y, dif = 1, anguloAlCentro = 0) {
    const fila = Hechicero._filaDeAngulo(anguloAlCentro);
    super(x, y, {
      tipo: "hechicero", vista: _Vistas.hechicero(fila), color: 0xffffff,
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
  static _filaDeAngulo(a) {
    const deg = ((a * 180 / Math.PI) % 360 + 360) % 360;
    if (deg >= 45 && deg < 135) return 2; // abajo
    if (deg >= 135 && deg < 225) return 1; // izquierda
    if (deg >= 225 && deg < 315) return 0; // arriba
    return 3;                               // derecha
  }
}
