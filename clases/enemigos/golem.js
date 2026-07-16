class Golem extends Enemigo {
  constructor(x, y, dif = 1) {
    super(x, y, {
      tipo: "golem", vista: _Vistas.golem(1), color: 0xffffff,
      ...CONFIG.enemigos.golem,
    }, dif);
  }
}
