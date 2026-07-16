class Enemigo extends EntidadConSalud {
  constructor(x, y, base, dificultad = 1) {
    super(x, y, base.vista, Math.round(base.vida * dificultad));
    this.tipo = base.tipo;
    this.dano = base.dano;
    this.velocidad = base.velocidad;
    this.espiritualidad = base.espiritualidad;
    this.xpDrop = base.xp;
    this.knockbackResist = base.kbResist || 0;
    this.rangoAtaque = base.rango || 26;
    this.estacionario = !!base.estacionario;
    this.radio = base.radio || 12;
    this.cooldownAtaque = 0;
    this._danoAcum = 0;   // daño recibido aún no mostrado
    this._danoTimer = 0;  // frames hasta poder mostrar otro número
    this.cooldownMax = base.cdAtaque || 55;
    this.esElite = false;
    this.esBoss = false;

    this.sprite.tint = base.color;
    this._colorBase = base.color;
    if (base.alpha != null) this.sprite.alpha = base.alpha;
    this._t = Math.random() * 6.28;
  }

  update(delta, jugador, ctx) {
    if (this.cooldownAtaque > 0) this.cooldownAtaque -= delta;
    this._actualizarTextoDano(delta);
    if (!this.estacionario) this._perseguir(jugador, delta);
    this._intentarAtacar(jugador, ctx);
    this.regenerar(delta);
  }

  _perseguir(jugador, delta) {
    const dx = jugador.x - this.x;
    const dy = jugador.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;

    // los hombres reptil avanzan zigzagueando (componente perpendicular oscilante)
    let perpX = 0, perpY = 0;
    if (this.tipo === "hombreReptil") {
      this._t += 0.12 * delta;
      perpX = (-dy / dist) * Math.sin(this._t) * 0.6;
      perpY = (dx / dist) * Math.sin(this._t) * 0.6;
    }

    if (dist > this.rangoAtaque - 4) {
      this.x += ((dx / dist) + perpX) * this.velocidad * delta;
      this.y += ((dy / dist) + perpY) * this.velocidad * delta;
    }
    this._orientarSprite(dx);
  }

  // sprites orientados a la izquierda: positivo = izq, negativo = der
  _orientarSprite(dx) {
    if (dx < 0) this.sprite.scale.x = Math.abs(this.sprite.scale.x);
    else if (dx > 0) this.sprite.scale.x = -Math.abs(this.sprite.scale.x);
  }

  _intentarAtacar(jugador, ctx) {
    const d = this.distanciaA(jugador);
    const alcance = Math.max(this.rangoAtaque, this.radio + jugador.radio + 2);
    if (d < alcance && this.cooldownAtaque <= 0) {
      this.cooldownAtaque = this.cooldownMax;
      if (jugador.recibirDano(this.dano)) ctx.gameOver();
    }
  }
  _actualizarTextoDano(delta) {
    if (this._danoTimer > 0) this._danoTimer -= delta;
    if (this._danoAcum >= 1 && this._danoTimer <= 0) {
      Enemigo.mostrarDano?.(this.x, this.y - 28, Math.round(this._danoAcum));
      this._danoAcum = 0;
      this._danoTimer = 20;
    }
  }
  recibirDano(cantidad) {
    const m = super.recibirDano(cantidad);
    this.flash(0xff9999, 5);
    this._danoAcum += cantidad;
    Enemigo.alRecibirDano?.(cantidad); // robo de vida global (Tótem de Sacrificio)
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
