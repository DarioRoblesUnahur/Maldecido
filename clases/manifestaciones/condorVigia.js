class CondorVigia extends Manifestacion {
  static id = "condor";
  constructor(jugador, world) {
    super(jugador, world);
    this.id = "condor";
    this.picadas = [];
  }
  get cdDisparo() { const c = CONFIG.armas.condor; return Math.max(c.cdMin, c.cdBase - this.nivel * c.cdPorNivel); }
  update(delta, enemigos) {
    this.cooldown -= delta;
    if (this.cooldown <= 0 && enemigos.length) {
      this.cooldown = this.cdDisparo;
      this._lanzarPicada(enemigos);
    }
    this._actualizarPicadas(delta, enemigos);
  }

  // Elige un enemigo cercano al azar y prepara una picada sobre él.
  _lanzarPicada(enemigos) {
    const c = CONFIG.armas.condor;
    const cercanos = enemigos.filter(e => e.distanciaA(this.jugador) < c.alcance);
    if (!cercanos.length) return;
    const obj = cercanos[Math.floor(Math.random() * cercanos.length)];
    const g = _Vistas.bestia(0.8);
    g.tint = 0x88ccff; g.rotation = Math.PI / 2;
    g.x = obj.x; g.y = obj.y - c.picada.altura;
    this.world.addChild(g);
    this.picadas.push({ g, obj, ox: obj.x, oy: obj.y, t: 0, total: c.picada.duracion, hecho: false });
  }

  // Baja el cóndor hacia el objetivo y aplica daño en área al tocar el suelo.
  _actualizarPicadas(delta, enemigos) {
    const c = CONFIG.armas.condor;
    for (let i = this.picadas.length - 1; i >= 0; i--) {
      const p = this.picadas[i];
      p.t += delta;
      const tx = (p.obj && !p.obj.muerto) ? p.obj.x : p.ox;
      const ty = (p.obj && !p.obj.muerto) ? p.obj.y : p.oy;
      const k = Math.min(1, p.t / p.total);
      p.g.x = tx; p.g.y = ty - c.picada.altura * (1 - k);
      if (!p.hecho && k >= 1) {
        p.hecho = true;
        const dano = this._dmg(c.danoBase + this.nivel * c.danoPorNivel) * (this.evolucionada ? c.multDanoEvo : 1);
        const radio = this.evolucionada ? c.radioEvo : c.radio;
        for (const e of enemigos) {
          if (e.distanciaXY(tx, ty) < radio) e.recibirDano(dano);
        }
      }
      if (p.t > p.total + c.picada.extra) { p.g.destroy(); this.picadas.splice(i, 1); }
    }
  }
  destroy() { this.picadas.forEach(p => p.g.destroy()); this.picadas = []; }
}
