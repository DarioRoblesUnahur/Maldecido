/* ============================================================
   CONFIG — todos los números del juego en un solo lugar.

   Tocá SOLO este archivo para balancear: no hace falta abrir
   el resto del código. Se carga antes que todas las clases.

   Unidades:
     - "frames": el juego corre a 60 fps  →  60 frames ≈ 1 segundo.
     - "seg" / "min": segundos / minutos de partida.
     - Los cooldowns de las armas están en frames.
   ============================================================ */
const CONFIG = {

  //////////////////////////////////////////////////
  // PARTIDA
  //////////////////////////////////////////////////
  partida: {
    duracionMin: 30,    // minutos hasta que aparece el jefe final
    maxEnemigos: 230,   // tope de enemigos vivos a la vez (performance)

    // La dificultad escala la VIDA de los enemigos al aparecer:
    //   dificultad = 1 + minutos * incrementoPorMinuto
    dificultadIncrementoPorMinuto: 0.22,

    fases: [
      { min: 0,  nombre: '🌴 La Selva Olvidada' },
      { min: 10, nombre: '🏛 Las Ruinas de Piedra' },
      { min: 20, nombre: '🌙 El Templo de la Luna' },
    ],
  },

  //////////////////////////////////////////////////
  // MUNDO
  //////////////////////////////////////////////////
  mundo: {
    arboles: 220,        // cantidad de vegetación decorativa
    dispersion: 10000,   // ancho/alto del área donde se reparte
  },

  //////////////////////////////////////////////////
  // JUGADOR
  //////////////////////////////////////////////////
  jugador: {
    vidaMax: 100,
    velocidad: 3.2,
    radio: 14,              // radio de colisión
    radioRecoleccion: 70,   // distancia a la que atrae orbes de XP

    maxArmas: 4,
    maxTotems: 4,
    opcionesNivelUp: 2,           // cartas que se ofrecen al subir de nivel
    nivelMaxManifestacion: 8,     // tope al que se puede subir un arma/tótem
    nivelParaEvolucionar: 4,      // nivel mínimo del arma para ofrecer su evolución

    // Curva de XP: xpSiguiente = a + nivel*b + nivel² * c
    xp: { inicial: 5, a: 5, b: 3, c: 0.4 },

    // Niveles que desbloquean cada trance (GDD §3.2)
    trance: { cuerpoAstral: 6, divino: 13 },

    // Recompensas de los paneles
    curacionBendicion: 0.5,  // "Bendición vital": cura este % de la vida máx.
    reliquiaVida: 20,        // "Reliquia de vida": +vida máx. y cura total
  },

  //////////////////////////////////////////////////
  // APARICIÓN DE ENEMIGOS
  //////////////////////////////////////////////////
  spawns: {
    // Enemigos comunes: el cooldown baja a medida que pasa el tiempo.
    //   cd = max(cdMin, cdBase - minutos * cdReduccionPorMinuto)
    normal: { timerInicial: 30, cdMin: 7, cdBase: 42, cdReduccionPorMinuto: 1.4 },

    // Élite: enemigo reforzado que suelta un Tótem de Oro.
    elite: { cadaSeg: 120, desdeSeg: 60, multVida: 3.5, escalaSprite: 1.4 },

    // Círculo de hechiceros alrededor del jugador.
    hechiceros: { cadaSeg: 120, desdeSeg: 12, cantidad: 8, radio: 360 },

    // Horda de bestias.
    horda: { cadaSeg: 5, desdeSeg: 5, cantidad: 30, radio: 150 },

    // Jefe final: aparece a esta distancia por encima del jugador.
    boss: { distanciaY: 460 },

    // Distancia a la que aparecen los enemigos (fuera de la pantalla):
    //   radio = max(anchoPantalla, altoPantalla) * factorPantalla + margen
    borde: { factorPantalla: 0.62, margen: 60 },

    // Qué enemigo aparece según el minuto de partida.
    // Se tira un número al azar [0,1) y se elige el primer umbral que lo supera.
    // Los umbrales son ACUMULADOS y el último debe ser 1.
    composicion: [
      { hastaMin: 2,        tabla: [['esqueleto', 1.00]] },
      { hastaMin: 4,        tabla: [['esqueleto', 0.85], ['bestia', 1.00]] },
      { hastaMin: 8,        tabla: [['esqueleto', 0.55], ['bestia', 1.00]] },
      { hastaMin: 10,       tabla: [['esqueleto', 0.40], ['bestia', 1.00]] },
      { hastaMin: 20,       tabla: [['esqueleto', 0.30], ['bestia', 0.62], ['hombreReptil', 0.93], ['golem', 1.00]] },
      { hastaMin: Infinity, tabla: [['esqueleto', 0.15], ['bestia', 0.42], ['hombreReptil', 0.66], ['golem', 1.00]] },
    ],
  },

  //////////////////////////////////////////////////
  // ENEMIGOS
  //   vida/dano escalan con la dificultad al aparecer.
  //   velocidad: px por frame.  cdAtaque: frames entre golpes.
  //   rango: distancia a la que ataca.  radio: colisión.
  //   kbResist: 0 = se empuja fácil, 1 = inmune al empuje.
  //////////////////////////////////////////////////
  enemigos: {
    esqueleto:    { vida: 18,   dano: 6,  velocidad: 0.6, espiritualidad: 1,  xp: 1,  cdAtaque: 55,  rango: 26,   radio: 12 },
    bestia:       { vida: 30,   dano: 9,  velocidad: 3,   espiritualidad: 2,  xp: 3,  cdAtaque: 45,  rango: 28,   radio: 12 },
    // El hombre reptil avanza zigzagueando (ver Enemigo._perseguir).
    hombreReptil: { vida: 10,   dano: 12, velocidad: 4,   espiritualidad: 3,  xp: 5,  cdAtaque: 40,  rango: 24,   radio: 12 },
    golem:        { vida: 180,  dano: 18, velocidad: 0.8, espiritualidad: 10, xp: 30, cdAtaque: 75,  rango: 34,   radio: 12, kbResist: 0.85 },

    // El hechicero no se mueve ni golpea: dispara proyectiles.
    hechicero: { vida: 55,   dano: 0,  velocidad: 0,    espiritualidad: 5,  xp: 10, cdAtaque: 120, rango: 9999, radio: 12,
                 danoProyectil: 8, esperaInicial: 60, esperaAzar: 60 },

    // Jefe final.
    chaman:    { vida: 4500, dano: 30, velocidad: 0.6,  espiritualidad: 0,  xp: 0,  cdAtaque: 90,  rango: 60,   radio: 12, kbResist: 1,
                 cdHabilidad: 180, cdHabilidadRecarga: 200, proyectilesRafaga: 12, danoProyectil: 10 },
  },

  // Proyectil genérico que disparan los enemigos.
  proyectilEnemigo: { velocidad: 3.6, vida: 240, radioImpacto: 22 },

  //////////////////////////////////////////////////
  // ARMAS (manifestaciones)
  //   El daño final se multiplica por el danoMult del jugador.
  //   cd = max(cdMin, cdBase - nivel * cdPorNivel)   [frames]
  //////////////////////////////////////////////////
  armas: {
    // Daga de Obsidiana (arma inicial): golpe chico al más cercano.
    daga: {
      golpe: { cdMin: 14, cdBase: 40, cdPorNivel: 3, danoBase: 8, danoPorNivel: 3, alcance: 200, radio: 26 },
      // Evolución: Macuahuitl — corte en semicírculo que roba vida.
      macuahuitl: { cdMin: 26, cdBase: 60, cdPorNivel: 3, danoBase: 16, danoPorNivel: 5, radio: 130, roboVida: 0.5, empuje: 3 },
    },

    // Jaguares Espectrales: orbitan al jugador y dañan al contacto.
    jaguares: {
      maxFelinos: 8,                        // cantidad = min(maxFelinos, 1 + nivel)
      radio: 78, radioEvo: 110,             // radio de la órbita
      giroBase: 0.04, giroPorNivel: 0.004,  // velocidad de giro
      dpsBase: 10, dpsPorNivel: 4,          // daño por segundo de CADA felino
      golpeRadio: 20, golpeRadioEvo: 30, golpeMargen: 12,
      empujeEvo: 1.5,
    },

    // Bolas de Veneno: orbes que estallan en charcos.
    veneno: {
      cdMin: 18, cdBase: 70, cdPorNivel: 6, alcance: 520,
      orbe: { velocidad: 6.5, vida: 70, radioImpacto: 22 },
      dpsBase: 16, dpsPorNivel: 6, multDpsEvo: 1.8,   // daño por segundo del charco
      charco: { radioBase: 28, radioPorNivel: 4, multRadioEvo: 1.4,
                vidaBase: 90, vidaPorNivel: 15, multVidaEvo: 1.5 },
    },

    // Cóndor Vigía: picada sobre un enemigo al azar.
    condor: {
      cdMin: 35, cdBase: 120, cdPorNivel: 9, alcance: 460,
      danoBase: 40, danoPorNivel: 22, multDanoEvo: 1.6,
      radio: 30, radioEvo: 70,                        // radio del impacto
      picada: { duracion: 12, altura: 180, extra: 8 },
    },

    // Estallido de Huaca: onda expansiva que empuja.
    huaca: {
      cdMin: 110, cdBase: 240, cdPorNivel: 14,
      radioBase: 120, radioPorNivel: 26,   // radioMax = radioBase + nivel * radioPorNivel
      velocidadOnda: 7, grosorOnda: 22,
      knockBase: 16, knockPorNivel: 3,
      danoBase: 22, danoPorNivel: 9,
      marca: { vida: 120, factorRadio: 0.7, danoBase: 30, danoPorNivel: 10 },
    },
  },

  //////////////////////////////////////////////////
  // TÓTEMS (pasivas)
  //////////////////////////////////////////////////
  totems: {
    fuego:      { multPorNivel: 1.1 },   // daño:      base * 1.1^nivel
    tierra:     { multPorNivel: 0.9 },   // defensa:   1 - (1-base) * 0.9^nivel
    aire:       { multPorNivel: 1.1 },   // velocidad: base * 1.1^nivel
    agua:       { regenPorNivel: 1.2 },  // regeneración: base + 1.2 por nivel (vida/seg)
    // Robo de vida: se suma APARTE del robo propio del arma (ej. Macuahuitl).
    sacrificio: { roboBase: 0.20, roboPorNivel: 0.05 },
  },

  //////////////////////////////////////////////////
  // ALTAR (meta-progresión permanente)
  //////////////////////////////////////////////////
  altar: {
    // costo del nivel n = costoBase + n * costoInc
    mejoras: [
      { id: "bendicion",    nombre: "Bendición de la Tierra",   icon: "🌿",
        desc: "+20% de radio de recolección por nivel.", maxNivel: 6, costoBase: 30, costoInc: 25 },
      { id: "atencion",     nombre: "Atención de los Espíritus", icon: "👁",
        desc: "Ofrece 3 opciones al subir de nivel (en vez de 2).", maxNivel: 1, costoBase: 250, costoInc: 0 },
      { id: "pielCaiman",   nombre: "Piel de Caimán",           icon: "🐊",
        desc: "+25 de vida máxima por nivel.", maxNivel: 6, costoBase: 40, costoInc: 30 },
      { id: "canalizacion", nombre: "Canalización Veloz",        icon: "⚡",
        desc: "+8% de daño base por nivel.", maxNivel: 6, costoBase: 50, costoInc: 35 },
      { id: "boveda",       nombre: "Bóveda Sagrada",            icon: "📜",
        desc: "+1 ranura de arma y +1 de tótem por nivel.", maxNivel: 2, costoBase: 200, costoInc: 200 },
    ],

    // Efecto de cada mejora (deben coincidir con los textos de arriba)
    bendicionRadioPorNivel: 0.2,   // +20% radio de recolección
    pielVidaPorNivel: 25,          // +25 vida máx.
    canalizacionDanoPorNivel: 0.08,// +8% daño base
    opcionesConAtencion: 3,        // cartas al subir de nivel con "Atención"
    ranurasBase: 2,                // maxArmas/maxTotems = ranurasBase + nivel de Bóveda
  },
};
