class HombreReptil extends Enemigo {
  constructor(x, y, dif = 1) {
    super(x, y, {
      tipo: "hombreReptil", vista: _Vistas.hombreReptil(1), color: 0xffffff,
      ...CONFIG.enemigos.hombreReptil,
    }, dif);
  }
}
