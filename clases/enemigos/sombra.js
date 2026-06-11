class Sombra extends Enemigo {
  constructor(x, y, dif = 1) {
    super(x, y, {
      tipo: "sombra", vista: _Vistas.sombra(1), color: 0x7d3cff, alpha: 0.72,
      vida: 10, dano: 12, velocidad: 2.7, espiritualidad: 3, xp: 5, cdAtaque: 40, rango: 24,
    }, dif);
  }
}
