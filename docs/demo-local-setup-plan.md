# Plan — Arrancar el Demo en Local (Hackathon)

**Rama:** `integration/full-prototype`  
**Repo:** https://github.com/TonyINSY6629/Project_for_IBM_Hackathon_Bob_in_Action  
**Objetivo:** tener el demo completo corriendo en local en menos de 15 minutos.

---

## Requisitos previos

| Herramienta | Versión mínima | Comprobación |
|---|---|---|
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| Git | cualquiera | `git --version` |

---

## Sub-Task 1 — Clonar el repositorio

**Status:** [ ] pending

**Intent**  
Obtener el código completo de `integration/full-prototype` en tu máquina.

**Todo**
1. Abre una terminal.
2. Ejecuta:
   ```bash
   git clone https://github.com/TonyINSY6629/Project_for_IBM_Hackathon_Bob_in_Action.git
   cd Project_for_IBM_Hackathon_Bob_in_Action
   git checkout integration/full-prototype
   ```
3. Verifica que existen las carpetas `server/`, `web/`, `fixtures/`.

**Expected Outcomes**
- Carpeta `Project_for_IBM_Hackathon_Bob_in_Action/` creada localmente.
- Rama activa: `integration/full-prototype`.
- Estructura:
  ```
  server/   ← Part 2: Express + Attention Manager
  web/      ← Part 3: React visual
  src/      ← Part 1: muestra de trabajo Bob
  fixtures/ ← demo-run.json (27 eventos, ~70s)
  ```

---

## Sub-Task 2 — Instalar dependencias del servidor (Part 2)

**Status:** [ ] pending

**Intent**  
El servidor Express necesita sus dependencias para arrancar y emitir los eventos SSE.

**Todo**
1. En la terminal, desde la raíz del proyecto:
   ```bash
   cd server
   npm install
   ```
2. Verifica que `node_modules/` se ha creado dentro de `server/`.

**Expected Outcomes**
- `server/node_modules/` existe.
- Sin errores de npm (warnings de deprecated son normales).

**Paquetes que instala:** `express`, `uuid`, `tsx`, `typescript`, `vitest`.

---

## Sub-Task 3 — Instalar dependencias del frontend (Part 3)

**Status:** [ ] pending

**Intent**  
El frontend React necesita sus dependencias para compilarse con Vite.

**Todo**
1. Desde la raíz del proyecto (nueva terminal o vuelve atrás):
   ```bash
   cd web
   npm install
   ```
2. Verifica que `web/node_modules/` se ha creado.

**Expected Outcomes**
- `web/node_modules/` existe.
- Sin errores de npm.

**Paquetes que instala:** `react`, `react-dom`, `framer-motion`, `vite`, `typescript`.

---

## Sub-Task 4 — Arrancar el servidor (Part 2)

**Status:** [ ] pending

**Intent**  
El servidor Express escucha en `http://localhost:3000` y gestiona:
- `POST /api/runs` — inicia la demo en modo replay
- `GET /api/runs/:id/stream` — emite los eventos SSE al frontend
- `POST /api/runs/:id/decisions` — recibe respuestas del developer
- `GET /api/runs/:id/report` — devuelve el reporte final

**Todo**
1. En la carpeta `server/`:
   ```bash
   npm run dev
   ```
2. Espera a ver en la consola:
   ```
   [bob-break] Server running on http://localhost:3000
   [bob-break] Health: http://localhost:3000/api/health
   ```
3. Verifica que el servidor responde:
   ```bash
   curl http://localhost:3000/api/health
   # → { "status": "ok" }
   ```
4. **Deja esta terminal abierta** durante todo el demo.

**Expected Outcomes**
- Servidor corriendo en `http://localhost:3000`.
- `/api/health` devuelve `{ "status": "ok" }`.

**Nota:** el servidor usa `tsx watch` — se reinicia automáticamente si cambias algún archivo.

---

## Sub-Task 5 — Arrancar el frontend (Part 3)

**Status:** [ ] pending

**Intent**  
El frontend React arranca en `http://localhost:5173` y se comunica con el servidor
a través del proxy configurado en `web/vite.config.ts` (`/api` → `localhost:3000`).

