class TotemSacrificio extends Totem {
  constructor(j, w) { super(j, w); this.id = "sacrificio"; this.aplicarEfecto(); }
  // Robo de vida global: cura un % del daño infligido a los enemigos.
  // Se suma aparte del robo propio del arma (ej. Macuahuitl).
  aplicarEfecto() {
    const c = CONFIG.totems.sacrificio;
    this.jugador.roboVida = this.jugador._roboBase + c.roboBase + c.roboPorNivel * (this.nivel - 1);
  }
}
