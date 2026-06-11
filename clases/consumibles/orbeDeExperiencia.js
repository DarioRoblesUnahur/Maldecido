class OrbeDeExperiencia extends ObjetoConsumible {
  constructor(x, y, valor) {
    let color = 0x4aa3ff, r = 4;
    if (valor >= 30)      { color = 0xffcc33; r = 8; }
    else if (valor >= 10) { color = 0xb060ff; r = 7; }
    else if (valor >= 5)  { color = 0x33e0e0; r = 6; }
    else if (valor >= 3)  { color = 0x66dd55; r = 5; }

    const g = new PIXI.Graphics();
    g.poly([0, -r, r, 0, 0, r, -r, 0]).fill(color);
    g.poly([0, -r, r, 0, 0, r, -r, 0]).stroke({ width: 1, color: 0xffffff, alpha: 0.5 });
    super(x, y, g, valor);
    this.tipo = "xp";
  }

  recoger(jugador) {
    jugador._xpPendiente = (jugador._xpPendiente || 0) + this.valor;
    return true;
  }
}
