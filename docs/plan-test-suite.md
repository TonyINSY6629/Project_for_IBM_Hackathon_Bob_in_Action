# Plan — Test Suite Completa: Part 3 + Integration

> **Objetivo:** cubrir todos los acceptance criteria de la hackathon con tests
> automáticos que se puedan ejecutar por parte en cualquier rama y juntos tras el
> merge final.
>
> **Leer primero:**
> - [`docs/development-work-split.md`](./development-work-split.md) — acceptance criteria de cada parte
> - [`docs/design-brief.md`](./design-brief.md) — requisitos de accesibilidad (§ 7)
> - [`server/tests/attention.test.ts`](../server/tests/attention.test.ts) — referencia del estilo ya establecido
> - [`web/src/context/RunContext.tsx`](../web/src/context/RunContext.tsx) — reducer y lógica a testear
> - [`fixtures/demo-run.json`](../fixtures/demo-run.json) — fixture de referencia
>
> **Stack de tests por capa:**
>
> | Capa | Framework | Dónde viven |
> |---|---|---|
> | Part 2 — Attention Manager | Vitest (ya existe) | `server/tests/` |
> | Part 2 — HTTP API server | Vitest + supertest | `server/tests/` |
> | Part 3 — Frontend logic | Vitest + React Testing Library | `web/src/__tests__/` |
> | Part 3 — Accesibilidad | jest-axe / vitest-axe | `web/src/__tests__/` |
> | Integration — Demo completa | Vitest + supertest (black-box) | `tests/integration/` |
>
> **Comandos objetivo tras el merge:**
> ```
> # Por parte (en sus propias ramas)
> cd server && npm test          # Part 2: attention + API
> cd web    && npm test          # Part 3: frontend logic + a11y
>
> # Integración completa (desde raíz, tras merge)
> npm test --workspace           # todos + integration
> ```

---

## Resumen de acceptance criteria mapeados a tests

### Part 1 — Fixture validation
| Criterion | Test approach |
|---|---|
| Fixture es un array válido de `BobEvent` | Schema validation test en `server/tests/fixture.test.ts` |
| Contiene los 5 event types | Assertion sobre fixture cargado |
| Contiene los 4 `AnalyzerId` | Assertion sobre fixture cargado |
| `replayDelayMs` suma 60–90 s | Suma acumulada de delays en test |

### Part 2 — Attention Manager (ya cubiertos en `attention.test.ts`)
| Criterion | Test |
|---|---|
| `classifyEvent` cubre los 5 tipos | ✅ Existe |
| `critical` severity → `critical-alert` siempre | ✅ Existe |
| Decision route solo cuando `decision != null` | ✅ Existe |
| All-done solo tras los 4 `AnalyzerId` | ✅ Existe |
| `createSummary` retorna `ReleaseReport` | ✅ Existe |
| Replay pausa en `question`, reanuda en `submitAnswer` | `server/tests/replayAdapter.test.ts` (nuevo) |
| HTTP API: endpoints responden correctamente | `server/tests/api.test.ts` (nuevo) |

### Part 3 — Frontend
| Criterion | Test |
|---|---|
| Garden renderiza una planta por cada `AnalyzerId` | `web/src/__tests__/AgentGarden.test.tsx` |
| Plant progress driven por `RunState.analyzers[id].progress` | `web/src/__tests__/AgentPlant.test.tsx` |
| Los 5 estados de planta son visualmente distintos | `web/src/__tests__/AgentPlant.test.tsx` |
| `DecisionCard` solo cuando `pendingDecision != null` | `web/src/__tests__/DecisionCard.test.tsx` |
| `DecisionCard` emite `SUBMIT_ANSWER` al reducer | `web/src/__tests__/DecisionCard.test.tsx` |
| `RiskAlert` usa paleta calmada (sin rojo alarmante) | `web/src/__tests__/RiskAlert.test.tsx` |
| `CompletionSummary` renderiza `ReleaseReport` sin JSON crudo | `web/src/__tests__/CompletionSummary.test.tsx` |
| `runReducer` (mirror del servidor) es correcto | `web/src/__tests__/runReducer.test.ts` |
| Sin violaciones axe en la vista principal | `web/src/__tests__/a11y.test.tsx` |