**Todo**
1. Abre **una segunda terminal** (el servidor debe seguir corriendo en la primera).
2. En la carpeta `web/`:
   ```bash
   npm run dev
   ```
3. Espera a ver:
   ```
   VITE vX.X.X  ready in XXX ms
   ➜  Local:   http://localhost:5173/
   ```
4. Abre el navegador en `http://localhost:5173`.
5. **Deja esta terminal abierta** durante todo el demo.

**Expected Outcomes**
- Interfaz visual de Bob Break cargada en el navegador.
- Cuatro plantas visibles en el jardín (estado inicial: semilla).

---

## Sub-Task 6 — Ejecutar el demo completo (replay mode)

**Status:** [ ] pending

**Intent**  
Verificar que el demo funciona de principio a fin: 4 agentes en paralelo,
decisión del developer, blocker, completación, reporte final.

**Todo**
1. En el navegador (`http://localhost:5173`), haz clic en **"Start run"**.
2. Observa la secuencia (~70 segundos):

| Tiempo | Qué ves |
|---|---|
| 0s | Las 4 plantas aparecen como semillas |
| 5–20s | Las plantas crecen en paralelo (eventos ocultos al developer) |
| ~30s | **El jardín se pausa** — aparece una tarjeta de decisión |
| — | Selecciona una opción y haz clic en confirmar |
| ~35s | El jardín reanuda — las plantas siguen creciendo |
| ~45s | Aparece una **alerta de blocker** (test-runner) |
| ~55–70s | Las 4 plantas florecen una a una |
| ~70s | **Pantalla de reporte final** — métricas y resumen |

3. Verifica que el reporte final muestra:
   - Los 4 analizadores con estado `done`.
   - La decisión que tomaste.
   - El blocker detectado.
   - Las métricas: eventos totales, ocultos, superficiales, ratio de supresión.

**Expected Outcomes**
- Demo completo sin errores en consola.
- Decisión registrada en el reporte.
- Blocker visible en el reporte.
- ~81% de eventos ocultos (22 de 27).

---

## Sub-Task 7 — Ejecutar los tests de Part 2 (verificación)

**Status:** [ ] pending

**Intent**  
Confirmar que la lógica del Attention Manager funciona correctamente
antes del hackathon.

**Todo**
1. En la carpeta `server/`:
   ```bash
   npm test
   ```
2. Verifica que todos los tests pasan (40+):
   ```
   ✓ classifyEvent — routine progress → visual-progress
   ✓ classifyEvent — question with options → decision
   ✓ classifyEvent — blocker → blocker
   ✓ classifyEvent — critical severity → critical-alert
   ✓ classifyEvent — complete → completed
   ... (40+ tests)
   Test Files  1 passed (1)
   Tests       X passed (X)
   ```
3. Opcional — typecheck:
   ```bash
   npm run typecheck
   ```

**Expected Outcomes**
- `npm test` sale con código 0.
- Sin errores de TypeScript en `npm run typecheck`.

---

## Sub-Task 8 — Modo rápido para ensayo (opcional)

**Status:** [ ] pending

**Intent**  
Para ensayar el demo múltiples veces sin esperar 70 segundos, hay un modo
acelerado 10× (`speedMultiplier: 0.1`) que completa el demo en ~7 segundos.

**Todo**
1. Abre `server/src/index.ts`.
2. Busca la línea:
   ```ts
   speedMultiplier: 1,
   ```
3. Cámbiala a:
   ```ts
   speedMultiplier: 0.1,
   ```
4. El servidor recarga automáticamente (tsx watch).
5. Haz clic en "Start run" — el demo completa en ~7 segundos.
6. **Antes del hackathon, restáuralo a `1`.**

**Expected Outcomes**
- Demo completo en ~7 segundos para ensayo.
- Sin cambio de comportamiento — solo la velocidad varía.


## Sub-Task 9 — Generar el informe de evidencia HTML para el validador

**Status:** [ ] pending

**Intent**  
Producir un fichero HTML único (`evidence/hackathon-evidence.html`) que el validador
humano puede abrir en cualquier navegador sin dependencias. Recoge en orden:
capturas de pantalla del demo, resultados de tests, métricas reales del run,
el reporte final generado, y el código fuente de los archivos clave.

**Todo**

