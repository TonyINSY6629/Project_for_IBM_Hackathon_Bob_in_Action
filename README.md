# Bob Break

**A developer attention management system for agentic AI.**
While Bob works, you breathe.

Submission for the **IBM TechXchange 2026 Pre-conference Dev Day Hackathon** — theme: *Build with purpose using IBM Bob 2.0*.

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
9. [How a run starts](#how-a-run-starts)
10. [Tech stack](#tech-stack)
11. [Measuring the impact](#measuring-the-impact)
12. [Repository layout](#repository-layout)
13. [Running locally](#running-locally)
14. [How IBM Bob 2.0 was used](#how-ibm-bob-20-was-used)
15. [Submission deliverables](#submission-deliverables)
16. [Team](#team)
17. [Other Resources Used]

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
| Background progress | Silent aggregation — a plant grows in the garden |
| Decision required | The garden pauses; one short, structured question |
| Blocked task | A calm notice naming exactly what is stuck |
| Critical risk | An immediate alert |

Everything else is held for the **release report** — the structured summary that brings the developer back to the code with a clear picture of what changed, what passed, what remains risky, and what needs review.

> Bob reduces the workload. Bob Break reduces the cognitive load.

---

## Project scope

The diagram below shows every component in scope for this prototype, and how it connects to a future full IBM Bob integration.

```mermaid
graph TD
    subgraph Prototype["🟢 In scope — this prototype"]
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

    subgraph Future["🔵 Future integration — adapter swap only"]
        BOB["IBM Bob 2.0<br/>live subagent events"]
        WX["watsonx Orchestrate<br/>business workflow layer"]
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
    participant An as Analyzers (×4)
    participant R  as Release Report

    Dev->>BB: Choose a project folder
    BB->>An: Spawn 4 parallel analyzers
    Note over BB: Garden activates — plants begin growing

    loop Each analyzer event
        An-->>AM: Emit event {type, severity, phase}
        AM-->>AM: Classify event
        alt progress / info
            AM-->>BB: Silent — plant grows
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
  subgraph Analyzers["Local analyzers — parallel"]
    A1[diff-analyst]
    A2[deps-scanner]
    A3[test-runner]
    A4[doc-writer]
  end

  BOB[/"IBM Bob event stream<br/>(future integration)"/]

  subgraph App["Browser app"]
    EA[Event Adapter]
    AM[Attention Manager]
    RB[Report Builder]
    G[Garden]
    D[Decision card]
    AL[Alert]
    R[Release report]
  end

  A1 & A2 & A3 & A4 --> EA
  BOB -.-> EA
  EA --> AM
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
    S -->|info| SIL[Silent — aggregate to garden]
    S -->|warn| SIL
    S -->|critical| CRIT[🔴 Immediate alert]

    T -->|question| DEC["🟡 Decision card<br/>pause garden"]
    T -->|blocker| BLK["🟠 Blocker notice"]
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
| 🌱 Seedling | Analyzer planned, not yet started |
| 🌿 Growing | Analyzer working — progress events arriving |
| ⏸️ Paused | Waiting for a developer decision |
| 🍂 Wilting | Analyzer blocked |
| 🌸 Flowering | Analyzer completed successfully |
| ✨ Fireflies | All analyzers done — transitioning to report |

---

## The workload: Release Readiness Assistant

Bob Break is not a wellness widget sitting next to an agent — it visualizes real work. The work in this prototype is **release readiness**, one of the most manual and error-prone gates in the SDLC.

At runtime the prototype executes **four local analyzers in parallel** against a target repository. Each one emits events as it goes and contributes a section to the report.

```mermaid
flowchart TB
    REPO[("Target<br/>repository")]

    subgraph Parallel["Four analyzers — parallel execution"]
        direction LR
        A1["🔍 diff-analyst<br/>git diff, git log"]
        A2["📦 deps-scanner<br/>package.json, lockfile"]
        A3["🧪 test-runner<br/>test output"]
        A4["📝 doc-writer<br/>README, CHANGELOG"]
    end

    REPO --> A1 & A2 & A3 & A4

    subgraph Report["Release readiness report"]
        R1["Change surface<br/>Categorized commits"]
        R2["Version drift<br/>Breaking-change flags"]
        R3["Pass / fail counts<br/>Failing suites"]
        R4["Draft CHANGELOG<br/>Stale-doc warnings"]
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
  "detail": "…full technical text, never shown unprompted…",
  "decision": null
}
```

| Field | Values |
| --- | --- |
| `analyzer` | which local analyzer emitted the event |
| `phase` | `planned` · `working` · `waiting` · `blocked` · `done` |
| `type` | `progress` · `question` · `blocker` · `risk` · `complete` |
| `severity` | `info` · `warn` · `critical` |
| `decision` | `null`, or `{ question, options[] }` when developer input is required |

The format is deliberately source-agnostic. Any producer that can emit this shape — a local analyzer today, an agent event stream later — works without changes downstream.

---

## How a run starts

The developer points Bob Break at a project folder. The four analyzers then execute against that folder and emit real events as they run.

```mermaid
flowchart LR
    PICK[("Folder chosen by<br/>the developer")] --> SCAN["Directory walked,<br/>text files read"]
    SCAN --> AN["Analyzers<br/>execute"]
    AN --> EV["Real events"]
    EV --> EA["Event Adapter"]
    EA --> AM["Attention Manager"]
    AM --> UI["Visual interface<br/>and report"]
```

Everything runs in the browser through the File System Access API. Nothing is uploaded — files are read locally, and a run is reproducible by pointing the app at the same folder again.

**What this prototype does not do:** it does not attach to a running IBM Bob IDE process or receive live subagent events. No such hook is claimed. Bob's role in this project is described below, and a future Bob event integration is an adapter swap rather than a redesign.

---

## Tech stack

```mermaid
graph LR
    subgraph FE["Frontend"]
        R18[React 18]
        TS[TypeScript]
        VT[Vite]
        CSS[Custom CSS]
    end

    subgraph AZ["Analysis — in the browser"]
        FSA["File System<br/>Access API"]
        ANZ["Four analyzers"]
        ATM["Attention Manager<br/>(pure function)"]
    end

    subgraph State["State"]
        RC["React hooks<br/>+ run reference"]
    end

    subgraph Test["Testing"]
        VIT[Vitest]
    end

    subgraph Infra["Infrastructure"]
        GH[GitHub]
        VE["Vercel / Netlify<br/>deployment"]
        IBM["IBM Bob 2.0<br/>agentic development"]
    end

    FE --> AZ
    AZ --> State
    FE --> State
    Test --> FE
```

| Layer | Technology | Reason |
| --- | --- | --- |
| Frontend | React 18 + TypeScript + Vite | Fast, visual, easy to divide across team members |
| Styling | Custom CSS with variables | Greater control with less configuration |
| Animations | CSS transitions and keyframes | Garden growth, breathing animations, transitions |
| State | React hooks + a run reference | Sufficient for an MVP — no external store needed |
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

| Analyzer | Events produced | Surfaced to developer | Suppressed |
| --- | ---: | ---: | ---: |
| `diff-analyst` | 32 | 3 | 91% |
| `deps-scanner` | 28 | 2 | 93% |
| `test-runner` | 38 | 4 | 89% |
| `doc-writer` | 22 | 2 | 91% |
| **Total** | **120** | **11** | **91%** |

> Design targets, not measured results. The ratio is the claim: roughly nine of every ten events never need to reach the developer, and the run counter in the interface reports the real figure for each demo.

### Traditional workflow vs Bob Break targets

| Metric | Traditional agent workflow | Bob Break target |
| --- | --- | --- |
| Progress checks | Frequent | Only when necessary |
| Context switches | 4–6 | 0–1 |
| Intermediate output reviewed | Almost everything | Only actionable information |
| Continuous technical-text exposure | High | Significantly reduced |
| Intentional visual recovery | None | 30–90 seconds |
| Visibility across parallel agents | Fragmented | Unified |
| Final review | Unstructured output | Progressive summary |

> Figures in the concept document comparing traditional agent workflows to Bob Break are design targets, not measured results.

---

## Repository layout

```
/src           the app — analyzers, attention manager, garden, decision cards, report
/dist          production build
/Shell_for_Bob_Break(UI)
               original design prototype the app was ported from
/evidence      IBM Bob task session summary screenshots
/docs          problem & solution statements, Bob usage statement
```

---

## Running locally

```bash
npm install
npm run dev
```

The app runs on `http://localhost:5173`.

Open it in Chrome or Edge. Bob Break reads a local directory through the File System Access API, which Firefox and Safari do not implement; the app detects this and says so rather than failing silently.

Click **Choose folder** and point it at any project. The four analyzers run against that folder and the garden fills as they go.

---

## How IBM Bob 2.0 was used

IBM Bob Agent mode and subagents were used to plan, build, test, and document the release-readiness workflow. At runtime, the prototype executes four local analyzers in parallel and translates their activity into a shared event format. A future Bob event integration would replace the current adapter without changing the Attention Manager or visual interface.

```mermaid
flowchart TD
    subgraph BobCapabilities["IBM Bob 2.0 — capabilities used"]
        AGT["Agent Mode<br/>plan + implement architecture"]
        SUB["Subagents<br/>isolated build contexts"]
        PAR["Parallel tasks<br/>concurrent multi-step sequences"]
        DOC["Document understanding<br/>read specs, conventions, docs"]
        RUL["Custom rules<br/>consistent commit + doc style"]
    end

    AGT --> ARCH["Architecture<br/>and analyzers"]
    SUB --> ISO["Backend · Interface · Tests<br/>no context pollution"]
    PAR --> CON["Concurrent build<br/>and test runs"]
    DOC --> CON2["Work follows real<br/>project constraints"]
    RUL --> CON3["Consistent output<br/>across all generated work"]
```

Specifically:

- **Agent mode** — planned the architecture and implemented the analyzers, the event pipeline, and the frontend components
- **Subagents** — isolated each build task in a self-contained context so work on the backend, the interface, and the tests did not pollute one another
- **Parallel tasks** — ran multi-step build and test sequences concurrently across the codebase
- **Document understanding** — read the project's own specifications, conventions, and existing documentation so generated work followed the real constraints instead of treating each request as an isolated coding task
- **Custom rules** — enforced consistent commit categorization and documentation style across everything Bob generated

> **TODO before submission:** replace this list with the specific tasks Bob performed, and confirm the exported task session summary screenshots are committed under `/evidence`.

---

## Submission deliverables

- [ ] Video demonstration, including how IBM Bob was used
- [ ] Written problem and solution statements — `/docs`
- [ ] Written statement on how IBM Bob was utilized — `/docs`
- [ ] Working code repository with exported Bob task session summary screenshots — `/evidence`

---

## Team

| Name | Role |
| --- | --- |
| Tony Wang | Team Leader |
| Silvia Tormo | General Member |
| Sandra Tormoo | General Member |

---

## Other Resources Used

- **Claude** — used Claude to formalize the code at the final stage after running out of Bobcoins

---

Built with IBM Bob 2.0 for the IBM TechXchange 2026 Pre-conference Dev Day Hackathon.
