# Bob Break — Carbon Design System Migration Plan

> **Depends on:** [`docs/design-brief.md`](./design-brief.md) — read before starting any sub-task.  
> **Scope:** Frontend only (`web/`). Server code is not affected.  
> **Approach:** Incremental — each sub-task is independently reviewable.

---

## Overview

The current frontend uses a custom dark theme (`#0f1117` background, custom CSS variables).  
The design brief mandates IBM Carbon light theme, IBM Plex fonts, and Carbon role-based tokens.  
This plan migrates the visual layer without changing any component logic or the `RunContext` reducer.

---

## Sub-Task 1 — Install dependencies and load IBM Plex fonts

**Status:** `[ ] pending`

**Intent**  
Add IBM Plex Sans and IBM Plex Mono to the project and wire Carbon CSS tokens as CSS custom properties. No component changes yet.

**Expected outcomes**
- IBM Plex fonts load correctly in the browser.
- Carbon color tokens are available as CSS variables in `:root`.

**Todo**
1. Add font link to `web/index.html`:
   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@300;400;600;700&display=swap" rel="stylesheet">
   ```
2. Replace all custom CSS variables in `web/src/styles/interface.css` `:root` block with Carbon light-theme values per the mapping table in `docs/design-brief.md` § 12.
3. Update `--font-sans` and `--font-mono` to reference IBM Plex families.

**Relevant context**
- Mapping table: `docs/design-brief.md` § 12.
- File to edit: [`web/src/styles/interface.css`](../web/src/styles/interface.css).
- File to edit: [`web/index.html`](../web/index.html).

---

## Sub-Task 2 — Migrate base layout to Carbon light theme

**Status:** `[ ] pending`

**Intent**  
Flip the app shell, header, footer, and idle screen from the current dark palette to the Carbon light theme. This is the largest visual change and the foundation for all subsequent sub-tasks.

**Expected outcomes**
- `body` background is Carbon `Gray 10` (`#f4f4f4`).
- Header and footer use white/Gray 10 surfaces with `$border-subtle-01` borders.
- Idle screen heading and body text are legible at ≥ 4.5:1 contrast.
- Primary "Start run" button uses IBM Blue (`#0f62fe`) on white.

**Todo**
1. Update `.app`, `.app-header`, `.app-footer` in `interface.css` for light theme.
2. Update `.idle-screen__start` button: IBM Blue background, white text, Carbon focus ring.
3. Update `.decision-overlay` backdrop: `rgba(0,0,0,0.5)` (lighter than current `0.75`).
4. Verify contrast ratios for all text/background combinations.

**Relevant context**
- Files to edit: [`web/src/styles/interface.css`](../web/src/styles/interface.css).
- Design brief § 1 (colour roles) and § 7 (accessibility — contrast).

---

## Sub-Task 3 — Migrate agent tiles to Carbon light theme

**Status:** `[ ] pending`

**Intent**  
Update agent tile cards (`.plant`) to use white/Gray 10 surfaces, Carbon border tokens, and Carbon state colours for done/blocked/paused states.

**Expected outcomes**
- Tile background is white (`#ffffff`), border is `$border-subtle-01` (`#e0e0e0`).
- Done state: green left border (`$support-success: #24a148`) with faint green tint.
- Blocked state: amber left border (`$support-warning-text: #8e6a00`) with faint amber tint.
- Paused state: `opacity: 0.65` preserved.
- Progress bar fill: IBM Blue (`#0f62fe`) in working state, green when done.
- Plant label uses IBM Plex Mono, `$text-secondary` color.

**Todo**
1. Update `.plant`, `.plant--done`, `.plant--blocked`, `.plant--paused` in `garden.css`.
2. Update `.plant-stem` and `.plant-progress-fill` color values.
3. Update `.plant-label` font family and color.
4. Update `.garden-counter` and `.garden-counter__num`.

**Relevant context**
- File to edit: [`web/src/styles/garden.css`](../web/src/styles/garden.css).
- Design brief § 4.1 (agent tiles) and § 5 (state model).

---

## Sub-Task 4 — Migrate decision card to Carbon Modal pattern

**Status:** `[ ] pending`

**Intent**  
Restyle the decision card to match Carbon Modal visuals: white surface, IBM Blue primary action, explicit secondary action, correct focus trap already implemented in `DecisionCard.tsx`.

**Expected outcomes**
- Card background is white, border-radius matches Carbon (`0` — Carbon modals are square).
- Option buttons use Carbon `RadioButton`-style appearance or ghost button set.
- Primary submit button is IBM Blue.
- Amber accent used only for the agent badge, not the card border.
- Focus trap behaviour is unchanged (already correct in `DecisionCard.tsx`).

**Todo**
1. Update `.decision-card`, `.decision-card__option`, `.decision-card__submit` in `garden.css`.
2. Change card border from amber to `$border-subtle-01` — amber moves to badge only.
3. Add Carbon-style divider between question and options.
4. Verify Escape key and focus return work as before.

**Relevant context**
- File to edit: [`web/src/styles/garden.css`](../web/src/styles/garden.css).
- Component: [`web/src/components/DecisionCard.tsx`](../web/src/components/DecisionCard.tsx).
- Design brief § 4.3 (decision modal).

---

