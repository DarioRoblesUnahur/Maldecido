/* ============================================================
   Game — orquestador de la incursión (estilo survival, GDD).
   Selva procedural, oleadas escaladas por tiempo, recolección
   de XP/Espiritualidad, subida de nivel con elección de
   manifestaciones, tótems de oro y el jefe final.
   ============================================================ */
class Game {
  static _app = null;
  static _running = false;

  static pausar()   { if (Game._app) { Game._app.ticker.stop();  Game._running = false; } }
  static reanudar() { if (Game._app) { Game._app.ticker.start(); Game._running = true;  } }

  static volverAlMenu() {
    if (!Game._app) return;
    const app = Game._app;
    Game._app = null;
    Game._running = false;

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

  static async start() {
    const app = new PIXI.Application();
    Game._app = app;
    await app.init({ background: 0x0c1407, resizeTo: window, antialias: false });
    document.getElementById('game-canvas-container').appendChild(app.canvas);
    Game._running = true;

    // ── ASSETS ────────────────────────────────────────────────
    const texPlayer = await PIXI.Assets.load('player.png');

    // ── SUELO DE SELVA (tile procedural infinito) ─────────────
    const tileG = new PIXI.Graphics();
    tileG.rect(0, 0, 96, 96).fill(0x1c3312);
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * 96, y = Math.random() * 96, r = 2 + Math.random() * 5;
      const c = Math.random() < 0.5 ? 0x16280e : 0x24401a;
      tileG.circle(x, y, r).fill({ color: c, alpha: 0.7 });
    }
    const tileTex = app.renderer.generateTexture(tileG);
    const floor = new PIXI.TilingSprite({ texture: tileTex, width: app.screen.width, height: app.screen.height });
    app.stage.addChild(floor);

    // ── MUNDO Y CAPAS ─────────────────────────────────────────
    const world = new PIXI.Container();
    app.stage.addChild(world);
    const decoraciones   = new PIXI.Container();
    const capaConsumibles = new PIXI.Container();
    const capaEnemigos   = new PIXI.Container();
    const capaEfectos    = new PIXI.Container();
    world.addChild(decoraciones, capaConsumibles, capaEnemigos);

    // Vegetación de la selva (procedural, decorativa)
    for (let i = 0; i < 220; i++) {
      const x = (Math.random() - 0.5) * 10000;
      const y = (Math.random() - 0.5) * 10000;
      decoraciones.addChild(_arbol(x, y));
    }

    // ── JUGADOR ───────────────────────────────────────────────
    const jugador = new Jugador(0, 0, texPlayer);
    jugador.opcionesNivelUp = 2;
    Altar.aplicarAJugador(jugador);   // mejoras permanentes
    world.addChild(jugador.sprite);
    world.addChild(capaEfectos);
    const armasIniciales = [JaguaresEspectrales, BolasDeVeneno, CondorVigia, EstallidoDeHuaca];
    const ArmaInicial = armasIniciales[Math.floor(Math.random() * armasIniciales.length)];
    jugador.manifestaciones.push(new ArmaInicial(jugador, capaEfectos));

    // barra de vida bajo el jugador
    const barraJugador = new PIXI.Graphics();
    world.addChild(barraJugador);

    // flecha hacia el jefe (espacio de pantalla)
    const flechaBoss = new PIXI.Graphics();
    app.stage.addChild(flechaBoss);
    flechaBoss.visible = false;

    // ── ESTADO ────────────────────────────────────────────────
    const enemigos = [];
    const consumibles = [];
    const proyEnemigos = [];
    let segundos = 0;
    let runEspiritualidad = 0;
    let gameOver = false, ganó = false;
    let bossActivo = false, boss = null;
    let faseActual = -1;
    let colaNivel = 0, panelAbierto = false;

    let spawnTimer = 30, eliteTimer = 180 * 60, hechiceroTimer = 120 * 60, hordaTimer = 240 * 60;
    let shakeT = 0;

    const TIEMPO_PARTIDA = 1800; // 30 min (cambiá este valor para probar más rápido)

    const FASES = [
      { min: 0,  nombre: '🌴 La Selva Olvidada' },
      { min: 10, nombre: '🏛 Las Ruinas de Piedra' },
      { min: 20, nombre: '🌙 El Templo de la Luna' },
    ];

    // contexto que reciben los enemigos
    const ctx = {
      gameOver: () => triggerGameOver(),
      enemigoDispara: (x, y, tx, ty, dano) => {
        const ang = Math.atan2(ty - y, tx - x);
        const g = new PIXI.Graphics();
        g.circle(0, 0, 7).fill(0xff5522);
        g.circle(0, 0, 3).fill(0xffdd66);
        g.x = x; g.y = y;
        capaEfectos.addChild(g);
        proyEnemigos.push({ g, vx: Math.cos(ang) * 3.6, vy: Math.sin(ang) * 3.6, vida: 240, dano });
      },
    };

    // ── HELPERS DE SPAWN ──────────────────────────────────────
    function dificultad() { return 1 + (segundos / 60) * 0.22; }

    function puntoBorde() {
      const ang = Math.random() * Math.PI * 2;
      const rad = Math.max(app.screen.width, app.screen.height) * 0.62 + 60;
      return { x: jugador.x + Math.cos(ang) * rad, y: jugador.y + Math.sin(ang) * rad };
    }

    function tipoSegunFase() {
      const m = segundos / 60;
      const r = Math.random();
      if (m < 2) return Guerrero;
      if (m < 4) return r < 0.85 ? Guerrero : Bestia;
      if (m < 8) return r < 0.55 ? Guerrero : Bestia;
      if (m < 10) return r < 0.4 ? Guerrero : Bestia;
      if (m < 20) {
        if (r < 0.30) return Guerrero;
        if (r < 0.62) return Bestia;
        if (r < 0.93) return Sombra;
        return Golem;
      }
      if (r < 0.15) return Guerrero;
      if (r < 0.42) return Bestia;
      if (r < 0.66) return Sombra;
      return Golem;
    }

    function spawnEnemigo(Clase, x, y) {
      const e = new (Clase)(x, y, dificultad());
      enemigos.push(e);
      capaEnemigos.addChild(e.sprite);
      return e;
    }

    function spawnElite() {
      const m = segundos / 60;
      const p = puntoBorde();
      const Clase = m >= 10 ? Golem : Guerrero;
      const e = spawnEnemigo(Clase, p.x, p.y);
      e.esElite = true;
      e.vida = e.vidaMax = e.vidaMax * 3.5;
      e.sprite.scale.set(1.1);
      const halo = new PIXI.Graphics();
      halo.circle(0, 0, 32).fill({ color: 0xffdd33, alpha: 0.22 });
      e.sprite.addChildAt(halo, 0);
      mostrarNotif('✦ ¡Enemigo de élite! Suelta un Tótem de Oro');
    }

    function spawnCirculoHechiceros() {
      const n = 8, rad = 360;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        spawnEnemigo(Hechicero, jugador.x + Math.cos(a) * rad, jugador.y + Math.sin(a) * rad);
      }
      mostrarNotif('🔮 ¡Círculo de hechiceros!');
    }

