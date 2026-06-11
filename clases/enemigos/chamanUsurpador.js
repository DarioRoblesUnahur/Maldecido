class ChamanUsurpador extends Enemigo {
  constructor(x, y, dif = 1) {
    super(x, y, {
      tipo: "chaman", vista: _Vistas.chaman(1), color: 0xc89222,
      vida: 4500, dano: 30, velocidad: 0.6, espiritualidad: 0, xp: 0,
      kbResist: 1, cdAtaque: 90, rango: 60,
    }, dif);
    this.esBoss = true;
    this.cooldownHabilidad = 180;
  }

  update(delta, jugador, ctx) {
    const dx = jugador.x - this.x, dy = jugador.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist > this.rangoAtaque - 6) {
      this.x += (dx / dist) * this.velocidad * delta;
      this.y += (dy / dist) * this.velocidad * delta;
    }
    if (this.cooldownAtaque > 0) this.cooldownAtaque -= delta;
    if (dist < this.rangoAtaque && this.cooldownAtaque <= 0) {
      this.cooldownAtaque = this.cooldownMax;
      if (jugador.recibirDano(this.dano)) ctx.gameOver();
    }
    this.cooldownHabilidad -= delta;
    if (this.cooldownHabilidad <= 0) {
      this.cooldownHabilidad = 200;
      const n = 12;
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2;
        ctx.enemigoDispara(this.x, this.y, this.x + Math.cos(ang) * 100, this.y + Math.sin(ang) * 100, 10);
      }
    }
    this.regenerar(delta);
  }
}
