/* ============================================================
   Game — orquestador de la incursión (estilo survival, GDD).
   Selva procedural, oleadas escaladas por tiempo, recolección
   de XP/Espiritualidad, subida de nivel con elección de
   manifestaciones, tótems de oro y el jefe final.

   API pública (la usa index.html):
     Game.start(), Game.pausar(), Game.reanudar(),
     Game.volverAlMenu(), Game._app, Game._running
   Todo el estado de una partida vive en la instancia (this).
   ============================================================ */
class Game {
  static _app = null;
  static _running = false;
  static _instancia = null;

  // Todos los números del juego se configuran en clases/config.js
  static TIEMPO_PARTIDA = CONFIG.partida.duracionMin * 60; // en segundos
  static FASES = CONFIG.partida.fases;

  // Nombre en config → clase, para la tabla CONFIG.spawns.composicion
  static CLASES_ENEMIGOS = { esqueleto: Esqueleto, bestia: Bestia, hombreReptil: HombreReptil, golem: Golem };

  //////////////////////////////////////////////////
  // API ESTÁTICA (control de la partida en curso)
  //////////////////////////////////////////////////

  static async start() {
    const juego = new Game();
    Game._instancia = juego;
    await juego._iniciar();
  }

  static pausar() {
    if (Game._app) { Game._app.ticker.stop(); Game._running = false; }
  }

  static reanudar() {
    if (Game._app) { Game._app.ticker.start(); Game._running = true; }
  }

  static volverAlMenu() {
    if (!Game._app) return;
    const app = Game._app;
    Game._app = null;
    Game._running = false;
    Game._instancia = null;

    app.ticker.stop();
    document.getElementById('game-canvas-container').innerHTML = '';
    ['hud', 'gameover', 'panel-nivel', 'panel-cofre', 'boss-wrap'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('visible');
    });
    document.getElementById('hud').style.display = '';
    document.getElementById('zona-label').classList.remove('show');
    document.getElementById('notif').classList.remove('show');