    function spawnHorda() {
      for (let i = 0; i < 26; i++) {
        const p = puntoBorde();
        spawnEnemigo(Bestia, p.x, p.y);
      }
      mostrarNotif('🐺 ¡Horda de bestias!');
    }

    function spawnBoss() {
      enemigos.forEach(e => e.destroy());
      enemigos.length = 0;
      bossActivo = true;
      boss = spawnEnemigo(ChamanUsurpador, jugador.x, jugador.y - 460);
      document.getElementById('boss-wrap').classList.add('visible');
      mostrarFase('💀 EL CHAMÁN USURPADOR');
      flechaBoss.visible = true;
    }

    // ── DERROTA / VICTORIA ────────────────────────────────────
    function finPartida(victoria) {
      gameOver = true; ganó = victoria; Game._running = false; app.ticker.stop();
      Altar.agregarEspiritualidad(runEspiritualidad);
      const go = document.getElementById('gameover');
      go.querySelector('.go-title').textContent = victoria ? '🏆 ¡VICTORIA!' : '💀 DERROTADO';
      go.querySelector('.go-title').style.color = victoria ? '#f0c040' : '#cc3333';
      document.getElementById('go-stats').innerHTML =
        `Tiempo sobrevivido: ${fmtTiempo(segundos)}<br>` +
        `Nivel alcanzado: ${jugador.nivel} (${jugador.nombreTrance})<br>` +
        `Espiritualidad ganada: ${runEspiritualidad} ✦<br>` +
        `Espiritualidad total: ${Altar.espiritualidad} ✦`;
      go.classList.add('visible');
    }
    function triggerGameOver() { if (!gameOver) finPartida(false); }

