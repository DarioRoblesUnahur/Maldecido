class TotemFuego extends Totem {
  constructor(j, w) { super(j, w); this.id = "fuego"; this.aplicarEfecto(); }
  aplicarEfecto() { this.jugador.danoMult = this.jugador._danoBaseMult * Math.pow(CONFIG.totems.fuego.multPorNivel, this.nivel); }
}
