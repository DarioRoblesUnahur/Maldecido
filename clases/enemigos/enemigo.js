class Enemigo extends EntidadConSalud {
  constructor(x, y, base, dificultad = 1) {
    super(x, y, base.vista, Math.round(base.vida * dificultad));
    this.tipo            = base.tipo;
    this.dano            = base.dano;
    this.velocidad       = base.velocidad;
    this.espiritualidad  = base.espiritualidad;
    this.xpDrop          = base.xp;
    this.knockbackResist = base.kbResist || 0;
    this.rangoAtaque     = base.rango || 26;
    this.estacionario    = !!base.estacionario;
    this.cooldownAtaque  = 0;
    this.cooldownMax     = base.cdAtaque || 55;
    this.esElite         = false;
    this.esBoss          = false;

    this.sprite.tint = base.color;
    this._colorBase  = base.color;
    if (base.alpha != null) this.sprite.alpha = base.alpha;
    this._t = Math.random() * 6.28;
  }

  update(delta, jugador, ctx) {
    if (this.cooldownAtaque > 0) this.cooldownAtaque -= delta;

    if (!this.estacionario) {
      const dx = jugador.x - this.x;
      const dy = jugador.y - this.y;
      const dist = Math.hypot(dx, dy) || 1;

      let perpX = 0, perpY = 0;
      if (this.tipo === "sombra") {
        this._t += 0.12 * delta;
        perpX = (-dy / dist) * Math.sin(this._t) * 0.6;
        perpY = (dx / dist) * Math.sin(this._t) * 0.6;
      }

      if (dist > this.rangoAtaque - 4) {
        this.x += ((dx / dist) + perpX) * this.velocidad * delta;
        this.y += ((dy / dist) + perpY) * this.velocidad * delta;
      }
      if (dx < 0) this.sprite.scale.x = -Math.abs(this.sprite.scale.x);
      else if (dx > 0) this.sprite.scale.x = Math.abs(this.sprite.scale.x);
    }

    const d = this.distanciaA(jugador);
    if (d < this.rangoAtaque && this.cooldownAtaque <= 0) {
      this.cooldownAtaque = this.cooldownMax;
      if (jugador.recibirDano(this.dano)) ctx.gameOver();
    }

    this.regenerar(delta);
  }

  recibirDano(cantidad) {
    const m = super.recibirDano(cantidad);
    this.flash(0xffffff, 5);
    return m;
  }

  empujar(desdeX, desdeY, fuerza) {
    if (this.knockbackResist >= 1 || this.esBoss) return;
    const dx = this.x - desdeX, dy = this.y - desdeY;
    const dist = Math.hypot(dx, dy) || 1;
    const f = fuerza * (1 - this.knockbackResist);
    this.x += (dx / dist) * f;
    this.y += (dy / dist) * f;
  }
}
