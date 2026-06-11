class TotemFuego extends Totem {
  constructor(j, w) { super(j, w); this.id = "fuego"; this.aplicarEfecto(); }
  aplicarEfecto() { this.jugador.danoMult = this.jugador._danoBaseMult * Math.pow(1.1, this.nivel); }
}
