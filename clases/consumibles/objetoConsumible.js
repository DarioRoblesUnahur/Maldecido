class ObjetoConsumible extends GameObject {
  constructor(x, y, vista, valor) {
    super(x, y, vista);
    this.valor = valor;
    this.atraido = false;
    this._t = Math.random() * 6.28;
  }

  update(delta, jugador) {
    const d = this.distanciaA(jugador);
    if (!this.atraido && d < jugador.radioRecoleccion) this.atraido = true;

    if (this.atraido) {
      const dx = jugador.x - this.x, dy = jugador.y - this.y;
      const dist = Math.hypot(dx, dy) || 1;
      const vel = Math.min(11, 3 + (jugador.radioRecoleccion - dist) * 0.12);
      this.x += (dx / dist) * vel * delta;
      this.y += (dy / dist) * vel * delta;
      if (dist < 16) return this.recoger(jugador);
    } else {
      this._t += 0.08 * delta;
      this.sprite.y += Math.sin(this._t) * 0.15;
    }
    return false;
  }

  recoger(/* jugador */) { return true; }
}