### Paso A — Capturar pantallas del demo (mientras corre en http://localhost:5173)

Haz una captura en cada uno de estos momentos y guárdalas en la carpeta `evidence/`:

| Nombre del archivo | Momento |
|---|---|
| `01-garden-start.png` | Jardín recién iniciado — 4 plantas en semilla |
| `02-garden-growing.png` | Plantas creciendo en paralelo |
| `03-decision-card.png` | Tarjeta de decisión visible, jardín pausado |
| `04-decision-answered.png` | Jardín reanudado tras responder |
| `05-blocker-alert.png` | Alerta de blocker visible |
| `06-all-completed.png` | Las 4 plantas florecidas |
| `07-release-report.png` | Pantalla del reporte final |

> En Windows: `Win + Shift + S` para captura de región → guardar como PNG en `evidence/`.

### Paso B — Guardar output de tests y typecheck

```bash
cd server
npm test > ../evidence/test-results.txt 2>&1
npm run typecheck > ../evidence/typecheck-results.txt 2>&1
cd ..
```

### Paso C — Obtener el reporte JSON del run completado

Cuando el demo termine, copia el `runId` que aparece en la consola del servidor
y ejecuta:

```bash
curl http://localhost:3000/api/runs/REPLACE_WITH_RUN_ID/report > evidence/release-report.json
```

### Paso D — Crear el script generador de evidencia

Crea el archivo `evidence/generate-evidence.js` con este contenido:

