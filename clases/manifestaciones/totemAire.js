class TotemAire extends Totem {
  constructor(j, w) { super(j, w); this.id = "aire"; this.aplicarEfecto(); }
  aplicarEfecto() { this.jugador.velocidadMult = this.jugador._velBaseMult * Math.pow(CONFIG.totems.aire.multPorNivel, this.nivel); }
}
