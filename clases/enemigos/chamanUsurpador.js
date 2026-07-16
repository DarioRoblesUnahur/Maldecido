class ChamanUsurpador extends Enemigo {
  constructor(x, y, dif = 1) {
    super(x, y, {
      tipo: "chaman", vista: _Vistas.chaman(1), color: 0xffffff,
      ...CONFIG.enemigos.chaman,
    }, dif);
    this.esBoss = true;
    this.cooldownHabilidad = CONFIG.enemigos.chaman.cdHabilidad;
  }

  update(delta, jugador, ctx) {
    this._actualizarTextoDano(delta);
    const dx = jugador.x - this.x, dy = jugador.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;

    this._perseguir(dx, dy, dist, delta);
    if (this.cooldownAtaque > 0) this.cooldownAtaque -= delta;
    this._intentarAtacar(dist, jugador, ctx);
    this._actualizarHabilidad(delta, ctx);
    this.regenerar(delta);
  }

  _perseguir(dx, dy, dist, delta) {
    if (dist > this.rangoAtaque - 6) {
      this.x += (dx / dist) * this.velocidad * delta;
      this.y += (dy / dist) * this.velocidad * delta;
    }
  }

  _intentarAtacar(dist, jugador, ctx) {
    if (dist < this.rangoAtaque && this.cooldownAtaque <= 0) {
      this.cooldownAtaque = this.cooldownMax;
      if (jugador.recibirDano(this.dano)) ctx.gameOver();
    }
  }

  _actualizarHabilidad(delta, ctx) {
    this.cooldownHabilidad -= delta;
    if (this.cooldownHabilidad <= 0) {
      this.cooldownHabilidad = CONFIG.enemigos.chaman.cdHabilidadRecarga;
      this._lanzarRafaga(ctx);
    }
  }

  // Ráfaga circular de proyectiles en todas las direcciones.
  _lanzarRafaga(ctx) {
    const cfg = CONFIG.enemigos.chaman;
    const n = cfg.proyectilesRafaga;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2;
      ctx.enemigoDispara(this.x, this.y, this.x + Math.cos(ang) * 100, this.y + Math.sin(ang) * 100, cfg.danoProyectil);
    }
  }
}
