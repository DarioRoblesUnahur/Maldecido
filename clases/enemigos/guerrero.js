class Guerrero extends Enemigo {
  constructor(x, y, dif = 1) {
    super(x, y, {
      tipo: "guerrero", vista: _Vistas.guerrero(1), color: 0xc0392b,
      vida: 18, dano: 6, velocidad: 0.85, espiritualidad: 1, xp: 1, cdAtaque: 55,
    }, dif);
  }
}