    app.destroy({ removeView: true, children: true, texture: true });
  }

  //////////////////////////////////////////////////
  // ESTADO
  //////////////////////////////////////////////////

  constructor() {
    // PIXI y capas de render
    this.app = null;
    this.texturas = null;
    this.floor = null;
    this.world = null;
    this.decoraciones = null;
    this.capaSuelo = null;        // quemaduras, charcos, marcas en el piso
    this.capaConsumibles = null;
    this.capaEnemigos = null;
    this.capaEfectos = null;

    // entidades
    this.jugador = null;
    this.barraJugador = null;
    this.flechaBoss = null;
    this.enemigos = [];
    this.consumibles = [];
    this.proyEnemigos = [];
    this.textosDano = [];

    // progreso de la partida
    this.segundos = 0;
    this.runEspiritualidad = 0;
    this.gameOver = false;
    this.gano = false;
    this.bossActivo = false;
    this.boss = null;
    this.faseActual = -1;
    this.colaNivel = 0;
    this.panelAbierto = false;

    // temporizadores de aparición (en frames)
    this.spawnTimer = CONFIG.spawns.normal.timerInicial;
    this.eliteTimer = CONFIG.spawns.elite.cadaSeg * 60;
    this.hechiceroTimer = CONFIG.spawns.hechiceros.cadaSeg * 60;
    this.hordaTimer = CONFIG.spawns.horda.cadaSeg * 60;
    this.shakeT = 0;

    // contexto que reciben los enemigos y estado interno de UI
    this.ctx = null;
    this._keySel = null;
    this._notifTimer = null;
    this._faseTimer = null;
  }

  //////////////////////////////////////////////////
  // ARRANQUE
  //////////////////////////////////////////////////

  async _iniciar() {
    const app = new PIXI.Application();
    this.app = app;
    Game._app = app;
    await app.init({ background: 0x0c1407, resizeTo: window, antialias: false });
    document.getElementById('game-canvas-container').appendChild(app.canvas);
    Game._running = true;

    await this._cargarAssets();
    this._crearSuelo();
    this._crearMundo();
    this._crearJugador();
    this._crearBarrasYFlecha();
    this._crearContextoEnemigos();

    this._actualizarHUDArmas();
    Enemigo.mostrarDano = (x, y, cantidad) => this._crearTextoDano(x, y, cantidad);
    Enemigo.alRecibirDano = (dano) => {
      if (this.jugador.roboVida > 0) this.jugador.curar(dano * this.jugador.roboVida);
    };

    app.ticker.add(ticker => this._loop(ticker.deltaTime));
    this._mostrarFase('🌴 La Selva Olvidada — ¡Sobreviví 30 minutos!');
  }

  async _cargarAssets() {
    const [playerRun, playerIdle, playerMuerte, esqueleto, bestia, reptil, golem, jefe, hechicero] =
      await Promise.all([
        PIXI.Assets.load('assets/playerWalk.png'),
        PIXI.Assets.load('assets/playerIdle.png'),
        PIXI.Assets.load('assets/playerMuerte.png'),
        PIXI.Assets.load('assets/esqueletoWalk.png'),
        PIXI.Assets.load('assets/hombreBestiaRun.png'),
        PIXI.Assets.load('assets/reptilRun.png'),
        PIXI.Assets.load('assets/golemWalk.png'),
        PIXI.Assets.load('assets/jefeFinalWalk.png'),
        PIXI.Assets.load('assets/magosShoot.png'),
      ]);
    this.texturas = { playerRun, playerIdle, playerMuerte, esqueleto, bestia, reptil, golem, jefe, hechicero };
    window._TEX = { esqueleto, bestia, reptil, golem, jefe, hechicero };
  }

  _crearSuelo() {
    const tileG = new PIXI.Graphics();
    tileG.rect(0, 0, 96, 96).fill(0x1c3312);
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * 96, y = Math.random() * 96, r = 2 + Math.random() * 5;
      const c = Math.random() < 0.5 ? 0x16280e : 0x24401a;
      tileG.circle(x, y, r).fill({ color: c, alpha: 0.7 });
    }
    const tileTex = this.app.renderer.generateTexture(tileG);
    this.floor = new PIXI.TilingSprite({ texture: tileTex, width: this.app.screen.width, height: this.app.screen.height });
    this.app.stage.addChild(this.floor);
  }

  _crearMundo() {
    this.world = new PIXI.Container();
    this.app.stage.addChild(this.world);

    this.decoraciones = new PIXI.Container();
    this.capaSuelo = new PIXI.Container();
    this.capaConsumibles = new PIXI.Container();
    this.capaEnemigos = new PIXI.Container();
    this.capaEnemigos.sortableChildren = true;
    this.capaEfectos = new PIXI.Container();

    this.world.addChild(this.decoraciones, this.capaSuelo, this.capaConsumibles, this.capaEnemigos);
    this._plantarVegetacion();
  }

  _plantarVegetacion() {
    const c = CONFIG.mundo;
    for (let i = 0; i < c.arboles; i++) {
      const x = (Math.random() - 0.5) * c.dispersion;
      const y = (Math.random() - 0.5) * c.dispersion;
      this.decoraciones.addChild(_arbol(x, y));
    }
  }

  _crearJugador() {
    const t = this.texturas;
    const jugador = new Jugador(0, 0, t.playerRun, t.playerIdle, t.playerMuerte);
    jugador.opcionesNivelUp = CONFIG.jugador.opcionesNivelUp;
    Altar.aplicarAJugador(jugador); // mejoras permanentes
    this.capaEnemigos.addChild(jugador.sprite);
    this.world.addChild(this.capaEfectos); // los efectos van por encima de los enemigos
    this.jugador = jugador;
    this._equiparArmaInicial();
  }

  _equiparArmaInicial() {
    // El arma principal: toda partida empieza con la Daga de Obsidiana.
    this.jugador.manifestaciones.push(new DagaDeObsidiana(this.jugador, this.capaEfectos, this.capaSuelo));
  }

  _crearBarrasYFlecha() {
    this.barraJugador = new PIXI.Graphics();
    this.world.addChild(this.barraJugador);

    this.flechaBoss = new PIXI.Graphics(); // apunta al jefe (en espacio de pantalla)
    this.app.stage.addChild(this.flechaBoss);
    this.flechaBoss.visible = false;
  }

  _crearContextoEnemigos() {
    this.ctx = {
      gameOver: () => this._triggerGameOver(),
      enemigoDispara: (x, y, tx, ty, dano) => this._enemigoDispara(x, y, tx, ty, dano),
    };
  }

  //////////////////////////////////////////////////
  // APARICIÓN DE ENEMIGOS
  //////////////////////////////////////////////////

  _dificultad() {
    return 1 + (this.segundos / 60) * CONFIG.partida.dificultadIncrementoPorMinuto;
  }

  _puntoBorde() {
    const c = CONFIG.spawns.borde;
    const ang = Math.random() * Math.PI * 2;
    const rad = Math.max(this.app.screen.width, this.app.screen.height) * c.factorPantalla + c.margen;
    return { x: this.jugador.x + Math.cos(ang) * rad, y: this.jugador.y + Math.sin(ang) * rad };
  }

  // Elige el tipo de enemigo según la tabla CONFIG.spawns.composicion.
  _tipoSegunFase() {
    const minutos = this.segundos / 60;
    const r = Math.random();
    const tramo = CONFIG.spawns.composicion.find(t => minutos < t.hastaMin);
    for (const [nombre, umbral] of tramo.tabla) {
      if (r < umbral) return Game.CLASES_ENEMIGOS[nombre];
    }
    return Game.CLASES_ENEMIGOS[tramo.tabla[tramo.tabla.length - 1][0]];
  }

  _spawnEnemigo(Clase, x, y) {
    const e = new Clase(x, y, this._dificultad());
    this.enemigos.push(e);
    this.capaEnemigos.addChild(e.sprite);
    return e;
  }

  _spawnElite() {
    const c = CONFIG.spawns.elite;
    const m = this.segundos / 60;
    const p = this._puntoBorde();
    const Clase = m >= 10 ? Golem : Esqueleto;
    const e = this._spawnEnemigo(Clase, p.x, p.y);
    e.esElite = true;
    e.vida = e.vidaMax = e.vidaMax * c.multVida;
    e.sprite.scale.set(e.sprite.scale.x * c.escalaSprite, e.sprite.scale.y * c.escalaSprite);
    const halo = new PIXI.Graphics();
    halo.circle(0, 0, 32).fill({ color: 0xffdd33, alpha: 0.22 });
    e.sprite.addChildAt(halo, 0);
    this._mostrarNotif('✦ ¡Enemigo de élite! Suelta un Tótem de Oro');
  }

  _spawnCirculoHechiceros() {
    const n = CONFIG.spawns.hechiceros.cantidad, rad = CONFIG.spawns.hechiceros.radio;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const anguloAlCentro = a + Math.PI;
      const e = new Hechicero(this.jugador.x + Math.cos(a) * rad, this.jugador.y + Math.sin(a) * rad, this._dificultad(), anguloAlCentro);
      this.enemigos.push(e);
      this.capaEnemigos.addChild(e.sprite);
    }
    this._mostrarNotif('🔮 ¡Círculo de hechiceros!');
  }

  _spawnHorda() {
    for (let i = 0; i < CONFIG.spawns.horda.cantidad; i++) {
      const p = this._puntoBorde();
      this._spawnEnemigo(Bestia, p.x, p.y);
    }
    this._mostrarNotif('🐺 ¡Horda de bestias!');
  }

  _spawnBoss() {
    this.enemigos.forEach(e => e.destroy());
    this.enemigos.length = 0;
    this.bossActivo = true;
    this.boss = this._spawnEnemigo(ChamanUsurpador, this.jugador.x, this.jugador.y - CONFIG.spawns.boss.distanciaY);
    document.getElementById('boss-wrap').classList.add('visible');
    this._mostrarFase('💀 EL CHAMÁN USURPADOR');
    this.flechaBoss.visible = true;
  }

  _enemigoDispara(x, y, tx, ty, dano) {
    const c = CONFIG.proyectilEnemigo;
    const ang = Math.atan2(ty - y, tx - x);
    const g = new PIXI.Graphics();
    g.circle(0, 0, 7).fill(0xff5522);
    g.circle(0, 0, 3).fill(0xffdd66);
    g.x = x; g.y = y;
    this.capaEfectos.addChild(g);
    this.proyEnemigos.push({ g, vx: Math.cos(ang) * c.velocidad, vy: Math.sin(ang) * c.velocidad, vida: c.vida, dano });
  }

  //////////////////////////////////////////////////
  // DERROTA / VICTORIA
  //////////////////////////////////////////////////

  _finPartida(victoria) {
    this.gameOver = true;
    this.gano = victoria;
    Game._running = false;
    this.app.ticker.stop();
    Altar.agregarEspiritualidad(this.runEspiritualidad);

    const go = document.getElementById('gameover');
    go.querySelector('.go-title').textContent = victoria ? '🏆 ¡VICTORIA!' : '💀 DERROTADO';
    go.querySelector('.go-title').style.color = victoria ? '#f0c040' : '#cc3333';
    document.getElementById('go-stats').innerHTML =
      `Tiempo sobrevivido: ${fmtTiempo(this.segundos)}<br>` +
      `Nivel alcanzado: ${this.jugador.nivel} (${this.jugador.nombreTrance})<br>` +
      `Espiritualidad ganada: ${this.runEspiritualidad} ✦<br>` +
      `Espiritualidad total: ${Altar.espiritualidad} ✦`;
    go.classList.add('visible');
  }

  _triggerGameOver() {
    if (!this.gameOver) this._finPartida(false);
  }

  //////////////////////////////////////////////////
  // SUBIDA DE NIVEL
  //////////////////////////////////////////////////

  _abrirNivel() {
    this.panelAbierto = true;
    Game.pausar();
    const opciones = this._construirOpcionesNivel();
    this._mostrarSelector('⬆ ¡Subiste de nivel!', `Nivel ${this.jugador.nivel} — ${this.jugador.nombreTrance}`,
      opciones, 'panel-nivel', 'nivel-grid', () => {
        this.colaNivel = Math.max(0, this.colaNivel - 1);
        this._cerrarSelector('panel-nivel');
        if (this.colaNivel > 0) this._abrirNivel();
        else if (this.jugador._totemOroPendiente) { this.jugador._totemOroPendiente = false; this._abrirCofre(); }
        else { this.panelAbierto = false; Game.reanudar(); }
        this._actualizarHUDArmas();
      });
  }

  _construirOpcionesNivel() {
    const pool = [];
    this._agregarMejorasDeNivel(pool);
    this._agregarManifestacionesNuevas(pool);
    barajar(pool);

    let elegidas = pool.slice(0, this.jugador.opcionesNivelUp);
    if (elegidas.length === 0) elegidas = [this._opcionCuracion()];
    return elegidas;
  }

  _agregarMejorasDeNivel(pool) {
    for (const m of this.jugador.manifestaciones) {
      if (m.nivel >= CONFIG.jugador.nivelMaxManifestacion) continue;
      const meta = metaDe(m.id);
      pool.push({
        icon: meta.icon, nombre: meta.nombre, etiqueta: `Nivel ${m.nivel} → ${m.nivel + 1}`,
        desc: meta.desc, aplicar: () => m.subirNivel(),
      });
    }
  }

  _agregarManifestacionesNuevas(pool) {
    const armas = this.jugador.manifestaciones.filter(m => !m.esTotem).length;
    const totems = this.jugador.manifestaciones.filter(m => m.esTotem).length;
    for (const c of CATALOGO) {
      if (this.jugador.tieneManifestacion(c.id)) continue;
      if (c.totem && totems >= this.jugador.maxTotems) continue;
      if (!c.totem && armas >= this.jugador.maxArmas) continue;
      pool.push({
        icon: c.icon, nombre: c.nombre, etiqueta: 'NUEVO', desc: c.desc,
        aplicar: () => this.jugador.manifestaciones.push(new c.clase(this.jugador, this.capaEfectos, this.capaSuelo)),
      });
    }
  }

  _opcionCuracion() {
    return {
      icon: '❤', nombre: 'Bendición vital', etiqueta: 'CURACIÓN', desc: 'Recuperás el 50% de tu vida.',
      aplicar: () => this.jugador.curar(this.jugador.vidaMax * CONFIG.jugador.curacionBendicion),
    };
  }

  //////////////////////////////////////////////////
  // COFRE (TÓTEM DE ORO)
  //////////////////////////////////////////////////

  _abrirCofre() {
    this.panelAbierto = true;
    Game.pausar();
    const opciones = this._construirOpcionesCofre();
    this._mostrarSelector('✦ Tótem de Oro', 'Elegí una recompensa poderosa',
      opciones, 'panel-cofre', 'cofre-grid', () => {
        this._cerrarSelector('panel-cofre');
        if (this.colaNivel > 0) this._abrirNivel();
        else { this.panelAbierto = false; Game.reanudar(); }
        this._actualizarHUDArmas();
      });
  }

  _construirOpcionesCofre() {
    const pool = [];
    this._agregarEvoluciones(pool);
    this._agregarMejorasMayores(pool);
    pool.push(this._opcionTesoro());

    barajar(pool);
    // priorizar evoluciones: van primero, sin importar el barajado del resto
    const evs = pool.filter(o => o.etiqueta === '¡EVOLUCIÓN!');
    const resto = pool.filter(o => o.etiqueta !== '¡EVOLUCIÓN!');
    return [...evs, ...resto].slice(0, this.jugador.opcionesNivelUp);
  }

  _agregarEvoluciones(pool) {
    for (const m of this.jugador.manifestaciones) {
      if (m.esTotem || m.evolucionada) continue;
      const ev = EVOLUCIONES[m.id];
      if (ev && m.nivel >= CONFIG.jugador.nivelParaEvolucionar && this.jugador.tieneManifestacion(ev.totem)) {
        pool.push({
          icon: ev.icon, nombre: ev.nombre, etiqueta: '¡EVOLUCIÓN!', desc: ev.desc,
          aplicar: () => m.evolucionar(),
        });
      }
    }
  }

  _agregarMejorasMayores(pool) {
    for (const m of this.jugador.manifestaciones) {
      if (m.nivel >= CONFIG.jugador.nivelMaxManifestacion) continue;
      const meta = metaDe(m.id);
      pool.push({
        icon: meta.icon, nombre: meta.nombre, etiqueta: '+2 niveles', desc: meta.desc,
        aplicar: () => { m.subirNivel(); m.subirNivel(); },
      });
    }
  }

  _opcionTesoro() {
    return {
      icon: '❤', nombre: 'Reliquia de vida', etiqueta: 'TESORO', desc: 'Cura total + 20 de vida máx.',
      aplicar: () => { this.jugador.vidaMax += CONFIG.jugador.reliquiaVida; this.jugador.curar(this.jugador.vidaMax); },
    };
  }

  //////////////////////////////////////////////////
  // SELECTOR GENÉRICO (cards + teclas 1/2/3)
  //////////////////////////////////////////////////

  _mostrarSelector(titulo, subtitulo, opciones, panelId, gridId, onCerrar) {
    const panel = document.getElementById(panelId);
    panel.querySelector('.sel-title').textContent = titulo;
    panel.querySelector('.sel-sub').textContent = subtitulo;

    this._renderizarCards(gridId, opciones, i => elegir(i));

    const elegir = (i) => {
      if (i < 0 || i >= opciones.length) return;
      window.removeEventListener('keydown', this._keySel);
      this._keySel = null;
      opciones[i].aplicar();
      onCerrar();
    };

    this._keySel = (e) => {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= opciones.length) elegir(n - 1);
    };
    window.addEventListener('keydown', this._keySel);
    panel.classList.add('visible');
  }

  _renderizarCards(gridId, opciones, onElegir) {
    const grid = document.getElementById(gridId);
    grid.innerHTML = '';
    opciones.forEach((op, idx) => {
      const card = document.createElement('div');
      card.className = 'sel-card';
      card.innerHTML = `<div class="sel-num">${idx + 1}</div>
        <div class="sel-icon">${op.icon}</div>
        <div class="sel-nombre">${op.nombre}</div>
        <div class="sel-etq">${op.etiqueta}</div>
        <div class="sel-desc">${op.desc}</div>`;
      card.addEventListener('click', () => onElegir(idx));
      grid.appendChild(card);
    });
  }

  _cerrarSelector(panelId) {
    document.getElementById(panelId).classList.remove('visible');
    if (this._keySel) { window.removeEventListener('keydown', this._keySel); this._keySel = null; }
  }

  //////////////////////////////////////////////////
  // HELPERS DE UI
  //////////////////////////////////////////////////

  _mostrarNotif(msg) {
    const el = document.getElementById('notif');
    el.textContent = msg; el.classList.add('show');
    clearTimeout(this._notifTimer);
    this._notifTimer = setTimeout(() => el.classList.remove('show'), 2400);
  }

  _mostrarFase(msg) {
    const el = document.getElementById('zona-label');
    el.textContent = msg; el.classList.add('show');
    clearTimeout(this._faseTimer);
    this._faseTimer = setTimeout(() => el.classList.remove('show'), 3000);
  }

  _actualizarHUDArmas() {
    const cont = document.getElementById('hud-armas');
    cont.innerHTML = '';
    for (const m of this.jugador.manifestaciones) {
      const meta = metaDe(m.id);
      const chip = document.createElement('span');
      chip.className = 'arma-chip' + (m.evolucionada ? ' evo' : '');
      chip.textContent = `${meta.icon}${m.nivel}`;
      cont.appendChild(chip);
    }
  }

  _crearTextoDano(x, y, cantidad) {
    const texto = new PIXI.Text({
      text: String(cantidad),
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 'bold',
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 3 },
      },
    });
    texto.anchor.set(0.5);
    texto.x = x;
    texto.y = y;
    this.capaEfectos.addChild(texto);
    this.textosDano.push({ texto, vida: 0, yInicial: y });
  }

  //////////////////////////////////////////////////
  // GAME LOOP
  //////////////////////////////////////////////////

  _loop(delta) {
    if (this.gameOver || !Game._running || this.panelAbierto) return;
    this.segundos += delta / 60;

    this._actualizarFase();
    this.jugador.update(delta);
    if (this._procesarSubidaDeNivel()) return;

    this._actualizarManifestaciones(delta);
    this._actualizarEnemigos(delta);
    this._actualizarProyectilesEnemigos(delta);
    this._actualizarConsumibles(delta);
    if (this._limpiarEnemigosMuertos()) return; // victoria: cortar el frame

    this._actualizarTextosDano(delta);
    this._procesarSpawns(delta);
    this._actualizarCamara(delta);
    this._actualizarBarraJugador();
    this._actualizarHUD();
    this._actualizarUIBoss();
  }

  _actualizarFase() {
    let f = 0;
    for (let i = 0; i < Game.FASES.length; i++) {
      if (this.segundos / 60 >= Game.FASES[i].min) f = i;
    }
    if (f !== this.faseActual && !this.bossActivo) {
      this.faseActual = f;
      this._mostrarFase(Game.FASES[f].nombre);
    }
  }

  _procesarSubidaDeNivel() {
    if (this.jugador._xpPendiente > 0) {
      const prev = this.jugador.nivel;
      this.jugador.ganarXP(this.jugador._xpPendiente);
      this.jugador._xpPendiente = 0;
      this.colaNivel += this.jugador.nivel - prev;
    }
    if (this.colaNivel > 0) { this._abrirNivel(); return true; }
    if (this.jugador._totemOroPendiente) {
      this.jugador._totemOroPendiente = false;
      this._abrirCofre();
      return true;
    }
    return false;
  }

  _actualizarManifestaciones(delta) {
    for (const m of this.jugador.manifestaciones) m.update(delta, this.enemigos);
  }

  _actualizarEnemigos(delta) {
    for (const e of this.enemigos) e.update(delta, this.jugador, this.ctx);
    this._separarEnemigos();
    this.jugador.sprite.zIndex = this.jugador.y;
    for (const e of this.enemigos) e.sprite.zIndex = e.y;
  }

  _separarEnemigos() {
    this._separarEnemigosEntreSi();
    this._separarEnemigosDelJugador();
  }

  _separarEnemigosEntreSi() {
    for (let i = 0; i < this.enemigos.length; i++) {
      const a = this.enemigos[i];
      for (let j = i + 1; j < this.enemigos.length; j++) {
        const b = this.enemigos[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const minDist = a.radio + b.radio;
        if (dist >= minDist || dist === 0) continue; // no se tocan (o están en el mismo punto)

        // cuánto se solapan, repartido mitad y mitad
        const empuje = (minDist - dist) / 2;
        const nx = dx / dist; // dirección normalizada de a hacia b
        const ny = dy / dist;
        if (!a.estacionario) { a.x -= nx * empuje; a.y -= ny * empuje; }
        if (!b.estacionario) { b.x += nx * empuje; b.y += ny * empuje; }
      }
    }
  }

  _separarEnemigosDelJugador() {
    for (const e of this.enemigos) {
      const dx = e.x - this.jugador.x;
      const dy = e.y - this.jugador.y;
      const dist = Math.hypot(dx, dy);
      const minDist = e.radio + this.jugador.radio;
      if (dist >= minDist || dist === 0 || e.estacionario) continue;
      const empuje = minDist - dist;
      e.x += (dx / dist) * empuje;
      e.y += (dy / dist) * empuje;
    }
  }

  _actualizarProyectilesEnemigos(delta) {
    for (let i = this.proyEnemigos.length - 1; i >= 0; i--) {
      const p = this.proyEnemigos[i];
      p.g.x += p.vx * delta; p.g.y += p.vy * delta; p.vida -= delta;
      if (this.jugador.distanciaXY(p.g.x, p.g.y) < CONFIG.proyectilEnemigo.radioImpacto) {
        if (this.jugador.recibirDano(p.dano)) this._triggerGameOver();
        p.g.destroy(); this.proyEnemigos.splice(i, 1); continue;
      }
      if (p.vida <= 0) { p.g.destroy(); this.proyEnemigos.splice(i, 1); }
    }
  }

  _actualizarConsumibles(delta) {
    for (let i = this.consumibles.length - 1; i >= 0; i--) {
      const c = this.consumibles[i];
      if (c.update(delta, this.jugador)) { c.destroy(); this.consumibles.splice(i, 1); }
    }
  }

  _limpiarEnemigosMuertos() {
    for (let i = this.enemigos.length - 1; i >= 0; i--) {
      const e = this.enemigos[i];
      if (!e.muerto) continue;
      if (e.esBoss) {
        e.destroy(); this.enemigos.splice(i, 1);
        this._finPartida(true);
        return true;
      }
      this.runEspiritualidad += e.espiritualidad;
      this._soltarBotin(e);
      e.destroy(); this.enemigos.splice(i, 1);
    }
    return false;
  }

  _soltarBotin(e) {
    const orbe = new OrbeDeExperiencia(e.x, e.y, e.xpDrop);
    this.consumibles.push(orbe);
    this.capaConsumibles.addChild(orbe.sprite);
    if (e.esElite) {
      const totem = new TotemDeOro(e.x, e.y);
      this.consumibles.push(totem);
      this.capaConsumibles.addChild(totem.sprite);
    }
  }

  _actualizarTextosDano(delta) {
    const DURACION_TEXTO = 45; // frames ≈ 0.75 s
    for (let i = this.textosDano.length - 1; i >= 0; i--) {
      const t = this.textosDano[i];
      t.vida += delta;
      const progreso = Math.min(1, t.vida / DURACION_TEXTO);
      t.texto.y = t.yInicial - progreso * 40; // sube 40 px
      t.texto.alpha = 1.5 - progreso;         // nítido la primera mitad, se desvanece la segunda
      if (progreso >= 1) {
        t.texto.destroy();
        this.textosDano.splice(i, 1);
      }
    }
  }

  _procesarSpawns(delta) {
    if (!this.bossActivo && this.segundos < Game.TIEMPO_PARTIDA) {
      this._procesarSpawnNormal(delta);
      this._procesarSpawnEspecial('eliteTimer', CONFIG.spawns.elite, delta, () => this._spawnElite());
      this._procesarSpawnEspecial('hechiceroTimer', CONFIG.spawns.hechiceros, delta, () => this._spawnCirculoHechiceros());
      this._procesarSpawnEspecial('hordaTimer', CONFIG.spawns.horda, delta, () => this._spawnHorda());
    }
    if (!this.bossActivo && this.segundos >= Game.TIEMPO_PARTIDA) this._spawnBoss();
  }

  _procesarSpawnNormal(delta) {
    const c = CONFIG.spawns.normal;
    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0 && this.enemigos.length < CONFIG.partida.maxEnemigos) {
      this.spawnTimer = Math.max(c.cdMin, c.cdBase - (this.segundos / 60) * c.cdReduccionPorMinuto);
      const p = this._puntoBorde();
      this._spawnEnemigo(this._tipoSegunFase(), p.x, p.y);
    }
  }

  // Oleadas especiales (élite / hechiceros / horda): mismo patrón de temporizador.
  _procesarSpawnEspecial(timer, cfg, delta, spawnear) {
    this[timer] -= delta;
    if (this[timer] <= 0 && this.segundos > cfg.desdeSeg) {
      this[timer] = cfg.cadaSeg * 60;
      spawnear();
    }
  }

  _actualizarCamara(delta) {
    this.world.x = this.app.screen.width / 2 - this.jugador.x;
    this.world.y = this.app.screen.height / 2 - this.jugador.y;
    if (this.shakeT > 0) {
      this.shakeT -= delta;
      this.world.x += (Math.random() - 0.5) * 6;
      this.world.y += (Math.random() - 0.5) * 6;
    }
    this.floor.width = this.app.screen.width;
    this.floor.height = this.app.screen.height;
    this.floor.tilePosition.set(this.world.x, this.world.y);
  }

  _actualizarBarraJugador() {
    const jugador = this.jugador;
    this.barraJugador.clear();
    const bw = 44, px = jugador.x - bw / 2, py = jugador.y + 46;
    const vibX = jugador._flashT > 0 ? (Math.random() - 0.5) * 4 : 0;
    this.barraJugador.rect(px + vibX, py, bw, 5).fill({ color: 0x000000, alpha: 0.6 });
    this.barraJugador.rect(px + vibX, py, bw * (jugador.vida / jugador.vidaMax), 5).fill(0x44dd55);
    if (jugador._flashT > 0) this.shakeT = Math.max(this.shakeT, 5);
  }

  _actualizarHUD() {
    const jugador = this.jugador;
    document.getElementById('hud-tiempo').textContent = fmtTiempo(Math.min(this.segundos, Game.TIEMPO_PARTIDA));
    document.getElementById('hud-nivel').textContent = 'Nv ' + jugador.nivel;
    document.getElementById('xp-fill').style.width = (jugador.xp / jugador.xpSiguiente * 100) + '%';
    document.getElementById('hud-esp').textContent = this.runEspiritualidad;
    document.getElementById('vida-fill').style.width = (jugador.vida / jugador.vidaMax * 100) + '%';
    document.getElementById('hud-vida').textContent = Math.ceil(jugador.vida);
    document.getElementById('dano-overlay').style.opacity = jugador._flashT > 0 ? '0.55' : '0';
  }

  _actualizarUIBoss() {
    if (!this.bossActivo || !this.boss || this.boss.muerto) return;
    document.getElementById('boss-fill').style.width = (this.boss.vida / this.boss.vidaMax * 100) + '%';

    const sx = this.boss.x + this.world.x, sy = this.boss.y + this.world.y;
    const cx = this.app.screen.width / 2, cy = this.app.screen.height / 2;
    const ang = Math.atan2(sy - cy, sx - cx);
    const fx = cx + Math.cos(ang) * 90, fy = cy + Math.sin(ang) * 90;
    this.flechaBoss.clear();
    this.flechaBoss.poly([
      fx + Math.cos(ang) * 16, fy + Math.sin(ang) * 16,
      fx + Math.cos(ang + 2.5) * 12, fy + Math.sin(ang + 2.5) * 12,
      fx + Math.cos(ang - 2.5) * 12, fy + Math.sin(ang - 2.5) * 12,
    ]).fill({ color: 0xff3333, alpha: 0.6 });
  }
}

/* ── utilidades de módulo ── */
function fmtTiempo(s) {
  const m = Math.floor(s / 60), seg = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
}
function barajar(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function _arbol(x, y) {
  const g = new PIXI.Graphics();
  const tipo = Math.random();
  if (tipo < 0.55) {            // arbusto
    for (let i = 0; i < 4; i++) {
      g.circle((Math.random() - 0.5) * 22, (Math.random() - 0.5) * 14, 8 + Math.random() * 6)
        .fill({ color: 0x14280d, alpha: 0.95 });
    }
  } else if (tipo < 0.85) {     // árbol
    g.rect(-3, 0, 6, 16).fill(0x2a1c0e);
    g.circle(0, -6, 16).fill(0x16300f);
    g.circle(-10, 0, 12).fill(0x1a3812);
    g.circle(10, -2, 12).fill(0x12280c);
  } else {                      // roca
    g.ellipse(0, 0, 14, 10).fill(0x3a3a36);
    g.ellipse(-3, -2, 8, 5).fill(0x4a4a45);
  }
  g.x = x; g.y = y;
  return g;
}
