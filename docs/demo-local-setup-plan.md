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
