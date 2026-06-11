class TotemAgua extends Totem {
  constructor(j, w) { super(j, w); this.id = "agua"; this.aplicarEfecto(); }
  aplicarEfecto() { this.jugador.regenPorSeg = this.jugador._regenBase + 1.2 * this.nivel; }
}
