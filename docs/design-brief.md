# Bob Break — IBM Carbon Design Brief

> **Status:** Canonical reference. Every agent working on the frontend must read this document before making any visual change.  
> **Scope:** Hackathon MVP only. See § 9 for what is explicitly out of scope.

---

## Purpose

Bob Break is a developer attention management system for IBM Bob 2.0.  
Its interface must reduce visual and cognitive overload while Bob and its agents work.

Core message:

> Bob reduces the workload. Bob Break reduces the cognitive load.

The experience must feel calm, trustworthy, technical, and recognisably IBM —  
without becoming another dense monitoring dashboard.

---

## 1. Visual foundation

Use **IBM Carbon** as the base design system, adapted to a recovery-focused experience.

- Default theme: **light Carbon** (`White` or `Gray 10` — `#f4f4f4`).
- Optional focused/recovery area: dark `Gray 100` (`#161616`) surface for the breathing panel.
- Organise layers with neutral grays; use IBM Blue for primary actions.
- Use additional colour **only** to communicate status.
- Prefer flat, structured surfaces over decorative gradients.
- Use **Carbon role-based tokens** rather than hard-coded hex values where possible.

### Essential colour roles

| Role | Carbon token (approx.) | Hex | Recommended use |
|---|---|---|---|
| Background | `$background` / Gray 10 | `#f4f4f4` | Main application background |
| Layer | `$layer-01` / White | `#ffffff` | Cards, panels, agent tiles |
| Text primary | `$text-primary` | `#161616` | Main titles and essential status |
| Text secondary | `$text-secondary` | `#525252` | Supporting information |
| Text placeholder | `$text-placeholder` | `#a8a8a8` | Helper text, monospace labels |
| IBM Blue | `$interactive` | `#0f62fe` | Primary buttons, links, focus, active state |
| Green | `$support-success` | `#24a148` | Completed task |
| Amber | `$support-warning` | `#f1c21b` | Waiting, non-critical blocker |
| Red | `$support-error` | `#da1e28` | Critical risk **only** |
| Violet accent | — | `#7c6be0` | Bob Break recovery experience; use sparingly |
| Border subtle | `$border-subtle-01` | `#e0e0e0` | Tile and card borders |

> **Rule:** Colour must never be the only way to communicate a state.  
> Always add a text label and, where useful, an icon.

---

## 2. Typography

Use **IBM Plex Sans** for all interface text.  
Use **IBM Plex Mono** only for technical identifiers, analyzer IDs, event names, or code snippets.

