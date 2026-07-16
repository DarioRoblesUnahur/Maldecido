class BolasDeVeneno extends Manifestacion {
  static id = "veneno";
  constructor(jugador, world, capaSuelo) {
    super(jugador, world, capaSuelo);
    this.id = "veneno";
    this.orbes = [];
    this.charcos = [];
  }
  get cdDisparo() { const c = CONFIG.armas.veneno; return Math.max(c.cdMin, c.cdBase - this.nivel * c.cdPorNivel); }
  update(delta, enemigos) {
    this.cooldown -= delta;
    if (this.cooldown <= 0) {
      this.cooldown = this.cdDisparo;
      this._lanzarOrbe(enemigos);
    }
    this._actualizarOrbes(delta, enemigos);
    this._actualizarCharcos(delta, enemigos);
  }

  // Dispara un orbe hacia el enemigo más cercano (si hay alguno en rango).
  _lanzarOrbe(enemigos) {
    const c = CONFIG.armas.veneno;
    const obj = this._enemigoMasCercano(enemigos, c.alcance);
    if (!obj) return;
    const ang = Math.atan2(obj.y - this.jugador.y, obj.x - this.jugador.x);
    const g = new PIXI.Graphics();
    g.circle(0, 0, 6).fill(0x7CFC00);
    g.x = this.jugador.x; g.y = this.jugador.y;
    this.world.addChild(g);
    this.orbes.push({ g, vx: Math.cos(ang) * c.orbe.velocidad, vy: Math.sin(ang) * c.orbe.velocidad, vida: c.orbe.vida });
  }

  // Mueve los orbes; al impactar (o expirar) dejan un charco venenoso.
  _actualizarOrbes(delta, enemigos) {
    for (let i = this.orbes.length - 1; i >= 0; i--) {
      const o = this.orbes[i];
      o.g.x += o.vx * delta; o.g.y += o.vy * delta; o.vida -= delta;
      let impacto = o.vida <= 0;
      for (const e of enemigos) {
        if (e.distanciaXY(o.g.x, o.g.y) < CONFIG.armas.veneno.orbe.radioImpacto) { impacto = true; break; }
      }
      if (impacto) {
        this._crearCharco(o.g.x, o.g.y);
        o.g.destroy(); this.orbes.splice(i, 1);
      }
    }
  }

  // Los charcos hacen daño por segundo mientras duran.
  _actualizarCharcos(delta, enemigos) {
    const c = CONFIG.armas.veneno;
    const dps = (c.dpsBase + this.nivel * c.dpsPorNivel) * (this.evolucionada ? c.multDpsEvo : 1);
    const danoFrame = this._dmg(dps) / 60 * delta;
    for (let i = this.charcos.length - 1; i >= 0; i--) {
      const c = this.charcos[i];
      c.vida -= delta;
      for (const e of enemigos) {
        if (e.distanciaXY(c.x, c.y) < c.r) e.recibirDano(danoFrame);
      }
      if (c.vida <= 0) { c.g.destroy(); this.charcos.splice(i, 1); }
    }
  }
  _crearCharco(x, y) {
    const c = CONFIG.armas.veneno.charco;
    const r = (c.radioBase + this.nivel * c.radioPorNivel) * (this.evolucionada ? c.multRadioEvo : 1);
    const g = new PIXI.Graphics();
    g.circle(0, 0, r).fill({ color: 0x3a8a1a, alpha: 0.4 });
    g.circle(0, 0, r * 0.6).fill({ color: 0x66dd33, alpha: 0.35 });
    g.x = x; g.y = y;
    this.capaSuelo.addChild(g);
    this.charcos.push({ g, x, y, r, vida: (c.vidaBase + this.nivel * c.vidaPorNivel) * (this.evolucionada ? c.multVidaEvo : 1) });
  }
  _enemigoMasCercano(enemigos, max) {
    let mejor = null, dist = max;
    for (const e of enemigos) {
      const d = e.distanciaA(this.jugador);
      if (d < dist) { dist = d; mejor = e; }
    }
    return mejor;
  }
  destroy() {
    this.orbes.forEach(o => o.g.destroy()); this.orbes = [];
    this.charcos.forEach(c => c.g.destroy()); this.charcos = [];
  }
}
