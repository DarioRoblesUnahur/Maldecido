/* ============================================================
   Jugador extends EntidadConSalud
   Movimiento manual (WASD / flechas). Ataques automáticos vía
   las Manifestaciones. Stats modificados por los tótems pasivos.
   ============================================================ */
class Jugador extends EntidadConSalud {
  constructor(x, y, texRun, texIdle, texMuerte) {
    function buildFrames(tex, row, count) {
      const out = [];
      for (let i = 0; i < count; i++) {
        out.push(new PIXI.Texture({
          source: tex.source,
          frame: new PIXI.Rectangle(i * 64, row * 64, 64, 64),
        }));
      }
      return out;
    }

    // Filas del spritesheet: 0=arriba, 1=izquierda, 2=abajo, 3=derecha
    const framesIdle   = buildFrames(texIdle, 2, 2); // idle mirando abajo, 2 frames
    const framesMuerte = buildFrames(texMuerte, 0, 6);
    const framesRun = {
      up:    buildFrames(texRun, 0, 8),
      left:  buildFrames(texRun, 1, 8),
      down:  buildFrames(texRun, 2, 8),
      right: buildFrames(texRun, 3, 8),
    };

    const spr = new PIXI.AnimatedSprite(framesIdle);
    spr.anchor.set(0.5);
    spr.scale.set(1.30);
    spr.animationSpeed = 0.12;
    spr.play();
    super(x, y, spr, 100);

    this._framesIdle   = framesIdle;
    this._framesRun    = framesRun;
    this._framesMuerte = framesMuerte;
    this._estadoAnim   = 'idle'; // 'idle' | 'run' | 'muerte'
    this._dirAnim      = 'down'; // última dirección de movimiento

    this.velocidadBase = 3.2;

    //radio para las colisiones
    this.radio = 14;

    // Multiplicadores de los tótems (GDD §4.2)
    this.danoMult       = 1;   // tótem de fuego
    this.velocidadMult  = 1;   // tótem de aire
    // (defensa y regen viven en EntidadConSalud: reduccionDano / regenPorSeg)

    // Progresión en partida
    this.nivel = 1;
    this.xp = 0;
    this.xpSiguiente = 5;

    // Multitarea / Trance (GDD §3.2) — nivel narrativo según nivel de jugador
    this.trance = 0; // 0 fragmentada, 1 cuerpo astral, 2 trance divino

    // Inventario de manifestaciones (armas/habilidades) y tótems
    this.manifestaciones = [];   // instancias de Manifestacion
    this.maxArmas        = 4;    // ranuras de daño base (ampliable por altar)
    this.maxTotems       = 4;

    // Recolección
    this.radioRecoleccion = 70;  // ampliado por "Bendición de la Tierra"

    this.keys = {};
    this._onDown = (e) => { this.keys[e.key.toLowerCase()] = true; };
    this._onUp   = (e) => { this.keys[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", this._onDown);
    window.addEventListener("keyup", this._onUp);

    this._colorBase = 0xffffff;
  }

  update(delta) {
    let dx = 0, dy = 0;
    if (this.keys["w"] || this.keys["arrowup"])    dy -= 1;
    if (this.keys["s"] || this.keys["arrowdown"])  dy += 1;
    if (this.keys["a"] || this.keys["arrowleft"])  dx -= 1;
    if (this.keys["d"] || this.keys["arrowright"]) dx += 1;

    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

    const v = this.velocidadBase * this.velocidadMult;
    this.x += dx * v * delta;
    this.y += dy * v * delta;

    const moving = dx !== 0 || dy !== 0;
    if (this._estadoAnim !== 'muerte') {
      if (moving) {
        // Dirección dominante: horizontal tiene prioridad sobre vertical
        let dir;
        if (Math.abs(dx) >= Math.abs(dy)) {
          dir = dx < 0 ? 'left' : 'right';
        } else {
          dir = dy < 0 ? 'up' : 'down';
        }

        if (this._estadoAnim !== 'run' || this._dirAnim !== dir) {
          this._estadoAnim = 'run';
          this._dirAnim = dir;
          this.sprite.textures = this._framesRun[dir];
          this.sprite.animationSpeed = 0.18;
          this.sprite.gotoAndPlay(0);
        }
      } else if (this._estadoAnim !== 'idle') {
        this._estadoAnim = 'idle';
        this.sprite.textures = this._framesIdle;
        this.sprite.animationSpeed = 0.12;
        this.sprite.gotoAndPlay(0);
      }
      this.sprite.scale.x = Math.abs(this.sprite.scale.x); // sin flip horizontal
    }

    this.regenerar(delta);
  }

  recibirDano(cantidad) {
    const muerto = super.recibirDano(cantidad);
    this.flash(0xff3333, 9);
    if (muerto && this._estadoAnim !== 'muerte') {
      this._estadoAnim = 'muerte';
      this.sprite.textures = this._framesMuerte;
      this.sprite.loop = false;
      this.sprite.animationSpeed = 0.15;
      this.sprite.gotoAndPlay(0);
    }
    return muerto;
  }

  ganarXP(cant) {
    this.xp += cant;
    let subio = false;
    while (this.xp >= this.xpSiguiente) {
      this.xp -= this.xpSiguiente;
      this.nivel++;
      // curva de XP
      this.xpSiguiente = Math.round(5 + this.nivel * 3 + this.nivel * this.nivel * 0.4);
      this._actualizarTrance();
      subio = true;
    }
    return subio; // true => corresponde mostrar selección de mejoras
  }

  _actualizarTrance() {
    if (this.nivel >= 13) this.trance = 2;
    else if (this.nivel >= 6) this.trance = 1;
    else this.trance = 0;
  }

  get nombreTrance() {
    return ["Mente Fragmentada", "Cuerpo Astral", "Trance Divino"][this.trance];
  }

  tieneManifestacion(id) {
    return this.manifestaciones.some(m => m.id === id);
  }
  obtenerManifestacion(id) {
    return this.manifestaciones.find(m => m.id === id);
  }

  destroy() {
    window.removeEventListener("keydown", this._onDown);
    window.removeEventListener("keyup", this._onUp);
    super.destroy();
  }
}