### Integration — Demo completa
| Criterion | Test |
|---|---|
| POST /api/runs devuelve id | `tests/integration/demo.test.ts` |
| SSE stream emite BobEvents correctamente | `tests/integration/demo.test.ts` |
| Fixture completa produce status "completed" | `tests/integration/demo.test.ts` |
| Decision sub-flow: pausa + respuesta + reanuda | `tests/integration/demo.test.ts` |
| ReleaseReport final tiene los 4 analyzer reports | `tests/integration/demo.test.ts` |

---

## Sub-Task 1 — Fixture validation tests

**Status:** `[ ] pending`

**Intent**
Verificar programáticamente que `fixtures/demo-run.json` cumple todos los requisitos
del hackathon antes de que el fixture llegue a la demo.

**Expected outcomes**
- `server/tests/fixture.test.ts` pasa con `npm test` en `/server`.
- Cualquier evento mal formado rompe el test antes del demo.

**Todo**
1. Crear `server/tests/fixture.test.ts`.
2. Cargar `fixtures/demo-run.json` con `fs.readFileSync`.
3. Tests a escribir:
   ```
   ✓ fixture is a non-empty array
   ✓ every event has all required BobEvent fields (id, runId, ts, analyzer, phase, type, severity, title, detail)
   ✓ all four AnalyzerIds appear: diff-analyst, deps-scanner, test-runner, doc-writer
   ✓ all five event types appear: progress, question, blocker, risk, complete
   ✓ at least one event has decision != null (question event)
   ✓ all events have replayDelayMs defined
   ✓ cumulative replayDelayMs is between 55_000 ms and 95_000 ms (60–90 s range)
   ✓ every event id is unique
   ✓ all four analyzers have a complete event
   ```

**Relevant context**
- Fixture: [`fixtures/demo-run.json`](../fixtures/demo-run.json)
- Types: [`server/src/types/bob-events.ts`](../server/src/types/bob-events.ts)
- Vitest already configured in `server/vitest.config.ts`

---

## Sub-Task 2 — Replay adapter tests

**Status:** `[ ] pending`

**Intent**
Cubrir el acceptance criterion de Part 2: "Replay adapter pauses on `question` events
and resumes only after `submitAnswer`".
`replayEventAdapter.ts` tiene lógica de timing con `setTimeout` — usar fake timers de Vitest.

**Expected outcomes**
- `server/tests/replayAdapter.test.ts` pasa.
- El comportamiento de pausa/reanuda está verificado con fake timers, sin esperar tiempos reales.

**Todo**
1. Crear `server/tests/replayAdapter.test.ts`.
2. Usar `vi.useFakeTimers()` / `vi.advanceTimersByTime()` de Vitest.
3. Tests a escribir:
   ```
   ✓ start() transitions state from idle to running
   ✓ events are emitted in order after their replayDelayMs
   ✓ adapter pauses automatically when a question event with decision is emitted
   ✓ getState() returns "paused" while waiting for answer
   ✓ submitAnswer() with correct eventId resumes emission
   ✓ submitAnswer() with wrong eventId does nothing
   ✓ reset() returns adapter to idle and clears pending decision
   ✓ all events are emitted by end of run
   ✓ speedMultiplier: 0.1 reduces effective delays by 10x
   ```

**Relevant context**
- [`server/src/adapters/replayEventAdapter.ts`](../server/src/adapters/replayEventAdapter.ts)
- Vitest fake timers docs: https://vitest.dev/guide/mocking.html#timers

---

## Sub-Task 3 — HTTP API tests

**Status:** `[ ] pending`

**Intent**
Testear los 5 endpoints del servidor Express de forma black-box usando `supertest`.
No se testea lógica interna — sólo el contrato HTTP.

**Expected outcomes**
- `server/tests/api.test.ts` pasa.
- Cada endpoint retorna el status code y shape correctos.
- `npm install --save-dev supertest @types/supertest` añadido al `server/package.json`.

**Todo**
1. Instalar dependencias: `cd server && npm install --save-dev supertest @types/supertest`.
2. Crear `server/tests/api.test.ts`.
3. Exportar `app` de `server/src/index.ts` sin llamar a `.listen()` en tests
   (separar la creación del app del bootstrap del servidor).
4. Tests a escribir:
   ```
   ✓ GET /api/health → 200 { ok: true, ts: string }
   ✓ POST /api/runs { mode: "replay" } → 200 { id: string }
   ✓ POST /api/runs missing body → still returns { id } (defaults to replay)
   ✓ GET /api/runs/:id/report antes de completar → 200 con runStatus != "completed"
   ✓ GET /api/runs/nonexistent/report → 404
   ✓ POST /api/runs/:id/decisions sin eventId → 400
   ✓ POST /api/runs/:id/decisions sin answer → 400
   ✓ POST /api/runs/nonexistent/decisions → 404
   ✓ GET /api/runs/nonexistent/stream → 404
   ```

