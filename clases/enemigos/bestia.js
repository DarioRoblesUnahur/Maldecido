class Bestia extends Enemigo {
  constructor(x, y, dif = 1) {
    super(x, y, {
      tipo: "bestia", vista: _Vistas.bestia(1), color: 0xffffff,
      vida: 30, dano: 9, velocidad: 1.9, espiritualidad: 2, xp: 3, cdAtaque: 45, rango: 28,
    }, dif);
  }
}