Load both from the `@ibm/plex` package or via Google Fonts CDN:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@300;400;600;700&display=swap" rel="stylesheet">
```

### Type scale

| Element | Approx. size | Weight | Guidance |
|---|---:|---|---|
| Page title | 32–42 px | 600–700 | Short and direct. Sentence case. |
| Section heading | 24–28 px | 600 | Sentence case |
| Card title / agent name | 16–18 px | 600 | Clear agent or state name |
| Body | 14–16 px | 400 | Short paragraphs only |
| Labels / helper text | 12 px | 400 | Secondary information |
| Technical data (mono) | 12–14 px | 400 | Analyzer IDs, event counts, timestamps |

**Avoid:** long paragraphs · uppercase body copy · continuous technical log streams.  
**Use:** sentence case for headings, labels, buttons, and messages.

---

## 3. Spacing and layout

Use Carbon's **8 px base spacing rhythm**.

| Token | Value | Use |
|---|---|---|
| `$spacing-02` | 8 px | Small internal gap |
| `$spacing-05` | 16 px | Standard component padding |
| `$spacing-06` | 24 px | Separation between related blocks |
| `$spacing-07` | 32 px | Separation between major areas |
| `$spacing-09` | 48 px | Major section spacing |

### Desktop layout (≥ 1024 px)

Three horizontal areas, left to right or stacked by importance:

1. **Agent status area** — four release-readiness agent tiles in a 2×2 grid.
2. **Recovery area** — garden (plants + breathing circle + calming message + minimal progress).
3. **Essential status area** — decisions, blockers, and completion summary.

### Mobile layout (< 768 px)

Stack vertically. Keep the recovery experience **above** technical details.

---

## 4. Core components

Only implement components required by the hackathon MVP.

### 4.1 Agent tiles

One tile per analyzer: `diff-analyst` · `deps-scanner` · `test-runner` · `doc-writer`.

Each tile must show:
- Agent display name (IBM Plex Sans, 16 px, 600 weight).
- Text status: **Planned · Working · Waiting · Blocked · Completed** (sentence case, never uppercase body).
- Simple progress value (`42%`) or a Carbon `ProgressBar`.
- Plant emoji / icon representing the current phase.
- Optional technical detail behind a progressive disclosure toggle ("View details").

### 4.2 Recovery panel

The main visual area. Contains:
- Four plants representing agent progress.
- A slow breathing circle.
- A short calming message (see § 8 Content principles).
- Minimal overall progress indicator.
- A subtle "View technical details" action (link-style, never prominent button).

**Do not show event logs by default.**

### 4.3 Decision modal

Use a Carbon Modal pattern only when human input is required.

Contents:
- Agent requesting input (monospace ID + display name).
- One concise question.
- Two or three clearly worded options (Carbon `RadioButton` or `Button` group).
- Primary action: "Confirm" (or context-specific label).
- Secondary action: explicit cancel only when safe to do so.
- No unnecessary technical detail in the visible body.

**Accessibility requirements for the modal:**
- Trap focus inside the modal while open.
- Support `Escape` to dismiss only when dismissal is safe (i.e. no mandatory answer).
- Return focus to the trigger element after closing.
- `aria-modal="true"`, labelled with `aria-labelledby`.

### 4.4 Notifications

Use the right Carbon notification pattern for each severity:

| Situation | Carbon pattern |
|---|---|
| Non-critical blocker or warning | Inline notification (`kind="warning"`) |
| Decision required | Actionable notification or modal |
| Critical risk | Toast or inline notification (`kind="error"`, high-contrast) |
| Run completed | Toast notification (`kind="success"`) |

**Avoid showing multiple simultaneous notifications.** Queue or dismiss before showing next.

### 4.5 Completion summary

Show on a dedicated screen when all four analyzers complete. Include:

- Tasks completed (count).
- Tests passed / failed.
- Decisions made (question + chosen answer).
- Blockers and risks detected.
- Events generated, hidden, and surfaced (suppression ratio).
- Time to a reviewable report (`timeToReportMs`).
- Actions: **Review report** (primary) · **View details** (secondary) · **Restart demo** (ghost).

---

## 5. State model

| Analyzer state | Visual treatment | Plant appearance |
|---|---|---|
| `planned` | Neutral gray (`Gray 20` tile) | 🌱 Seedling — small, static |
| `working` | IBM Blue / violet active state | 🌿 Slow animated growth |
| `waiting` | Amber (`$support-warning`) | ⏸️ Frozen — decision modal open |
| `blocked` | Amber warning (`$support-warning`) | 🍂 Calm wilting, no rapid pulse |
| `critical` (severity) | Red (`$support-error`) | Interrupt immediately, red border |
| `done` | Green (`$support-success`) | 🌸 Flowering — smooth bloom |

---

## 6. Motion

Motion must **reduce stress** rather than attract attention.

| Guideline | Specification |
|---|---|
| Breathing cycle | 8–12 seconds, `ease-in-out`, continuous loop |
| Plant growth | Small calm steps, `ease-out`, 0.6–1 s per step |
| State transitions | `opacity` + `transform` only, 250–400 ms |
| Completion bloom | Short satisfying animation, max 600 ms, then static |
| Never | Flash, rapid pulse, bounce, or bounce-back |

### `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  /* Replace growth/breathing animations with instant state change */
  .breathing-circle { animation: none; }
  .plant-stem       { transition: none; }
  /* Provide static text guidance instead of animation */
}
```

In reduced-motion mode: replace animated cues with text labels (e.g. "Breathe in" / "Breathe out" as plain text cycling).

---

## 7. Accessibility

Follow Carbon accessibility patterns. Target **WCAG 2.1 AA** throughout.

| Requirement | Implementation note |
|---|---|
| Semantic HTML | Use `<header>`, `<main>`, `<section>`, `<footer>`, `<ul>`, `<li>`, `<button>` |
| Full keyboard operation | All interactive elements reachable and operable via keyboard |
| Visible focus indicator | Use Carbon's default focus ring (`$focus` token, `#0f62fe`, 2 px offset) |
| Sufficient contrast | Text on background ≥ 4.5:1 (normal), ≥ 3:1 (large/bold) |
| Text labels | Every status colour has a matching text label and/or icon with `aria-label` |
| Progress semantics | Use `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label` |
| Live regions | Decisions, blockers, critical risks, and completion use `aria-live="assertive"` or Carbon notification semantics |
| Focus management | Move focus only for genuine decisions or critical alerts. Never for routine progress. |
| Modal focus trap | Focus trapped in decision modal while open. Returns to trigger on close. |
| No animation-only info | No essential information conveyed only through motion. |

