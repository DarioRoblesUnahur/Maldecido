class Bestia extends Enemigo {
  constructor(x, y, dif = 1) {
    super(x, y, {
      tipo: "bestia", vista: _Vistas.bestia(1), color: 0xffffff,
      ...CONFIG.enemigos.bestia,
    }, dif);
  }
}
