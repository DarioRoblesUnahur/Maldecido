# Maldecido — El Trance del Chamán

Un juego de supervivencia top-down con estética de selva oscura y mitología chamánica. Sobreviví 30 minutos de oleadas de enemigos, subí de nivel eligiendo **Manifestaciones** chamánicas, y derrotá al **Chamán Usurpador** para ganar.

Hecho con [PixiJS](https://pixijs.com/) y vanilla JavaScript, sin frameworks ni bundlers — se abre directo en el navegador.

---

## Cómo jugar

| Acción | Control |
|---|---|
| Moverse | `WASD` o flechas |
| Ataques | Automáticos |
| Elegir mejora | Click o teclas `1` / `2` / `3` |
| Pausa | `ESC` |

**Objetivo:** sobreviví 30 minutos. Al completar el tiempo aparece el jefe final. Derrotarlo es la única forma de ganar.

---

## Mecánicas principales

**Manifestaciones** — armas y habilidades automáticas que se eligen al subir de nivel. Podés tener hasta 4 armas y 4 tótems simultáneamente.

**Tótems pasivos** — modifican stats del chamán (daño, velocidad, defensa, regeneración). Combinados con ciertas armas habilitan **Evoluciones**.

**Altar de los Dioses** — entre partidas, gastá Espiritualidad acumulada para desbloquear mejoras permanentes como más ranuras, mayor daño base o radio de recolección ampliado.

**Fases del mapa** — la partida atraviesa tres zonas con enemigos y música distintos:
1. La Selva Olvidada (min 0–10)
2. Las Ruinas de Piedra (min 10–20)
3. El Templo de la Luna (min 20–30)

**Enemigos especiales** — cada 3 minutos aparece un Élite (3.5× vida, suelta un Tótem de Oro). También hay círculos de hechiceros y hordas de bestias.

---

## Enemigos

| Tipo | Descripción |
|---|---|
| Guerrero | Cuerpo a cuerpo, básico |
| Bestia | Rápida, embiste en línea recta |
| Sombra | Esquiva, baja vida pero ágil |
| Hechicero | Dispara proyectiles a distancia |
| Golem | Lento, muy resistente |
| Chamán Usurpador | Jefe final, aparece al minuto 30 |

---

## Jerarquía de clases

```
GameObject
├── EntidadConSalud
│   ├── Jugador
│   └── Enemigo
│       ├── Guerrero
│       ├── Bestia
│       ├── Sombra
│       ├── Hechicero
│       ├── Golem
│       └── ChamanUsurpador  ← jefe final
└── ObjetoConsumible
    ├── OrbeDeExperiencia
    └── TotemDeOro

Manifestacion
├── JaguaresEspectrales
├── BolasDeVeneno
├── CondorVigia
├── EstallidoDeHuaca
└── Totem  (pasivo)
    ├── TotemFuego
    ├── TotemTierra
    ├── TotemAire
    └── TotemAgua
```

## Estructura del proyecto

```
index.html                          # entrada, UI y carga de scripts
clases/
  base/
    gameObject.js                   # clase raíz con posición y sprite
    entidadConSalud.js              # vida, daño, flash visual, regeneración
  jugador.js                        # movimiento, XP, nivel, trance
  enemigos/
    vistas.js                       # builders de gráficos para cada enemigo
    enemigo.js                      # clase base de enemigos
    guerrero.js
    bestia.js
    sombra.js
    hechicero.js
    golem.js
    chamanUsurpador.js
  consumibles/
    objetoConsumible.js             # base con lógica de imán
    orbeDeExperiencia.js
    totemDeOro.js
  manifestaciones/
    manifestacion.js                # clase base
    jaguaresEspectrales.js
    bolasDeVeneno.js
    condorVigia.js
    estallido.js                    # EstallidoDeHuaca
    totem.js                        # Totem base pasivo
    totemFuego.js
    totemTierra.js
    totemAire.js
    totemAgua.js
    catalogo.js                     # CATALOGO, EVOLUCIONES, metaDe()
  altar.js                          # meta-progresión permanente (localStorage)
  game.js                           # loop principal, spawns, cámara, HUD
assets/                             # sprites e imágenes
pixi.js                             # PixiJS v8 (local)
```

---

## Ejecutar localmente

Necesitás servir los archivos desde un servidor HTTP (el navegador bloquea módulos ES locales).

Con Python:
```bash
python -m http.server 8080
```

Con Node.js:
```bash
npx serve .
```

Luego abrí `http://localhost:8080` en el navegador.

---

## Créditos

Diseño y programación: Dario Robles  
Motor gráfico: [PixiJS](https://pixijs.com/)
