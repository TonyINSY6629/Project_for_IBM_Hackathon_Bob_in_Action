# Problem and Solution Statements

**Project:** Bob Break — a developer attention management system for agentic AI
**Event:** IBM TechXchange 2026 Pre-conference Dev Day Hackathon
**Theme:** Build with purpose using IBM Bob 2.0

---

## 1. Problem statement

### The workflow

Release readiness. Before a production push, a developer or release manager has to establish
what changed, whether dependencies drifted, whether the tests still pass, and whether the
documentation still describes the software being shipped. Today that work is manual, repetitive,
and performed under time pressure at the least forgiving moment in the SDLC.

Agentic AI already automates most of it. IBM Bob 2.0 can plan the work, split it across
subagents, run those subagents in parallel, and report back. The mechanical bottleneck is
largely solved.

### The bottleneck that replaces it

A second bottleneck appears immediately behind the first, and it is human.

> The constraint is no longer how fast an agent can generate code.
> It is how much information a developer can absorb without becoming overwhelmed.

When four subagents work in parallel, they emit a continuous stream of plans, file diffs,
test output, questions, and status updates. The developer feels obliged to watch all of it,
because somewhere in that stream is the one thing that genuinely needs a human:

- Is it still working, or has it stalled?
- Is one of the subagents blocked?
- Did an error scroll past?
- Is it waiting on a decision from me?
- Can I safely look away?

### What this costs

Measured against a run of our own pipeline, a routine four-analyzer release check on a small
project emits **22 events**. Between **2 and 6** of them are things a human should act on.
The rest is progress noise. Yet all of it arrives on screen at the same size, in the same
colour, at the same moment.

The consequences are consistent and well understood by anyone who has supervised an agent run:

| Cost | Mechanism |
| --- | --- |
| Visual fatigue | Hours of continuous reading of code, logs, and terminal output |
| Cognitive overload | Tracking several parallel agents at once with no unified state |
| Wasted supervision | Repeated checking of processes that were progressing correctly |
| Broken work | Interrupting or cancelling agent runs out of uncertainty rather than need |
| Missed signals | Genuine decisions and warnings buried among low-value updates |
| Slow re-entry | A wall of generated text at the end, with no structured summary to return to |

The paradox is that the time the agent saves is converted directly into anxious waiting. The
developer is freed from doing the work and immediately re-occupied by watching it.

### Who this affects

Any developer using an autonomous coding agent on a multi-step task — which, as agent
capability increases, means an increasing share of all developers. The problem scales in the
wrong direction: the more capable and parallel the agent becomes, the worse the human
attention cost gets.

---

## 2. Solution statement

### What Bob Break is

Bob Break is an **attention management layer** built around an agentic release-readiness
workflow. It observes a real pipeline, classifies every event by whether a human genuinely
needs it, and renders the run as a calm visual state instead of a log stream.

It is not a wellness widget placed beside a developer tool. It is connected to real analyzer
activity, real task progress, real blockers, and real results. The visual experience *is* the
status display.

> Bob reduces the workload. Bob Break reduces the cognitive load.

### How it works

A single pure function — the **Attention Manager** — receives every event and routes it to
exactly one of four destinations:

| Event class | Route | Interrupts the developer? |
| --- | --- | --- |
| Background progress | Silent aggregation; a plant grows in the garden | No |
| Decision required | A decision card; the garden pauses until answered | Yes, deliberately |
| Blocked task | A calm notice naming precisely what is stuck | Softly |
| Critical risk | An immediate alert | Yes, immediately |

Everything, including the silent majority, is written to the run log and assembled into a
**release readiness report** — the structured summary that returns the developer to the code
knowing what changed, what passed, what remains risky, and what needs review.

Bob Break's final summary and the release report are the same artifact. One pipeline produces it.

### The workload being visualised

Four analyzers run in parallel against a target repository:

| Analyzer | Reads | Contributes to the report |
| --- | --- | --- |
| `diff-analyst` | Change surface, file inventory, recency | Categorised change summary |
| `deps-scanner` | The dependency manifest and lockfiles | Version drift, unpinned packages, breaking-change risk |
| `test-runner` | Test file inventory and coverage ratio | Test presence and thin-coverage warnings |
| `doc-writer` | README and CHANGELOG against source timestamps | Stale documentation, missing release notes |

The dependency analyzer parses three manifest formats — `package.json`, `requirements.txt`,
and `composer.json` — and separately detects nine lockfile types, including `poetry.lock`,
`Cargo.lock`, `Gemfile.lock`, and `go.sum`, to report whether installs are reproducible and
whether conflicting lockfiles are present. That is enough to produce genuine findings on real
Node, Python, and PHP projects rather than only on a prepared demo repository.

### The two views

The interface has one control, and that control is the argument of the project.

- **IDE view** — the dense technical surface: file tree, source code, and every event streaming
  unfiltered, exactly as a developer experiences agent supervision today.
- **Bob Break view** — the same run, same moment, same data: a growing garden, a guided
  breathing reset, three live metrics, and only the events that need a human.

Switching between them is instantaneous. Nothing is hidden — a "technical details" control
returns the developer to the full stream at any time. Bob Break never removes access to
information; it removes the obligation to watch it.

### What we deliberately did not build

Stated plainly, because the boundary matters:

- The prototype **does not attach to a running IBM Bob IDE process** and does not receive live
  subagent events. No such integration is claimed. Bob's role in this project is described in
  [`how-ibm-bob-was-used.md`](how-ibm-bob-was-used.md).
- The Event Adapter is the only component that knows where events originate. A future Bob event
  stream would replace its input without changing the Attention Manager, the report builder, or
  the interface. That seam is why the architecture is shaped this way.

### Expected impact, and how we measure it

The prototype instruments itself rather than asserting productivity gains. It counts:

- events emitted by the pipeline
- events surfaced to the developer
- interruptions requiring human input
- time from run start to a reviewable report

The headline figure is the ratio between the first two. On a real Python project scanned during
development, a run produced **22 events, surfaced 6, and held back 73%** — and the interface
displays that figure live for whatever project it is pointed at.

Comparative figures in the original concept document (context switches reduced from 4–6 to 0–1,
and similar) are **design targets, not measured results**, and are labelled as such wherever
they appear.

---

## 3. Why this matters beyond the prototype

Most AI development tooling is built to increase the speed and volume of generated work. Bob
Break addresses the human limit sitting directly behind that acceleration.

As agents become faster and more autonomous, developers will not be able to follow every
generated line, message, and intermediate decision — and will not need to. The next generation
of development tools has to manage not only tasks and code, but human attention.

That is the problem this prototype exists to explore.

> AI should save developers time, not convert that time into anxious waiting.
> **While Bob works, you breathe.**