    // ── SUBIDA DE NIVEL ───────────────────────────────────────
    function abrirNivel() {
      panelAbierto = true;
      Game.pausar();
      const opciones = construirOpcionesNivel();
      mostrarSelector('⬆ ¡Subiste de nivel!', `Nivel ${jugador.nivel} — ${jugador.nombreTrance}`,
        opciones, 'panel-nivel', 'nivel-grid', () => {
          colaNivel = Math.max(0, colaNivel - 1);
          cerrarSelector('panel-nivel');
          if (colaNivel > 0) abrirNivel();
          else if (jugador._totemOroPendiente) { jugador._totemOroPendiente = false; abrirCofre(); }
          else { panelAbierto = false; Game.reanudar(); }
          actualizarHUDArmas();
        });
    }

    function construirOpcionesNivel() {
      const pool = [];
      // mejorar lo que ya tengo
      for (const m of jugador.manifestaciones) {
        if (m.nivel < 8) {
          const meta = metaDe(m.id);
          pool.push({
            icon: meta.icon, nombre: meta.nombre, etiqueta: `Nivel ${m.nivel} → ${m.nivel + 1}`,
            desc: meta.desc, aplicar: () => m.subirNivel(),
          });
        }
      }
      // nuevas manifestaciones según ranuras libres
      const armas = jugador.manifestaciones.filter(m => !m.esTotem).length;
      const totems = jugador.manifestaciones.filter(m => m.esTotem).length;
      for (const c of CATALOGO) {
        if (jugador.tieneManifestacion(c.id)) continue;
        if (c.totem && totems >= jugador.maxTotems) continue;
        if (!c.totem && armas >= jugador.maxArmas) continue;
        pool.push({
          icon: c.icon, nombre: c.nombre, etiqueta: 'NUEVO', desc: c.desc,
          aplicar: () => jugador.manifestaciones.push(new c.clase(jugador, capaEfectos)),
        });
      }
      barajar(pool);
      let elegidas = pool.slice(0, jugador.opcionesNivelUp);
      if (elegidas.length === 0) {
        elegidas = [{
          icon: '❤', nombre: 'Bendición vital', etiqueta: 'CURACIÓN', desc: 'Recuperás el 50% de tu vida.',
          aplicar: () => jugador.curar(jugador.vidaMax * 0.5),
        }];
      }
      return elegidas;
    }

    // ── COFRE (TÓTEM DE ORO) ──────────────────────────────────
    function abrirCofre() {
      panelAbierto = true;
      Game.pausar();
      const opciones = construirOpcionesCofre();
      mostrarSelector('✦ Tótem de Oro', 'Elegí una recompensa poderosa',
        opciones, 'panel-cofre', 'cofre-grid', () => {
          cerrarSelector('panel-cofre');
          if (colaNivel > 0) abrirNivel();
          else { panelAbierto = false; Game.reanudar(); }
          actualizarHUDArmas();
        });
    }

    function construirOpcionesCofre() {
      const pool = [];
      // evoluciones disponibles
      for (const m of jugador.manifestaciones) {
        if (m.esTotem || m.evolucionada) continue;
        const ev = EVOLUCIONES[m.id];
        if (ev && m.nivel >= 4 && jugador.tieneManifestacion(ev.totem)) {
          pool.push({
            icon: ev.icon, nombre: ev.nombre, etiqueta: '¡EVOLUCIÓN!', desc: ev.desc,
            aplicar: () => m.evolucionar(),
          });
        }
      }
      // mejora mayor (+2 niveles)
      for (const m of jugador.manifestaciones) {
        if (m.nivel < 8) {
          const meta = metaDe(m.id);
          pool.push({
            icon: meta.icon, nombre: meta.nombre, etiqueta: `+2 niveles`, desc: meta.desc,
            aplicar: () => { m.subirNivel(); m.subirNivel(); },
          });
        }
      }
      // tesoro
      pool.push({ icon: '❤', nombre: 'Reliquia de vida', etiqueta: 'TESORO', desc: 'Cura total + 20 de vida máx.',
        aplicar: () => { jugador.vidaMax += 20; jugador.curar(jugador.vidaMax); } });

      barajar(pool);
      // priorizar evoluciones: las dejamos primero antes de barajar el resto
      const evs = pool.filter(o => o.etiqueta === '¡EVOLUCIÓN!');
      const resto = pool.filter(o => o.etiqueta !== '¡EVOLUCIÓN!');
      const ordenadas = [...evs, ...resto];
      return ordenadas.slice(0, jugador.opcionesNivelUp);
    }

