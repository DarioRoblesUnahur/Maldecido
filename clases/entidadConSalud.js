/* ============================================================
   EntidadConSalud extends GameObject
   Todo lo que tiene vida: el Jugador y los Enemigos.
   ============================================================ */
class EntidadConSalud extends GameObject {
  constructor(x, y, vista, vidaMax) {
    super(x, y, vista);
    this.vidaMax = vidaMax;
    this.vida = vidaMax;

    this.reduccionDano = 0;   // 0..0.9  (defensa)
    this.regenPorSeg   = 0;   // vida/seg
    this._regenAcum    = 0;

    this._colorBase = 0xffffff;
    this._flashT    = 0;
  }

  // delta viene en "frames" (60fps => delta≈1). 1 seg ≈ 60 delta.
  regenerar(delta) {
    if (this.regenPorSeg > 0 && this.vida < this.vidaMax) {
      this._regenAcum += (this.regenPorSeg / 60) * delta;
      if (this._regenAcum >= 1) {
        const ganar = Math.floor(this._regenAcum);
        this.vida = Math.min(this.vidaMax, this.vida + ganar);
        this._regenAcum -= ganar;
      }
    }
    if (this._flashT > 0) {
      this._flashT -= delta;
      if (this._flashT <= 0 && this.sprite && !this.sprite.destroyed) {
        this.sprite.tint = this._colorBase;
      }
    }
  }

  flash(color = 0xffffff, frames = 6) {
    if (!this.sprite || this.sprite.destroyed) return;
    this.sprite.tint = color;
    this._flashT = frames;
  }

  // Devuelve true si murió.
  recibirDano(cantidad) {
    const real = cantidad * (1 - this.reduccionDano);
    this.vida = Math.max(0, this.vida - real);
    if (this.vida <= 0) {
      this.muerto = true;
      return true;
    }
    return false;
  }

  curar(cantidad) {
    this.vida = Math.min(this.vidaMax, this.vida + cantidad);
  }

  get vivo() { return this.vida > 0 && !this.muerto; }
}
