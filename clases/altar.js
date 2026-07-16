/* ============================================================
   Altar de los Dioses (GDD §5)
   Meta-progresión permanente. Se gasta la Espiritualidad
   acumulada en las incursiones. Persiste en localStorage.
   ============================================================ */
class Altar {
  static KEY = "maldecido_altar_v1";

  // Los números (costos, topes y efectos) viven en CONFIG.altar
  static MEJORAS = CONFIG.altar.mejoras;

  static _datos() {
    try {
      const raw = localStorage.getItem(Altar.KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { espiritualidad: 0, niveles: {} };
  }
  static _guardar(d) {
    try { localStorage.setItem(Altar.KEY, JSON.stringify(d)); } catch (e) {}
  }

  static get espiritualidad() { return Altar._datos().espiritualidad; }
  static agregarEspiritualidad(n) {
    const d = Altar._datos(); d.espiritualidad += n; Altar._guardar(d);
  }
  static nivelDe(id) { return Altar._datos().niveles[id] || 0; }

  static costoSiguiente(id) {
    const m = Altar.MEJORAS.find(x => x.id === id);
    const n = Altar.nivelDe(id);
    if (n >= m.maxNivel) return null;
    return m.costoBase + n * m.costoInc;
  }

  // true si compró
  static comprar(id) {
    const d = Altar._datos();
    const m = Altar.MEJORAS.find(x => x.id === id);
    const n = d.niveles[id] || 0;
    if (n >= m.maxNivel) return false;
    const costo = m.costoBase + n * m.costoInc;
    if (d.espiritualidad < costo) return false;
    d.espiritualidad -= costo;
    d.niveles[id] = n + 1;
    Altar._guardar(d);
    return true;
  }

  static resetear() {
    Altar._guardar({ espiritualidad: 0, niveles: {} });
  }

  // Aplica las mejoras permanentes al jugador al iniciar la partida
  static aplicarAJugador(jugador) {
    const cfg = CONFIG.altar;
    const bendicion = Altar.nivelDe("bendicion");
    const atencion  = Altar.nivelDe("atencion");
    const piel      = Altar.nivelDe("pielCaiman");
    const canal     = Altar.nivelDe("canalizacion");
    const boveda    = Altar.nivelDe("boveda");

    // bases para los tótems
    jugador._danoBaseMult = 1 + cfg.canalizacionDanoPorNivel * canal;
    jugador._velBaseMult  = 1;
    jugador._defBase      = 0;
    jugador._regenBase    = 0;
    jugador._roboBase     = 0;

    jugador.danoMult      = jugador._danoBaseMult;
    jugador.velocidadMult = 1;
    jugador.reduccionDano = 0;
    jugador.regenPorSeg   = 0;
    jugador.roboVida      = 0;

    jugador.radioRecoleccion = CONFIG.jugador.radioRecoleccion * (1 + cfg.bendicionRadioPorNivel * bendicion);
    jugador.vidaMax = CONFIG.jugador.vidaMax + cfg.pielVidaPorNivel * piel;
    jugador.vida    = jugador.vidaMax;

    jugador.maxArmas  = cfg.ranurasBase + boveda;
    jugador.maxTotems = cfg.ranurasBase + boveda;
    jugador.opcionesNivelUp = atencion >= 1 ? cfg.opcionesConAtencion : CONFIG.jugador.opcionesNivelUp;
  }
}
