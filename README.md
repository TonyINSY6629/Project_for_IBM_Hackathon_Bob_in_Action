# Bob Break

**A developer attention management system for agentic AI.**
While Bob works, you breathe.

Submission for the **IBM TechXchange 2026 Pre-conference Dev Day Hackathon** ΓÇö theme: *Build with purpose using IBM Bob 2.0*.

---

## Table of contents

1. [The problem](#the-problem)
2. [The solution](#the-solution)
3. [Project scope](#project-scope)
4. [User journey](#user-journey)
5. [Architecture](#architecture)
6. [Event classification](#event-classification)
7. [The workload: Release Readiness Assistant](#the-workload-release-readiness-assistant)
8. [Event contract](#event-contract)
9. [API surface](#api-surface)
10. [Live mode and replay mode](#live-mode-and-replay-mode)
11. [Tech stack](#tech-stack)
12. [Measuring the impact](#measuring-the-impact)
13. [Repository layout](#repository-layout)
14. [Running locally](#running-locally)
15. [How IBM Bob 2.0 was used](#how-ibm-bob-20-was-used)
16. [Submission deliverables](#submission-deliverables)
17. [Team](#team)

---

## The problem

The bottleneck in AI-assisted development is no longer how fast an agent can generate code. It is how much information a human developer can process without becoming overwhelmed.

When IBM Bob runs a multi-step task across several subagents, it produces a continuous stream of plans, updates, questions, diffs, and test results. The developer feels compelled to watch all of it:

- Is Bob still working?
- Is one of the agents blocked?
- Did an important error appear?
- Can I safely look away?

The result is visual fatigue, cognitive overload, repeated checking, unnecessary context switching, and interruptions to processes that were progressing correctly. **AI saves development time, but that saved time becomes anxious waiting.**

```mermaid
mindmap
  root((Developer<br/>pain points))
    Visual fatigue
      Reading continuous code output
      Dense terminal logs
      Multiple parallel agent streams
    Cognitive overload
      Following several agents simultaneously
      Deciding what needs attention
      Missed critical decisions
    Attention fragmentation
      Repeated unnecessary checking
      Context switches to social media
      Interrupting still-progressing tasks
    Poor return-to-work
      Wall of generated text
      No structured final summary
      Unclear what needs human review
```

---

## The solution

Bob Break is an attention-management layer for agentic development workflows. It observes a real release-readiness pipeline, classifies every event by whether a human actually needs it, and renders the run as a calm visual state instead of a log stream.

The developer is interrupted only when human input provides real value:

| Event class | What the developer sees |
| --- | --- |
| Background progress | Silent aggregation ΓÇö a plant grows in the garden |
| Decision required | The garden pauses; one short, structured question |
| Blocked task | A calm notice naming exactly what is stuck |
| Critical risk | An immediate alert |

Everything else is held for the **release report** ΓÇö the structured summary that brings the developer back to the code with a clear picture of what changed, what passed, what remains risky, and what needs review.

> Bob reduces the workload. Bob Break reduces the cognitive load.

---

## Project scope

The diagram below shows every component in scope for this prototype, and how it connects to a future full IBM Bob integration.

```mermaid
graph TD
    subgraph Prototype["≡ƒƒó In scope ΓÇö this prototype"]
        direction TB
        A1[diff-analyst]
        A2[deps-scanner]
        A3[test-runner]
        A4[doc-writer]
        EA[Event Adapter]
        AM[Attention Manager]
        RB[Report Builder]
        G[Garden view]
        DC[Decision card]
        AL[Alert]
        R[Release report]
    end

    subgraph Future["≡ƒö╡ Future integration ΓÇö adapter swap only"]
        BOB[IBM Bob 2.0\nlive subagent events]
        WX[watsonx Orchestrate\nbusiness workflow layer]
    end

    A1 & A2 & A3 & A4 -->|events| EA
    BOB -.->|future adapter| EA
    WX -.->|future orchestration| EA
    EA --> AM
    AM -->|progress| G
    AM -->|question| DC
    AM -->|blocker / critical| AL
    AM --> RB
    RB --> R
    DC -->|answer| AM
```

**Scope boundaries:**
- The prototype runs four local analyzers that emit the shared event format.
- The Attention Manager, Report Builder, and all visual components are fully functional.
- IBM Bob built everything in scope; no future integration is claimed as current functionality.

---

## User journey

```mermaid
sequenceDiagram
    actor Dev as Developer
    participant BB as Bob Break
    participant AM as Attention Manager
    participant An as Analyzers (├ù4)
    participant R  as Release Report

    Dev->>BB: Start run (live or replay)
    BB->>An: Spawn 4 parallel analyzers
    Note over BB: Garden activates ΓÇö plants begin growing

    loop Each analyzer event
        An-->>AM: Emit event {type, severity, phase}
        AM-->>AM: Classify event
        alt progress / info
            AM-->>BB: Silent ΓÇö plant grows
        else decision required
            AM-->>Dev: Decision card (one structured question)
            Dev-->>AM: Answer
        else blocker
            AM-->>Dev: Calm blocker notice
        else critical risk
            AM-->>Dev: Immediate alert
        end
    end

    An-->>AM: All analyzers complete
    AM->>R: Build release report
    BB-->>Dev: Gentle transition back to workspace
    Dev->>R: Review structured summary
```

---

## Architecture

```mermaid
flowchart LR
  subgraph Analyzers["Local analyzers ΓÇö parallel"]
    A1[diff-analyst]
    A2[deps-scanner]
    A3[test-runner]
    A4[doc-writer]
  end

  BOB[/"IBM Bob event stream\n(future integration)"/]

  subgraph Server["Backend"]
    EA[Event Adapter]
    AM[Attention Manager]
    RB[Report Builder]
  end

  subgraph Web["Frontend"]
    G[Garden]
    D[Decision card]
    AL[Alert]
    R[Release report]
  end

  A1 & A2 & A3 & A4 --> EA
  BOB -.-> EA
  EA -->|SSE| AM
  AM -->|progress| G
  AM -->|decision| D
  AM -->|blocker / critical| AL
  AM --> RB
  RB --> R
  D -->|answer| AM
```

Two things this diagram is saying deliberately:

- The **Event Adapter** is the only component that knows where events come from. A future Bob event integration would replace the adapter's input without changing the Attention Manager, the report builder, or the visual interface. That is why the seam exists.
- The **Attention Manager** is a pure function from event to route. It is the core of the system and the part that is unit tested.

IBM Bob 2.0 planned, built, tested, and documented every box in this diagram. See [How IBM Bob 2.0 was used](#how-ibm-bob-20-was-used).

---

## Event classification

The Attention Manager routes every incoming event through a single decision tree. This keeps the classifier stateless and unit-testable.

```mermaid
flowchart TD
    IN([Incoming event]) --> T{type?}

    T -->|progress / complete| S{severity?}
    S -->|info| SIL[Silent ΓÇö aggregate to garden]
    S -->|warn| SIL
    S -->|critical| CRIT[≡ƒö┤ Immediate alert]

    T -->|question| DEC[≡ƒƒí Decision card\npause garden]
    T -->|blocker| BLK[≡ƒƒá Blocker notice]
    T -->|risk| RK{severity?}
    RK -->|warn| BLK
    RK -->|critical| CRIT

    SIL --> STORE[(Run log)]
    DEC --> WAIT[Await developer answer]
    WAIT --> STORE
    BLK --> STORE
    CRIT --> STORE

    STORE --> REPORT[Release report]
```

### Visual states

| Garden state | What it means |
| --- | --- |
| ≡ƒî▒ Seedling | Analyzer planned, not yet started |
| ≡ƒî┐ Growing | Analyzer working ΓÇö progress events arriving |
| ΓÅ╕∩╕Å Paused | Waiting for a developer decision |
| ≡ƒìé Wilting | Analyzer blocked |
| ≡ƒî╕ Flowering | Analyzer completed successfully |
| Γ£¿ Fireflies | All analyzers done ΓÇö transitioning to report |

---

## The workload: Release Readiness Assistant

Bob Break is not a wellness widget sitting next to an agent ΓÇö it visualizes real work. The work in this prototype is **release readiness**, one of the most manual and error-prone gates in the SDLC.

At runtime the prototype executes **four local analyzers in parallel** against a target repository. Each one emits events as it goes and contributes a section to the report.

```mermaid
flowchart TB
    REPO[(Target\nrepository)]

    subgraph Parallel["Four analyzers ΓÇö parallel execution"]
        direction LR
        A1["≡ƒöì diff-analyst\ngit diff, git log"]
        A2["≡ƒôª deps-scanner\npackage.json, lockfile"]
        A3["≡ƒº¬ test-runner\ntest output"]
        A4["≡ƒô¥ doc-writer\nREADME, CHANGELOG"]
    end

    REPO --> A1 & A2 & A3 & A4

    subgraph Report["Release readiness report"]
        R1[Change surface\nCategorized commits]
        R2[Version drift\nBreaking-change flags]
        R3[Pass / fail counts\nFailing suites]
        R4[Draft CHANGELOG\nStale-doc warnings]
    end

    A1 --> R1
    A2 --> R2
    A3 --> R3
    A4 --> R4
```

Bob Break's final summary and the Release Readiness report are the same artifact. One pipeline produces it.

---

## Event contract

Every component on both sides of the seam keys off this one shape.

```json
{
  "id": "evt_0042",
  "runId": "run_01",
  "ts": "2026-08-30T02:14:08.331Z",
  "analyzer": "deps-scanner",
  "phase": "analyzing",
  "type": "progress",
  "severity": "info",
  "title": "3 minor version bumps detected",
  "detail": "ΓÇªfull technical text, never shown unpromptedΓÇª",
  "decision": null
}
```

| Field | Values |
| --- | --- |
| `analyzer` | which local analyzer emitted the event |
| `phase` | `planned` ┬╖ `working` ┬╖ `waiting` ┬╖ `blocked` ┬╖ `done` |
| `type` | `progress` ┬╖ `question` ┬╖ `blocker` ┬╖ `risk` ┬╖ `complete` |
| `severity` | `info` ┬╖ `warn` ┬╖ `critical` |
| `decision` | `null`, or `{ question, options[] }` when developer input is required |

The format is deliberately source-agnostic. Any producer that can emit this shape ΓÇö a local analyzer today, an agent event stream later ΓÇö works without changes downstream.

---

## API surface

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/runs` | `POST` | Start a run ΓÇö `{ mode: "live" \| "replay" }` |
| `/api/runs/:id/stream` | `GET` | Server-sent event stream |
| `/api/runs/:id/decisions` | `POST` | Submit an answer to a decision card |
| `/api/runs/:id/report` | `GET` | The release readiness report |
| `/api/health` | `GET` | Liveness |

---

## Live mode and replay mode

The prototype runs in two modes, and the difference is stated plainly because it matters:

- **`live`** ΓÇö the four analyzers execute against a real target repository and emit real events as they run.
- **`replay`** ΓÇö the backend replays a recorded run of those same analyzers. Deterministic, used for the demo video so a recording never depends on a live run succeeding.

```mermaid
flowchart LR
    subgraph Live["Live mode"]
        LR[(Real repo)] --> LA[Analyzers\nexecute]
        LA --> LE[Real events]
    end

    subgraph Replay["Replay mode"]
        FF[/fixtures/\nrecorded run/] --> RE[Events\nreplayed]
    end

    LE & RE --> EA[Event Adapter]
    EA --> AM[Attention Manager]
    AM --> UI[Visual interface\nand report]
```

Both modes exercise the identical Event Adapter, Attention Manager, and interface. Replay changes where the events come from, nothing else.

**What this prototype does not do:** it does not attach to a running IBM Bob IDE process or receive live subagent events. No such hook is claimed. Bob's role in this project is described below, and a future Bob event integration is an adapter swap rather than a redesign.

---

## Tech stack

```mermaid
graph LR
    subgraph FE["Frontend"]
        R18[React 18]
        TS[TypeScript]
        VT[Vite]
        FM[Framer Motion]
        CSS[Custom CSS]
    end

    subgraph BE["Backend"]
        Node[Node.js]
        TSB[TypeScript]
        EX[Express]
        SSE[Server-Sent Events]
        CP[Child processes\nfor analyzers]
    end

    subgraph State["State"]
        RC[React Context\n+ reducer]
        RL[JSON run log\non disk]
    end

    subgraph Test["Testing"]
        VIT[Vitest]
        ATM[Attention Manager\nunit tests]
    end

    subgraph Infra["Infrastructure"]
        GH[GitHub]
        VE[Vercel / Netlify\ndeployment]
        IBM[IBM Bob 2.0\nagentic development]
    end

    FE <-->|SSE / REST| BE
    BE --> State
    FE --> State
    Test --> BE
```

| Layer | Technology | Reason |
| --- | --- | --- |
| Frontend | React 18 + TypeScript + Vite | Fast, visual, easy to divide across team members |
| Styling | Custom CSS with variables | Greater control with less configuration |
| Animations | Framer Motion | Garden growth, breathing animations, transitions |
| State | React Context + reducer | Sufficient for an MVP ΓÇö no external store needed |
| Events | JSON + Event Adapter | Supports both real and simulated events |
| Testing | Vitest + Testing Library | Simple integration with Vite |
| End-to-end | Playwright (time permitting) | Demonstrates the complete workflow |
| Repository | GitHub | Collaboration and project submission |
| Deployment | Vercel, Netlify, or GitHub Pages | Fast and simple deployment |
| Agentic development | IBM Bob 2.0 | Planning, subagents, code generation, testing, documentation |

---

## Measuring the impact

The prototype instruments itself rather than asserting productivity gains:

- events emitted by the pipeline
- events surfaced to the developer
- interruptions requiring human input
- time from run start to a reviewable report

The headline number is the ratio: **how many events the run produced versus how few reached the developer.**

```mermaid
xychart-beta
    title "Target: events produced vs events surfaced to developer"
    x-axis ["diff-analyst", "deps-scanner", "test-runner", "doc-writer"]
    y-axis "Events" 0 --> 40
    bar [32, 28, 38, 22]
    line [3, 2, 4, 2]
```

> *Bar = total events produced by each analyzer. Line = events surfaced to the developer. Figures are design targets, not measured results.*

### Traditional workflow vs Bob Break targets

| Metric | Traditional agent workflow | Bob Break target |
| --- | --- | --- |
| Progress checks | Frequent | Only when necessary |
| Context switches | 4ΓÇô6 | 0ΓÇô1 |
| Intermediate output reviewed | Almost everything | Only actionable information |
| Continuous technical-text exposure | High | Significantly reduced |
| Intentional visual recovery | None | 30ΓÇô90 seconds |
| Visibility across parallel agents | Fragmented | Unified |
| Final review | Unstructured output | Progressive summary |

> Figures in the concept document comparing traditional agent workflows to Bob Break are design targets, not measured results.

---

## Repository layout

```
/server        backend ΓÇö analyzers, event adapter, attention manager, report builder
/web           frontend ΓÇö garden, decision cards, alerts, report view
/fixtures      recorded analyzer run used by replay mode
/evidence      IBM Bob task session summary screenshots
/docs          problem & solution statements, Bob usage statement
```

---

## Running locally

```bash
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and the backend on `http://localhost:3000`.

To run against your own repository in live mode, set the target before starting the server:

```bash
TARGET_REPO=/path/to/repo npm run dev
```

Without `TARGET_REPO`, the server starts in replay mode using the recorded run in `/fixtures`.

---

## How IBM Bob 2.0 was used

IBM Bob Agent mode and subagents were used to plan, build, test, and document the release-readiness workflow. At runtime, the prototype executes four local analyzers in parallel and translates their activity into a shared event format. Replay mode provides a deterministic demonstration of the same workflow. A future Bob event integration would replace the current adapter without changing the Attention Manager or visual interface.

```mermaid
flowchart TD
    subgraph BobCapabilities["IBM Bob 2.0 ΓÇö capabilities used"]
        AGT[Agent Mode\nplan + implement architecture]
        SUB[Subagents\nisolated build contexts]
        PAR[Parallel tasks\nconcurrent multi-step sequences]
        DOC[Document understanding\nread specs, conventions, docs]
        RUL[Custom rules\nconsistent commit + doc style]
    end

    AGT --> ARCH[Architecture\nand analyzers]
    SUB --> ISO[Backend ┬╖ Interface ┬╖ Tests\nno context pollution]
    PAR --> CON[Concurrent build\nand test runs]
    DOC --> CON2[Work follows real\nproject constraints]
    RUL --> CON3[Consistent output\nacross all generated work]
```

Specifically:

- **Agent mode** ΓÇö planned the architecture and implemented the analyzers, the event pipeline, and the frontend components
- **Subagents** ΓÇö isolated each build task in a self-contained context so work on the backend, the interface, and the tests did not pollute one another
- **Parallel tasks** ΓÇö ran multi-step build and test sequences concurrently across the codebase
- **Document understanding** ΓÇö read the project's own specifications, conventions, and existing documentation so generated work followed the real constraints instead of treating each request as an isolated coding task
- **Custom rules** ΓÇö enforced consistent commit categorization and documentation style across everything Bob generated

> **TODO before submission:** replace this list with the specific tasks Bob performed, and confirm the exported task session summary screenshots are committed under `/evidence`.

---

## Submission deliverables

- [ ] Video demonstration, including how IBM Bob was used
- [ ] Written problem and solution statements ΓÇö `/docs`
- [ ] Written statement on how IBM Bob was utilized ΓÇö `/docs`
- [ ] Working code repository with exported Bob task session summary screenshots ΓÇö `/evidence`

---

## Team

| Role | Owner |
| --- | --- |
| Backend ΓÇö analyzers, event stream, attention manager | *TBD* |
| Frontend ΓÇö garden, decision cards, report view | *TBD* |
| Evidence, written statements, video | *TBD* |

---

Built with IBM Bob 2.0 for the IBM TechXchange 2026 Pre-conference Dev Day Hackathon.