**Relevant context**
- [`server/src/index.ts`](../server/src/index.ts) — necesita refactor mínimo para exportar `app`
- supertest: https://github.com/ladjs/supertest

**Note — refactor mínimo de index.ts**
Para que supertest pueda importar `app` sin arrancar el servidor, separar:
```ts
export { app };                     // exportar el app Express
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => { ... });
}
```

---

## Sub-Task 4 — Setup Vitest + React Testing Library en `web/`

**Status:** `[ ] pending`

**Intent**
El frontend no tiene ningún test todavía. Esta sub-tarea instala y configura
el entorno de tests para las sub-tareas 5–9.

**Expected outcomes**
- `npm test` en `/web` ejecuta los tests y sale 0.
- `web/vitest.config.ts` configurado con `jsdom` environment.
- `web/src/test-setup.ts` con `@testing-library/jest-dom` matchers.

**Todo**
1. Instalar dependencias:
   ```
   cd web && npm install --save-dev \
     vitest \
     @vitest/coverage-v8 \
     jsdom \
     @testing-library/react \
     @testing-library/user-event \
     @testing-library/jest-dom \
     vitest-axe \
     @vitest/ui
   ```
2. Crear `web/vitest.config.ts`:
   ```ts
   import { defineConfig } from "vitest/config";
   import react from "@vitejs/plugin-react";

   export default defineConfig({
     plugins: [react()],
     test: {
       globals: true,
       environment: "jsdom",
       setupFiles: ["./src/test-setup.ts"],
     },
   });
   ```
3. Crear `web/src/test-setup.ts`:
   ```ts
   import "@testing-library/jest-dom";
   ```
4. Añadir scripts a `web/package.json`:
   ```json
   "test": "vitest run",
   "test:watch": "vitest",
   "test:ui": "vitest --ui"
   ```
5. Verificar que `npm test` en `/web` no da errores de configuración.

**Relevant context**
- `web/vite.config.ts` — referencia para la configuración de Vite
- `web/tsconfig.json` — asegurarse que incluye `src/**/*` y `src/test-setup.ts`

---

## Sub-Task 5 — Tests del reducer frontend (`runReducer`)

**Status:** `[ ] pending`

**Intent**
El `runReducer` en `RunContext.tsx` es un mirror del `attentionReducer` del servidor.
Testearlo independientemente garantiza que ambos se comportan igual.

**Expected outcomes**
- `web/src/__tests__/runReducer.test.ts` pasa.
- Cubre los mismos casos que `server/tests/attention.test.ts` para la lógica de routing.

**Todo**
1. Crear `web/src/__tests__/runReducer.test.ts`.
2. Extraer `runReducer` y `classifyEvent` de `RunContext.tsx` a funciones importables
   (o testearlas a través del módulo directamente con `vi.importActual`).
3. Tests a escribir:
   ```
   ✓ START_RUN transitions status to "running"
   ✓ progress event goes to hiddenEvents
   ✓ question with decision → pendingDecision set, status "waiting-for-decision"
   ✓ blocker event → surfacedEvents, analyzer phase = "blocked"
   ✓ critical severity → criticalRisks
   ✓ complete event → completedAnalyzers, progress = 100
   ✓ all 4 analyzers complete → status "completed"
   ✓ SUBMIT_ANSWER clears pendingDecision, status back to "running"
   ✓ SUBMIT_ANSWER with wrong eventId is ignored
   ✓ RESET returns to idle
   ✓ suppressionRatio calculated correctly
   ```

**Relevant context**
- [`web/src/context/RunContext.tsx`](../web/src/context/RunContext.tsx) — `runReducer` y `classifyEvent` están inline
- [`server/tests/attention.test.ts`](../server/tests/attention.test.ts) — referencia de los mismos casos

---

## Sub-Task 6 — Tests de componentes React

**Status:** `[ ] pending`

**Intent**
Testear cada componente del MVP contra sus acceptance criteria de Part 3.
Usar `renderWithRunContext` helper para inyectar `RunState` mock.

**Expected outcomes**
- 4 ficheros de test, uno por componente clave.
- Cada acceptance criterion de Part 3 tiene al menos un test correspondiente.