```js
// evidence/generate-evidence.js
// Ejecutar desde la raíz: node evidence/generate-evidence.js
// Genera: evidence/hackathon-evidence.html

import { readFileSync, writeFileSync } from "fs";
import { extname } from "path";

function readText(f) {
  try { return readFileSync(f, "utf-8"); } catch { return null; }
}
function imgBase64(f) {
  try {
    const mime = extname(f).toLowerCase() === ".jpg" ? "image/jpeg" : "image/png";
    return `data:${mime};base64,${readFileSync(f).toString("base64")}`;
  } catch { return null; }
}

const shots = [
  ["evidence/01-garden-start.png",      "1. Garden start — 4 plants at seedling"],
  ["evidence/02-garden-growing.png",    "2. Plants growing in parallel"],
  ["evidence/03-decision-card.png",     "3. Decision card — garden paused"],
  ["evidence/04-decision-answered.png", "4. Garden resumed after answer"],
  ["evidence/05-blocker-alert.png",     "5. Blocker alert visible"],
  ["evidence/06-all-completed.png",     "6. All 4 plants flowering"],
  ["evidence/07-release-report.png",    "7. Release report screen"],
];

const codeFiles = [
  ["server/src/types/bob-events.ts",            "Shared event contract"],
  ["server/src/attention/classifyEvent.ts",      "Event classifier (pure function)"],
  ["server/src/attention/attentionReducer.ts",   "Attention reducer"],
  ["server/src/attention/createSummary.ts",      "Summary generator"],
  ["server/src/adapters/replayEventAdapter.ts",  "Replay adapter"],
  ["server/tests/attention.test.ts",             "Unit tests (40+)"],
  ["server/src/index.ts",                        "Express server + SSE routes"],
];

const e = s => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

const screensHtml = shots.map(([f,l]) => {
  const src = imgBase64(f);
  return src
    ? `<figure><img src="${src}" alt="${l}"><figcaption>${l}</figcaption></figure>`
    : `<div class="missing">⚠ ${l} — screenshot not found (${f})</div>`;
}).join("\n");

const codeHtml = codeFiles.map(([f,l]) => {
  const src = readText(f);
  return src
    ? `<details><summary>${l} <code>${f}</code></summary><pre>${e(src)}</pre></details>`
    : `<div class="missing">⚠ ${l} — file not found (${f})</div>`;
}).join("\n");

const tests     = readText("evidence/test-results.txt");
const typecheck = readText("evidence/typecheck-results.txt");
const report    = readText("evidence/release-report.json");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Bob Break — Hackathon Evidence</title>
<style>
  body{font-family:-apple-system,"Segoe UI",sans-serif;max-width:900px;margin:0 auto;padding:40px 24px;color:#1f2328;background:#fff}
  h1{font-size:24px;border-bottom:3px solid #0f62fe;padding-bottom:8px}
  h2{font-size:17px;margin-top:40px;color:#0f62fe;border-bottom:1px solid #e0e0e0;padding-bottom:4px}
  figure{margin:12px 0;border:1px solid #e0e0e0;border-radius:4px;overflow:hidden}
  figure img{width:100%;display:block}
  figcaption{padding:7px 12px;background:#f4f4f4;font-size:12px;color:#525252}
  pre{background:#f4f4f4;padding:14px;overflow-x:auto;font-size:11.5px;font-family:monospace;border-radius:4px;margin:0}
  details{margin:8px 0;border:1px solid #e0e0e0;border-radius:4px}
  summary{padding:9px 14px;cursor:pointer;background:#f4f4f4;font-size:13px;font-weight:600}
  summary code{font-weight:400;color:#525252;margin-left:8px;font-size:12px}
  .missing{padding:9px 12px;background:#fff3cd;border:1px solid #ffc107;border-radius:4px;font-size:13px;margin:8px 0}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:16px 0}
  .card{background:#f4f4f4;border-left:4px solid #0f62fe;padding:12px 16px;border-radius:2px}
  .card .v{font-size:28px;font-weight:700;color:#0f62fe}
  .card .l{font-size:12px;color:#525252;margin-top:2px}
  table{width:100%;border-collapse:collapse;font-size:13px;margin:12px 0}
  th{background:#f4f4f4;border:1px solid #e0e0e0;padding:7px 10px;text-align:left}
  td{border:1px solid #e0e0e0;padding:6px 10px}
  footer{margin-top:60px;padding-top:14px;border-top:1px solid #e0e0e0;text-align:center;font-size:12px;color:#8d8d8d}
</style>
</head>
<body>
<h1>Bob Break — Hackathon Evidence</h1>
<p>IBM TechXchange 2026 Pre-conference Dev Day Hackathon<br>
<strong>Theme:</strong> Build with purpose using IBM Bob 2.0 &nbsp;·&nbsp;
<strong>Generated:</strong> ${new Date().toLocaleString()}</p>

<div class="grid">
  <div class="card"><div class="v">3</div><div class="l">Team members</div></div>
  <div class="card"><div class="v">4</div><div class="l">Parallel agents</div></div>
  <div class="card"><div class="v">~81%</div><div class="l">Events suppressed</div></div>
</div>

<h2>1. Demo Screenshots</h2>
${screensHtml}

<h2>2. Test Results</h2>
${tests ? `<pre>${e(tests)}</pre>` : '<div class="missing">⚠ Run: cd server && npm test > ../evidence/test-results.txt 2>&1</div>'}

<h2>3. TypeScript Type Check</h2>
${typecheck ? `<pre>${e(typecheck)}</pre>` : '<div class="missing">⚠ Run: cd server && npm run typecheck > ../evidence/typecheck-results.txt 2>&1</div>'}

<h2>4. Release Report (JSON output of createSummary)</h2>
${report ? `<pre>${e(JSON.stringify(JSON.parse(report),null,2))}</pre>` : '<div class="missing">⚠ Run demo then: curl http://localhost:3000/api/runs/RUN_ID/report > evidence/release-report.json</div>'}

<h2>5. Attention Routing Rules</h2>
<table>
  <tr><th>#</th><th>Condition</th><th>Route</th><th>Developer sees</th></tr>
  <tr><td>1</td><td>severity === "critical"</td><td>critical-alert</td><td>Immediate alert</td></tr>
  <tr><td>2</td><td>type === "risk"</td><td>critical-alert</td><td>Immediate alert</td></tr>
  <tr><td>3</td><td>type === "complete" or phase === "done"</td><td>completed</td><td>Plant flowers, progress 100%</td></tr>
  <tr><td>4</td><td>type === "question" + decision object</td><td>decision</td><td>Decision card, garden paused</td></tr>
  <tr><td>5</td><td>type === "blocker"</td><td>blocker</td><td>Blocker notice</td></tr>
  <tr><td>6</td><td>everything else</td><td>visual-progress</td><td>Silent — plant grows</td></tr>
</table>

<h2>6. Source Code — Key Files</h2>
${codeHtml}

<h2>7. Architecture</h2>
<table>
  <tr><th>Component</th><th>File</th><th>Description</th></tr>
  <tr><td>Shared types</td><td><code>server/src/types/bob-events.ts</code></td><td>Single contract used by all 3 parts</td></tr>
  <tr><td>Event classifier</td><td><code>server/src/attention/classifyEvent.ts</code></td><td>Pure function: BobEvent → AttentionRoute</td></tr>
  <tr><td>State reducer</td><td><code>server/src/attention/attentionReducer.ts</code></td><td>Pure reducer: (RunState, action) → RunState</td></tr>
  <tr><td>Summary builder</td><td><code>server/src/attention/createSummary.ts</code></td><td>RunState → ReleaseReport</td></tr>
  <tr><td>Replay adapter</td><td><code>server/src/adapters/replayEventAdapter.ts</code></td><td>Deterministic fixture replay + decision pausing</td></tr>
  <tr><td>HTTP server</td><td><code>server/src/index.ts</code></td><td>Express + SSE on port 3000</td></tr>
  <tr><td>Run context</td><td><code>web/src/context/RunContext.tsx</code></td><td>React context + SSE consumer</td></tr>
</table>

<h2>8. IBM Bob 2.0 Usage Statement</h2>
<p>IBM Bob Agent mode and subagents were used to plan, implement, test, and document Part 2 (Attention Manager)
entirely within Bob. Bob read the team's shared contracts and existing code before writing a single line,
classified events using a pure deterministic function, maintained run state with a pure reducer,
and generated a structured report — all verifiable by the unit tests included in this evidence report.</p>

<footer>Made with IBM Bob 2.0 &nbsp;·&nbsp; Bob Break &nbsp;·&nbsp; IBM TechXchange 2026</footer>
</body></html>`;

