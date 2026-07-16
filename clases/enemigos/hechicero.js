class Hechicero extends Enemigo {

  constructor(x, y, dif = 1, anguloAlCentro = 0) {
    const cfg = CONFIG.enemigos.hechicero;
    const fila = Hechicero._filaDeAngulo(anguloAlCentro);
    super(x, y, {
      tipo: "hechicero", vista: _Vistas.hechicero(fila), color: 0xffffff,
      estacionario: true,
      ...cfg,
    }, dif);
    // arranca desfasado para que no disparen todos juntos
    this.cooldownAtaque = cfg.esperaInicial + Math.random() * cfg.esperaAzar;
  }

  update(delta, jugador, ctx) {
    this._actualizarTextoDano(delta);
    if (this.cooldownAtaque > 0) this.cooldownAtaque -= delta;
    if (this.cooldownAtaque <= 0) {
      this.cooldownAtaque = this.cooldownMax;
      ctx.enemigoDispara(this.x, this.y, jugador.x, jugador.y, CONFIG.enemigos.hechicero.danoProyectil);
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