**Todo**
1. Crear `web/src/__tests__/helpers.tsx` con:
   ```tsx
   // renderWithRunContext: wraps component with a mock RunContext
   // that accepts a partial RunState override
   export function renderWithRunContext(ui, stateOverride?) { ... }
   ```

2. **`web/src/__tests__/AgentGarden.test.tsx`**
   ```
   ✓ renders exactly 4 plant items (one per AnalyzerId)
   ✓ plant labels match: "Change Analysis", "Dependency Scan", "Test Runner", "Doc Writer"
   ✓ suppression counter shows hiddenEvents count
   ✓ all plants have paused class when status = "waiting-for-decision"
   ```

3. **`web/src/__tests__/AgentPlant.test.tsx`**
   ```
   ✓ phase "planned" renders 🌱 and class plant--planned
   ✓ phase "working" renders 🌿 and class plant--working (or no modifier)
   ✓ phase "blocked" renders 🍂 and class plant--blocked
   ✓ phase "done" renders 🌸 and class plant--done
   ✓ paused=true adds class plant--paused
   ✓ progressbar aria-valuenow equals progress prop
   ✓ aria-label contains agent name, phase, and progress %
   ```

4. **`web/src/__tests__/DecisionCard.test.tsx`**
   ```
   ✓ returns null when pendingDecision is null
   ✓ renders question text from pendingDecision.event.decision.question
   ✓ renders all options as buttons
   ✓ selecting an option enables the Confirm button
   ✓ clicking Confirm calls submitAnswer with correct eventId and answer
   ✓ has role="dialog" and aria-modal="true"
   ✓ has aria-labelledby pointing to the question heading
   ```

5. **`web/src/__tests__/CompletionSummary.test.tsx`**
   ```
   ✓ returns null when status != "completed"
   ✓ shows "Generating report…" while fetch is in flight
   ✓ renders analyzerReports — no raw JSON visible
   ✓ renders decisions with question and answer
   ✓ renders reviewRequired items
   ✓ renders all 4 metric values
   ✓ renders "Review report", "View details", "Restart demo" buttons
   ✓ shows error message when fetch fails
   ```

**Relevant context**
- Components in [`web/src/components/`](../web/src/components/)
- [`web/src/context/RunContext.tsx`](../web/src/context/RunContext.tsx) — context shape to mock

---

## Sub-Task 7 — Accessibility tests (vitest-axe)

**Status:** `[ ] pending`

**Intent**
Verificar zero axe violations en las vistas principales, cumpliendo el acceptance
criterion: "Primary garden view has no axe accessibility violations".

**Expected outcomes**
- `web/src/__tests__/a11y.test.tsx` pasa con zero violations.
- Cubre: idle screen, working view (garden + breathing), decision overlay, completion screen.

**Todo**
1. Crear `web/src/__tests__/a11y.test.tsx`.
2. Usar `vitest-axe` (`axe` + `toHaveNoViolations` matcher).
3. Tests a escribir:
   ```
   ✓ idle screen has no axe violations
   ✓ garden view (4 plants, working state) has no axe violations
   ✓ garden view with decision card overlay has no axe violations
   ✓ garden view with risk alert has no axe violations
   ✓ completion summary with full ReleaseReport has no axe violations
   ```
4. Para cada test: `render(component)` → `const results = await axe(container)` →
   `expect(results).toHaveNoViolations()`.

**Relevant context**
- Design brief § 7 (full accessibility checklist)
- vitest-axe: https://github.com/nickmccurdy/vitest-axe
- Carbon accessibility: https://carbondesignsystem.com/guidelines/accessibility/overview/

---

## Sub-Task 8 — Integration tests (full demo flow)

**Status:** `[ ] pending`

**Intent**
Testear el flujo completo de la demo de extremo a extremo: servidor real + fixture real,
sin el navegador. Valida todos los acceptance criteria de integración listados en
`development-work-split.md`.

**Expected outcomes**
- `tests/integration/demo.test.ts` pasa con `npm test` desde la raíz.
- El flujo completo (POST → SSE → decision → blocker → complete × 4 → report) está verificado.
- Corren en < 30 s usando `speedMultiplier: 0.05`.