---

## 8. Content principles

Use short, calm, actionable language.

### Preferred examples

- "Bob and the agents are working."
- "You do not need to monitor every update."
- "Take a breath. We will let you know if your attention is needed."
- "Dependency Scanner needs your input."
- "The work is complete. Return when you are ready."

### Avoid

- Long technical explanations in the main view.
- Repeated status messages.
- Alarmist language for non-critical blockers.
- Vague actions such as "OK" or "Continue" without context.
- Passive voice when an action is needed.

---

## 9. MVP scope

### Build only

- Four agent tiles / plants.
- One recovery garden (plants + breathing circle + calming message).
- One decision modal.
- One blocker / critical alert notification pattern.
- One completion summary screen.
- Reduced-motion support.

### Do not build

- Multiple themes or dark/light toggle.
- Tamagotchi companion mode.
- Bubble game.
- Historical analytics dashboard.
- Complex settings panel.
- Full technical event log view.
- watsonx integration.
- Authentication.

---

## 10. Success criteria

The design succeeds when a developer can understand, **within a few seconds**:

1. Bob is still working.
2. Which agents are active or complete.
3. Whether human input is required.
4. Whether a blocker or critical risk exists.
5. What happened when the run finishes.

The developer should **not** need to read the full event stream.

---

## 11. Official references

| Resource | URL |
|---|---|
| Carbon Design System | https://carbondesignsystem.com/ |
| Color and themes | https://carbondesignsystem.com/elements/color/overview/ |
| Progress indicator | https://carbondesignsystem.com/components/progress-indicator/usage/ |
| Loading / spinner | https://carbondesignsystem.com/components/loading/usage/ |
| Modal | https://carbondesignsystem.com/components/modal/usage/ |
| Notification | https://carbondesignsystem.com/components/notification/usage/ |
| Accessibility foundations | https://carbondesignsystem.com/guidelines/accessibility/overview/ |
| IBM Plex font | https://www.ibm.com/plex/ |

---

## 12. CSS variable mapping (current → Carbon)

When migrating the existing `interface.css` / `garden.css` / `breathing.css`, use this mapping:

| Current variable | Carbon replacement |
|---|---|
| `--color-bg: #0f1117` | `--cds-background: #f4f4f4` (light theme) |
| `--color-surface: #1a1d27` | `--cds-layer-01: #ffffff` |
| `--color-border: #2a2d3a` | `--cds-border-subtle-01: #e0e0e0` |
| `--color-text: #e2e4ec` | `--cds-text-primary: #161616` |
| `--color-muted: #7b7f96` | `--cds-text-secondary: #525252` |
| `--color-accent: #7c9ff5` | `--cds-interactive: #0f62fe` |
| `--color-green: #5dbf7f` | `--cds-support-success: #24a148` |
| `--color-amber: #d4a84b` | `--cds-support-warning-text: #8e6a00` (on light) |
| `--font-sans` | `'IBM Plex Sans', sans-serif` |
| `--font-mono` | `'IBM Plex Mono', monospace` |

> The recovery panel (breathing area) may keep a `Gray 100` dark surface for contrast against the light theme — this is an intentional design choice, not a theming inconsistency.