## Sub-Task 5 — Migrate risk alerts to Carbon Notification pattern

**Status:** `[ ] pending`

**Intent**  
Restyle `.risk-alert` to match Carbon inline notification appearance: white/light background, left-border severity indicator, icon + text, dismiss button.

**Expected outcomes**
- Blocker alert: amber left border, amber icon, calm amber text on white background.
- Critical risk alert: red left border, red icon (`$support-error: #da1e28`), white background.
- No alarming red background fill — border + icon only.
- Text is IBM Plex Sans, legible at ≥ 4.5:1.
- `aria-live="assertive"` on the alert stack (already set in `RiskAlert.tsx`).

**Todo**
1. Update `.risk-alert`, `.risk-alert--risk`, `.risk-alert__badge` in `garden.css`.
2. Replace dark surface with white/Gray 10 background.
3. Adjust border-left colors to Carbon support tokens.
4. Verify `RiskAlert.tsx` has correct `role="status"` or `role="alert"` attribute.

**Relevant context**
- File to edit: [`web/src/styles/garden.css`](../web/src/styles/garden.css).
- Component: [`web/src/components/RiskAlert.tsx`](../web/src/components/RiskAlert.tsx).
- Design brief § 4.4 (notifications) and § 5 (state model — critical).

---

## Sub-Task 6 — Migrate breathing circle and recovery panel

**Status:** `[ ] pending`

**Intent**  
The recovery panel is the **intentional exception** to the light theme. Per the design brief, the breathing area may use a `Gray 100` (`#161616`) dark surface for contrast. Update colors accordingly while keeping the animation logic unchanged.

**Expected outcomes**
- Recovery panel wrapper has `Gray 100` background as a deliberate dark island.
- Breathing circle uses violet accent (`#7c6be0`) on dark background.
- Label text is white (`#f4f4f4`) on dark — sufficient contrast.
- Breathing animation timing unchanged (8–12 s cycle).
- `prefers-reduced-motion` media query added: animation stopped, text "Breathe in / Breathe out" shown as static label.

**Todo**
1. Wrap `<BreathingCircle>` in a panel div with `background: #161616` (dark island).
2. Update `.breathing-circle` gradient to use violet accent on dark.
3. Update `.breathing-label` to white text.
4. Add `@media (prefers-reduced-motion: reduce)` block in `breathing.css`.

**Relevant context**
- File to edit: [`web/src/styles/breathing.css`](../web/src/styles/breathing.css).
- Component: [`web/src/components/BreathingCircle.tsx`](../web/src/components/BreathingCircle.tsx).
- Design brief § 1 (dark recovery surface exception) and § 6 (motion).

---

## Sub-Task 7 — Migrate completion summary to Carbon light theme

**Status:** `[ ] pending`

**Intent**  
Update the completion summary screen to use Carbon light surfaces, Carbon typography scale, and correct Carbon action buttons (primary / secondary / ghost).

**Expected outcomes**
- Summary background is Gray 10 / white.
- Metric tiles are white cards with `$border-subtle-01` borders.
- Accent value color changes from `--color-accent` (dark blue) to IBM Blue (`#0f62fe`).
- Analyzer rows: green left border for done, amber for blocked — on white background.
- Action buttons: "Review report" (IBM Blue primary) · "View details" (secondary) · "Restart demo" (ghost).

**Todo**
1. Update `.summary`, `.summary-metrics li`, `.summary-analyzer` in `breathing.css`.
2. Update `.summary-metric__value` to use IBM Blue.
3. Update `.summary-review-item` for light background legibility.
4. Verify `CompletionSummary.tsx` action buttons have correct classes for Carbon-style appearance.

**Relevant context**
- File to edit: [`web/src/styles/breathing.css`](../web/src/styles/breathing.css).
- Component: [`web/src/components/CompletionSummary.tsx`](../web/src/components/CompletionSummary.tsx).
- Design brief § 4.5 (completion summary).

---

## Sub-Task 8 — Accessibility audit and fixes

**Status:** `[ ] pending`

**Intent**  
Verify that the migrated interface meets the accessibility requirements in the design brief. Fix any gaps found.

**Expected outcomes**
- All interactive elements have visible focus rings (Carbon `$focus` blue, 2 px offset).
- All progress bars have `role="progressbar"` with `aria-valuenow/min/max` and `aria-label`.
- Decision modal has `aria-modal="true"` and `aria-labelledby`.
- Alert stack has `aria-live="assertive"`.
- Completion screen has `role="status"` announcement on mount.
- No color-only state communication anywhere.

**Todo**
1. Audit `AgentPlant.tsx` — ensure `aria-label` is updated when phase/progress change.
2. Audit `DecisionCard.tsx` — verify `aria-modal`, `aria-labelledby`, focus trap.
3. Audit `RiskAlert.tsx` — verify `role="alert"` on critical, `role="status"` on blocker.
4. Audit `CompletionSummary.tsx` — add `aria-live` or announce on mount.
5. Check all buttons have descriptive accessible names (not just icon labels).

**Relevant context**
- Components: all files in [`web/src/components/`](../web/src/components/).
- Design brief § 7 (accessibility).
- Carbon accessibility reference: https://carbondesignsystem.com/guidelines/accessibility/overview/
