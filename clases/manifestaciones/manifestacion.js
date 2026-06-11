class Manifestacion {
  constructor(jugador, world) {
    this.jugador = jugador;
    this.world = world;
    this.nivel = 1;
    this.cooldown = 0;
    this.evolucionada = false;
    this.esTotem = false;
  }
  _dmg(base) { return base * this.jugador.danoMult; }
  subirNivel() { this.nivel++; }
  evolucionar() { this.evolucionada = true; }
  update(/* delta, enemigos */) {}
  destroy() {}
}
