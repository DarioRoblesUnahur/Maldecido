/* ============================================================
   Altar de los Dioses (GDD §5)
   Meta-progresión permanente. Se gasta la Espiritualidad
   acumulada en las incursiones. Persiste en localStorage.
   ============================================================ */
class Altar {
  static KEY = "maldecido_altar_v1";

  static MEJORAS = [
    { id: "bendicion",  nombre: "Bendición de la Tierra", icon: "🌿",
      desc: "+20% de radio de recolección por nivel.", maxNivel: 6, costoBase: 30, costoInc: 25 },
    { id: "atencion",   nombre: "Atención de los Espíritus", icon: "👁",
      desc: "Ofrece 3 opciones al subir de nivel (en vez de 2).", maxNivel: 1, costoBase: 250, costoInc: 0 },
    { id: "pielCaiman", nombre: "Piel de Caimán", icon: "🐊",
      desc: "+25 de vida máxima por nivel.", maxNivel: 6, costoBase: 40, costoInc: 30 },
    { id: "canalizacion", nombre: "Canalización Veloz", icon: "⚡",
      desc: "+8% de daño base por nivel.", maxNivel: 6, costoBase: 50, costoInc: 35 },
    { id: "boveda",     nombre: "Bóveda Sagrada", icon: "📜",
      desc: "+1 ranura de arma y +1 de tótem por nivel.", maxNivel: 2, costoBase: 200, costoInc: 200 },
  ];

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
    const bendicion = Altar.nivelDe("bendicion");
    const atencion  = Altar.nivelDe("atencion");
    const piel      = Altar.nivelDe("pielCaiman");
    const canal     = Altar.nivelDe("canalizacion");
    const boveda    = Altar.nivelDe("boveda");

    // bases para los tótems
    jugador._danoBaseMult = 1 + 0.08 * canal;
    jugador._velBaseMult  = 1;
    jugador._defBase      = 0;
    jugador._regenBase    = 0;

    jugador.danoMult      = jugador._danoBaseMult;
    jugador.velocidadMult = 1;
    jugador.reduccionDano = 0;
    jugador.regenPorSeg   = 0;

    jugador.radioRecoleccion = 70 * (1 + 0.2 * bendicion);
    jugador.vidaMax = 100 + 25 * piel;
    jugador.vida    = jugador.vidaMax;

    jugador.maxArmas  = 2 + boveda;
    jugador.maxTotems = 2 + boveda;
    jugador.opcionesNivelUp = atencion >= 1 ? 3 : 2;
  }
}
