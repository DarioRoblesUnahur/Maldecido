class Totem extends Manifestacion {
  constructor(jugador, world) { super(jugador, world); this.esTotem = true; }
  subirNivel() { super.subirNivel(); this.aplicarEfecto(); }
  aplicarEfecto() {}
}
