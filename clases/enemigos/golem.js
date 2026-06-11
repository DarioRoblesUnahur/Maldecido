class Golem extends Enemigo {
  constructor(x, y, dif = 1) {
    super(x, y, {
      tipo: "golem", vista: _Vistas.golem(1), color: 0x95a5a6,
      vida: 180, dano: 18, velocidad: 0.55, espiritualidad: 10, xp: 30,
      kbResist: 0.85, cdAtaque: 75, rango: 34,
    }, dif);
  }
}