    // selector genérico (cards + teclas 1/2/3)
    let _keySel = null;
    function mostrarSelector(titulo, subtitulo, opciones, panelId, gridId, onCerrar) {
      const panel = document.getElementById(panelId);
      panel.querySelector('.sel-title').textContent = titulo;
      panel.querySelector('.sel-sub').textContent = subtitulo;
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
        card.addEventListener('click', () => elegir(idx));
        grid.appendChild(card);
      });
      function elegir(i) {
        if (i < 0 || i >= opciones.length) return;
        window.removeEventListener('keydown', _keySel);
        _keySel = null;
        opciones[i].aplicar();
        onCerrar();
      }
      _keySel = (e) => {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= opciones.length) elegir(n - 1);
      };
      window.addEventListener('keydown', _keySel);
      panel.classList.add('visible');
    }
    function cerrarSelector(panelId) {
      document.getElementById(panelId).classList.remove('visible');
      if (_keySel) { window.removeEventListener('keydown', _keySel); _keySel = null; }
    }

    // ── UI HELPERS ────────────────────────────────────────────
    let _notifTimer = null;
    function mostrarNotif(msg) {
      const el = document.getElementById('notif');
      el.textContent = msg; el.classList.add('show');
      clearTimeout(_notifTimer);
      _notifTimer = setTimeout(() => el.classList.remove('show'), 2400);
    }
    let _faseTimer = null;
    function mostrarFase(msg) {
      const el = document.getElementById('zona-label');
      el.textContent = msg; el.classList.add('show');
      clearTimeout(_faseTimer);
      _faseTimer = setTimeout(() => el.classList.remove('show'), 3000);
    }
    function actualizarHUDArmas() {
      const cont = document.getElementById('hud-armas');
      cont.innerHTML = '';
      for (const m of jugador.manifestaciones) {
        const meta = metaDe(m.id);
        const chip = document.createElement('span');
        chip.className = 'arma-chip' + (m.evolucionada ? ' evo' : '');
        chip.textContent = `${meta.icon}${m.nivel}`;
        cont.appendChild(chip);
      }
    }
    actualizarHUDArmas();

    // ── LOOP ──────────────────────────────────────────────────
    app.ticker.add(ticker => {
      if (gameOver || !Game._running || panelAbierto) return;
      const delta = ticker.deltaTime;
      segundos += delta / 60;

      // fase
      let f = 0;
      for (let i = 0; i < FASES.length; i++) if (segundos / 60 >= FASES[i].min) f = i;
      if (f !== faseActual && !bossActivo) { faseActual = f; mostrarFase(FASES[f].nombre); }

      // jugador
      jugador.update(delta);

      // XP / nivel
      if (jugador._xpPendiente > 0) {
        const prev = jugador.nivel;
        jugador.ganarXP(jugador._xpPendiente);
        jugador._xpPendiente = 0;
        colaNivel += jugador.nivel - prev;
      }
      if (colaNivel > 0) { abrirNivel(); return; }
      if (jugador._totemOroPendiente) { jugador._totemOroPendiente = false; abrirCofre(); return; }

      // manifestaciones
      for (const m of jugador.manifestaciones) m.update(delta, enemigos);

      // enemigos
      for (const e of enemigos) e.update(delta, jugador, ctx);

      // proyectiles enemigos
      for (let i = proyEnemigos.length - 1; i >= 0; i--) {
        const p = proyEnemigos[i];
        p.g.x += p.vx * delta; p.g.y += p.vy * delta; p.vida -= delta;
        if (jugador.distanciaXY(p.g.x, p.g.y) < 22) {
          if (jugador.recibirDano(p.dano)) triggerGameOver();
          p.g.destroy(); proyEnemigos.splice(i, 1); continue;
        }
        if (p.vida <= 0) { p.g.destroy(); proyEnemigos.splice(i, 1); }
      }

      // consumibles
      for (let i = consumibles.length - 1; i >= 0; i--) {
        const c = consumibles[i];
        if (c.update(delta, jugador)) { c.destroy(); consumibles.splice(i, 1); }
      }

      // limpiar muertos
      for (let i = enemigos.length - 1; i >= 0; i--) {
        const e = enemigos[i];
        if (e.muerto) {
          if (e.esBoss) { e.destroy(); enemigos.splice(i, 1); finPartida(true); return; }
          runEspiritualidad += e.espiritualidad;
          const orbe = new OrbeDeExperiencia(e.x, e.y, e.xpDrop);
          consumibles.push(orbe); capaConsumibles.addChild(orbe.sprite);
          if (e.esElite) {
            const t = new TotemDeOro(e.x, e.y);
            consumibles.push(t); capaConsumibles.addChild(t.sprite);
          }
          e.destroy(); enemigos.splice(i, 1);
        }
      }

      // spawns (mientras no haya jefe)
      if (!bossActivo && segundos < TIEMPO_PARTIDA) {
        spawnTimer -= delta;
        if (spawnTimer <= 0 && enemigos.length < 230) {
          spawnTimer = Math.max(7, 42 - (segundos / 60) * 1.4);
          const p = puntoBorde();
          spawnEnemigo(tipoSegunFase(), p.x, p.y);
        }
        eliteTimer -= delta;
        if (eliteTimer <= 0 && segundos > 60) { eliteTimer = 180 * 60; spawnElite(); }
        hechiceroTimer -= delta;
        if (hechiceroTimer <= 0 && segundos > 120) { hechiceroTimer = 120 * 60; spawnCirculoHechiceros(); }
        hordaTimer -= delta;
        if (hordaTimer <= 0 && segundos > 600) { hordaTimer = 240 * 60; spawnHorda(); }
      }

      // aparición del jefe
      if (!bossActivo && segundos >= TIEMPO_PARTIDA) spawnBoss();

      // cámara + suelo
      world.x = app.screen.width / 2 - jugador.x;
      world.y = app.screen.height / 2 - jugador.y;
      if (shakeT > 0) { shakeT -= delta; world.x += (Math.random() - 0.5) * 6; world.y += (Math.random() - 0.5) * 6; }
      floor.width = app.screen.width; floor.height = app.screen.height;
      floor.tilePosition.set(world.x, world.y);

      // barra de vida bajo el jugador (vibra al recibir daño)
      barraJugador.clear();
      const bw = 44, px = jugador.x - bw / 2, py = jugador.y + 34;
      const vibX = jugador._flashT > 0 ? (Math.random() - 0.5) * 4 : 0;
      barraJugador.rect(px + vibX, py, bw, 5).fill({ color: 0x000000, alpha: 0.6 });
      barraJugador.rect(px + vibX, py, bw * (jugador.vida / jugador.vidaMax), 5).fill(0x44dd55);
      if (jugador._flashT > 0) shakeT = Math.max(shakeT, 5);

      // HUD
      document.getElementById('hud-tiempo').textContent = fmtTiempo(Math.min(segundos, TIEMPO_PARTIDA));
      document.getElementById('hud-nivel').textContent = 'Nv ' + jugador.nivel;
      document.getElementById('xp-fill').style.width = (jugador.xp / jugador.xpSiguiente * 100) + '%';
      document.getElementById('hud-esp').textContent = runEspiritualidad;
      const pct = jugador.vida / jugador.vidaMax;
      document.getElementById('vida-fill').style.width = (pct * 100) + '%';
      document.getElementById('hud-vida').textContent = Math.ceil(jugador.vida);
      document.getElementById('dano-overlay').style.opacity = jugador._flashT > 0 ? '0.55' : '0';

      // jefe: barra + flecha
      if (bossActivo && boss && !boss.muerto) {
        document.getElementById('boss-fill').style.width = (boss.vida / boss.vidaMax * 100) + '%';
        const sx = boss.x + world.x, sy = boss.y + world.y;
        const cx = app.screen.width / 2, cy = app.screen.height / 2;
        flechaBoss.clear();
        const ang = Math.atan2(sy - cy, sx - cx);
        const fx = cx + Math.cos(ang) * 90, fy = cy + Math.sin(ang) * 90;
        flechaBoss.poly([
          fx + Math.cos(ang) * 16, fy + Math.sin(ang) * 16,
          fx + Math.cos(ang + 2.5) * 12, fy + Math.sin(ang + 2.5) * 12,
          fx + Math.cos(ang - 2.5) * 12, fy + Math.sin(ang - 2.5) * 12,
        ]).fill({ color: 0xff3333, alpha: 0.6 });
      }
    });

    mostrarFase('🌴 La Selva Olvidada — ¡Sobreviví 30 minutos!');
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
