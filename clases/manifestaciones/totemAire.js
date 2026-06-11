class TotemAire extends Totem {
  constructor(j, w) { super(j, w); this.id = "aire"; this.aplicarEfecto(); }
  aplicarEfecto() { this.jugador.velocidadMult = this.jugador._velBaseMult * Math.pow(1.1, this.nivel); }
}
