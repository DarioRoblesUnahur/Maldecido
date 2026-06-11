class TotemTierra extends Totem {
  constructor(j, w) { super(j, w); this.id = "tierra"; this.aplicarEfecto(); }
  aplicarEfecto() { this.jugador.reduccionDano = 1 - (1 - this.jugador._defBase) * Math.pow(0.9, this.nivel); }
}
