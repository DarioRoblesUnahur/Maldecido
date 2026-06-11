/* ============================================================
   GameObject  —  raíz de la jerarquía (ver GDD §9)
   GameObject
     ├── EntidadConSalud (Jugador, Enemigos)
     └── ObjetoConsumible (OrbeDeExperiencia, TotemDeOro)
   ============================================================
   Cada GameObject envuelve un display object de Pixi (this.sprite),
   que la subclase construye y pasa hacia arriba en super().
*/
class GameObject {
  constructor(x, y, vista) {
    this.sprite = vista || new PIXI.Container();
    this.sprite.x = x;
    this.sprite.y = y;
    this.muerto = false;
  }

  get x() { return this.sprite.x; }
  set x(v) { this.sprite.x = v; }
  get y() { return this.sprite.y; }
  set y(v) { this.sprite.y = v; }

  distanciaA(obj) {
    return Math.hypot(this.x - obj.x, this.y - obj.y);
  }

  distanciaXY(px, py) {
    return Math.hypot(this.x - px, this.y - py);
  }

  // Llamado cada frame por el loop. Las subclases lo sobreescriben.
  update(/* delta, ctx */) {}

  destroy() {
    if (this.sprite && !this.sprite.destroyed) {
      this.sprite.destroy({ children: true });
    }
    this.muerto = true;
  }
}
