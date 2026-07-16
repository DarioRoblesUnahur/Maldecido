class Esqueleto extends Enemigo {
  constructor(x, y, dif = 1) {
    super(x, y, {
      tipo: "esqueleto", vista: _Vistas.esqueleto(1), color: 0xffffff,
      ...CONFIG.enemigos.esqueleto,
    }, dif);
  }
}
