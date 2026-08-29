# Demo Events — Arc Notes

This file explains the structure and intent of `demo-events.json` for teammates
working on Parts 2 (Attention Manager) and 3 (Visual Experience).

---

## Event contract

Every event uses the shape from the README:

```ts
{
  id:       string            // "evt_001", "evt_002", …
  runId:    string            // "run_demo_01" throughout
  ts:       string            // ISO 8601, base time 2026-08-30T02:14:00.000Z
  analyzer: AnalyzerId        // "diff-analyst" | "deps-scanner" | "test-runner" | "doc-writer"
  phase:    EventPhase        // "planned" | "working" | "waiting" | "blocked" | "done"
  type:     EventType         // "progress" | "question" | "blocker" | "risk" | "complete"
  severity: Severity          // "info" | "warn" | "critical"
  title:    string            // short label — shown in the UI
  detail:   string            // full technical text — never shown unprompted
  decision: null | { question: string; options: string[] }
}
```

---

## 75-second arc (32 events)

| Time (s) | Events | What happens |
| --- | --- | --- |
| t = 0–1 | evt_001–004 | All 4 analyzers emit `planned` / `progress` / `info` — garden plants appear |
| t = 5–14 | evt_005–008 | All 4 move to `working` — plants begin growing |
| t = 12–20 | evt_009–013 | Progress across all lanes — continued growth |
| t = 22 | evt_014 | **`deps-scanner` raises a `question`** — garden pauses, decision card appears |
| t = 25 | evt_015 | **`test-runner` hits a `blocker`** — plant wilts, blocker notice shown |
| t = 32 | evt_017 | **`diff-analyst` emits a `risk` / `warn`** — non-critical risk notice |
| t = 35 | evt_018 | Decision answered — deps-scanner resumes |
| t = 38 | evt_019 | Blocker resolved — test-runner resumes |
| t = 50 | evt_023 | `deps-scanner` completes — first plant flowers |
| t = 53 | evt_024 | `diff-analyst` completes — second plant flowers |
| t = 68–70 | evt_030–031 | `doc-writer` and `test-runner` complete — third and fourth plants flower |
| t = 75 | evt_032 | Final summary event — fireflies, transition to report |

---

## Key events for Parts 2 and 3

### Decision card (evt_014)
- `type: "question"`, `phase: "waiting"`, `severity: "warn"`
- `decision.question`: "How should @testing-library/jest-dom be handled?"
- `decision.options`: 3 choices
- **Expected behaviour:** Attention Manager routes to decision card. Garden pauses. Developer answers. `deps-scanner` resumes (evt_018).

### Blocker notice (evt_015)
- `type: "blocker"`, `phase: "blocked"`, `severity: "warn"`
- **Expected behaviour:** Attention Manager routes to blocker alert. `test-runner` plant wilts. Resolved by evt_019.

### Risk notice (evt_017)
- `type: "risk"`, `phase: "working"`, `severity: "warn"`
- **Expected behaviour:** Attention Manager routes to non-critical alert. Plant does not wilt — task continues.

### All four `complete` events (evt_023, evt_024, evt_030, evt_031)
- `type: "complete"`, `phase: "done"`, `severity: "info"`
- **Expected behaviour:** each triggers a plant flowering animation. evt_032 triggers the full completion transition.

---

## What to update after the real Bob run (Sub-task 4)

Once the actual Bob session is run, refine `demo-events.json` to:
- Match real timestamps and durations if different
- Replace placeholder `detail` text with Bob's actual output snippets
- Adjust event count if Bob produced more or fewer steps
- Keep the arc structure (planned → working → question → blocker → risk → complete) intact

Do not change the event contract shape — Parts 2 and 3 will already have been built against it.