writeFileSync("evidence/hackathon-evidence.html", html, "utf-8");
console.log("✅ Generated: evidence/hackathon-evidence.html");
```

### Paso E — Ejecutar el script

Desde la **raíz del proyecto**:
```bash
node evidence/generate-evidence.js
```

### Paso F — Abrir y verificar el HTML

```bash
# Windows
start evidence/hackathon-evidence.html

# macOS
open evidence/hackathon-evidence.html
```

**Expected Outcomes**
- `evidence/hackathon-evidence.html` existe y se abre en el navegador sin servidor.
- El HTML contiene screenshots, resultados de tests, reporte JSON y código fuente.
- El validador humano puede entender el proyecto completo leyendo solo este fichero.
- No requiere conexión a internet ni Node.js para visualizarse.

**Archivos que produce este sub-task:**
- `evidence/generate-evidence.js` — script generador (crearlo manualmente con el código de arriba)
- `evidence/hackathon-evidence.html` — **fichero final de entrega**

---


---

## Resumen de comandos

```bash
# 1. Clonar
git clone https://github.com/TonyINSY6629/Project_for_IBM_Hackathon_Bob_in_Action.git
cd Project_for_IBM_Hackathon_Bob_in_Action
git checkout integration/full-prototype

# 2. Instalar
cd server && npm install && cd ..
cd web    && npm install && cd ..

# 3. Arrancar (dos terminales)
# Terminal 1:
cd server && npm run dev

# Terminal 2:
cd web && npm run dev

# 4. Abrir navegador
# http://localhost:5173

# 5. Tests (opcional)
cd server && npm test
```

---

## Solución de problemas comunes

| Problema | Causa probable | Solución |
|---|---|---|
| `npm: command not found` | Node.js no instalado | Instalar desde https://nodejs.org (LTS) |
| Puerto 3000 ocupado | Otro proceso usa el puerto | `npx kill-port 3000` o cambiar PORT en server |
| Puerto 5173 ocupado | Otro proceso usa el puerto | Vite elige automáticamente el siguiente disponible |
| `Cannot find module 'tsx'` | `npm install` no ejecutado en `server/` | `cd server && npm install` |
| El jardín no carga | Servidor no arrancado | Verificar que `npm run dev` en `server/` está corriendo |
| Tarjeta de decisión no aparece | Fixture no cargado | Verificar que `fixtures/demo-run.json` existe |
| Demo no arranca en el navegador | Error de CORS | Verificar que el servidor corre en puerto 3000 exactamente |