**Todo**
1. Crear `tests/integration/` en la raíz del repo.
2. Crear `tests/integration/package.json` (o usar workspace root).
3. Crear `tests/integration/demo.test.ts` usando supertest + EventSource mock.
4. Tests a escribir:
   ```
   ✓ POST /api/health → { ok: true }
   ✓ POST /api/runs → { id: string (UUID format) }
   ✓ GET /api/runs/:id/stream emits BobEvent JSON lines
   ✓ first event has type="progress"
   ✓ stream contains a question event with decision != null
   ✓ after question event, stream pauses (no more events for 500 ms)
   ✓ POST /api/runs/:id/decisions with correct answer resumes the stream
   ✓ stream contains a blocker event
   ✓ all 4 AnalyzerIds appear in streamed events
   ✓ all 5 event types appear in streamed events
   ✓ GET /api/runs/:id/report after stream ends → runStatus = "completed"
   ✓ report.analyzerReports has 4 entries (one per AnalyzerId)
   ✓ report.decisions has the submitted answer
   ✓ report.blockers is non-empty
   ✓ report.metrics.suppressionRatio > 0 (routine events were hidden)
   ✓ report.metrics.tasksCompleted = 4
   ```
5. Añadir script en `package.json` raíz o `tests/integration/package.json`:
   ```json
   "test:integration": "vitest run --config tests/integration/vitest.config.ts"
   ```

**Relevant context**
- [`server/src/index.ts`](../server/src/index.ts) — necesita exportar `app` (ver Sub-Task 3)
- [`fixtures/demo-run.json`](../fixtures/demo-run.json) — fixture real usada en tests
- Usar `speedMultiplier: 0.05` en la instancia de test para que el replay dure ~4 s

---

## Sub-Task 9 — Scripts de CI y documentación de ejecución

**Status:** `[ ] pending`

**Intent**
Definir los comandos exactos para ejecutar los tests por parte (en ramas separadas)
y todos juntos (tras el merge final). Documentarlos en un README de tests.

**Expected outcomes**
- `docs/test-strategy.md` creado con los comandos exactos.
- Un fichero `.github/workflows/test.yml` opcional para CI.

**Todo**
1. Crear `docs/test-strategy.md` con:

   **Por parte (en ramas separadas):**
   ```bash
   # Part 2 (en feature/attention-manager)
   cd server && npm test
   # Cubre: classifyEvent, attentionReducer, createSummary,
   #         replayAdapter, fixture validation, HTTP API

   # Part 3 (en feature/visual-experience)
   cd web && npm test
   # Cubre: runReducer, AgentGarden, AgentPlant, DecisionCard,
   #         CompletionSummary, a11y (axe)
   ```

   **Tras el merge a main:**
   ```bash
   # Todos los tests en secuencia
   cd server && npm test
   cd web    && npm test
   cd tests/integration && npm test
   # O con workspace: npm run test:all desde raíz
   ```

2. (Opcional) Crear `.github/workflows/test.yml` con jobs paralelos:
   - `test-server`: `cd server && npm ci && npm test`
   - `test-web`: `cd web && npm ci && npm test`
   - `test-integration` (needs: [test-server]): integration tests

**Relevant context**
- Todos los tests anteriores

---

## Orden de implementación recomendado

```
Sub-Task 1  → Fixture validation    (15 min, sin dependencias)
Sub-Task 2  → Replay adapter tests  (20 min, fake timers)
Sub-Task 3  → HTTP API tests        (30 min, necesita refactor mínimo de index.ts)
Sub-Task 4  → Setup web tests       (20 min, prerequisito para 5-7)
Sub-Task 5  → runReducer tests      (20 min, pura lógica)
Sub-Task 6  → Component tests       (45 min, el bloque más grande)
Sub-Task 7  → Axe a11y tests        (20 min)
Sub-Task 8  → Integration tests     (30 min, end-to-end)
Sub-Task 9  → Documentación CI      (10 min)
```

---

## Acceptance criteria del plan completo

- [ ] `cd server && npm test` cubre las 9 sub-areas de Part 2 y pasa.
- [ ] `cd web && npm test` cubre los 8 acceptance criteria de Part 3 y pasa.
- [ ] `tests/integration` cubre los 15 criterios de integración y pasa.
- [ ] Fixture validation confirma los 5 event types y 4 analyzer IDs.
- [ ] Zero axe violations en todas las vistas del MVP.
- [ ] Ningún test depende de red real, ficheros del SO fuera del repo, ni orden de ejecución externo.
- [ ] Los tests de integración corren en < 30 s usando `speedMultiplier: 0.05`.
- [ ] El plan de merge es: Part 2 tests green → Part 3 tests green → integration green → merge a main.
