/* ============================================================
   ObjetosConsumibles (GDD §9)  — extienden GameObject.
     ObjetoConsumible (base)
       ├── OrbeDeExperiencia
       └── TotemDeOro
   Se mueven hacia el jugador cuando entran en su radio de
   recolección (imán) y se recogen al contacto.
   ============================================================ */
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
      if (dist < 16) return this.recoger(jugador); // true => recogido
    } else {
      // leve flotación
      this._t += 0.08 * delta;
      this.sprite.y += Math.sin(this._t) * 0.15;
    }
    return false;
  }

  recoger(/* jugador */) { return true; }
}

class OrbeDeExperiencia extends ObjetoConsumible {
  constructor(x, y, valor) {
    // color y tamaño según el valor del cristal (GDD §7)
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

class TotemDeOro extends ObjetoConsumible {
  constructor(x, y) {
    const c = new PIXI.Container();
    const halo = new PIXI.Graphics();
    halo.circle(0, 0, 22).fill({ color: 0xffcc00, alpha: 0.18 });
    const g = new PIXI.Graphics();
    g.roundRect(-9, -16, 18, 32, 4).fill(0xf0c040);
    g.poly([-9, -16, 9, -16, 0, -26]).fill(0xffe080);
    g.circle(0, -4, 5).fill(0x7a4a00);
    g.rect(-9, 4, 18, 3).fill(0x7a4a00);
    c.addChild(halo, g);
    super(x, y, c, 0);
    this.tipo = "totemOro";
    this.halo = halo;
  }
  update(delta, jugador) {
    this._t += 0.1 * delta;
    if (this.halo) this.halo.scale.set(1 + Math.sin(this._t) * 0.12);
    return super.update(delta, jugador);
  }
  recoger(jugador) {
    jugador._totemOroPendiente = true;
    return true;
  }
}
