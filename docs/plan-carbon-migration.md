# Plan — IBM Carbon Light Theme Migration

> **Priority:** 🚨 Design brief blocker — the current CSS uses a custom dark theme.
> The IBM Carbon Design Brief mandates the light theme.
>
> **Read first — mandatory:**
> - [`docs/design-brief.md`](./design-brief.md) — full IBM Carbon Design Brief (canonical reference)
>   - § 1: colour roles and Carbon tokens
>   - § 2: IBM Plex typography
>   - § 3: spacing (8 px rhythm)
>   - § 6: motion rules and `prefers-reduced-motion`
>   - § 7: accessibility requirements
>   - § 12: variable mapping table (current → Carbon)
>
> **Scope:** CSS and minimal TSX changes only. No logic, no reducer, no context changes.
> Three CSS files + `web/index.html`. All component behaviour is preserved.
>
> **Branch:** `feature/visual-experience` (already exists — commit on top of it)
>
> **Key rule from the brief:**
> Colour must never be the only way to communicate a state. Always add a text label.

---

## Overview

Three CSS files currently use a custom dark theme (`#0f1117` background).
This plan replaces every custom variable with Carbon light-theme values in strict order:
variables first, then layout, then components, then motion, then accessibility.

The **one intentional exception**: the breathing/recovery panel keeps `Gray 100` (`#161616`)
as a dark island inside the light page — this is a deliberate design decision per the brief § 1.

---

## Sub-Task 1 — IBM Plex fonts + Carbon CSS variable foundation

**Status:** `[ ] pending`

**Intent**
Load IBM Plex fonts and replace the `:root` variable block in `interface.css` with
Carbon light-theme values. This is the foundation — all visual changes downstream
depend on these variables being correct.

**Expected outcomes**
- IBM Plex Sans and IBM Plex Mono load from Google Fonts CDN.
- `:root` in `interface.css` contains Carbon light-theme values for all custom properties.
- `--font-sans` = `'IBM Plex Sans', sans-serif`
- `--font-mono` = `'IBM Plex Mono', monospace`
- No component appearance changes yet (variables are updated but classes use same names).

**Todo**
1. Edit `web/index.html` — add inside `<head>`:
   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@300;400;600;700&display=swap" rel="stylesheet">
   ```
2. Replace the entire `:root` block in `web/src/styles/interface.css` with:
   ```css
   :root {
     /* Carbon light theme — background */
     --color-bg:        #f4f4f4;   /* $background / Gray 10 */
     --color-surface:   #ffffff;   /* $layer-01 / White */
     --color-border:    #e0e0e0;   /* $border-subtle-01 */

     /* Carbon light theme — text */
     --color-text:      #161616;   /* $text-primary */
     --color-muted:     #525252;   /* $text-secondary */
     --color-placeholder: #a8a8a8; /* $text-placeholder */

     /* Carbon — interactive & status */
     --color-accent:    #0f62fe;   /* $interactive / IBM Blue */
     --color-green:     #24a148;   /* $support-success */
     --color-amber:     #f1c21b;   /* $support-warning */
     --color-amber-text:#8e6a00;   /* amber text on light bg */
     --color-red:       #da1e28;   /* $support-error */
     --color-violet:    #7c6be0;   /* Bob Break recovery accent */

     /* Recovery panel — intentional dark island */
     --color-recovery-bg: #161616; /* Gray 100 */

     /* Typography */
     --font-sans: 'IBM Plex Sans', -apple-system, sans-serif;
     --font-mono: 'IBM Plex Mono', 'Cascadia Code', monospace;
     --text-base: 15px;
     --leading:   1.6;

     /* Spacing (Carbon 8px rhythm) */
     --space-1: 4px;
     --space-2: 8px;
     --space-3: 12px;
     --space-4: 16px;
     --space-6: 24px;
     --space-8: 32px;

     /* Radius — Carbon uses mostly 0; keep small radius for cards */
     --radius-sm: 2px;
     --radius-md: 4px;
     --radius-lg: 4px;
   }
   ```

**Relevant context**
- File to edit: [`web/src/styles/interface.css`](../web/src/styles/interface.css)
- File to edit: [`web/index.html`](../web/index.html)
- Mapping reference: `docs/design-brief.md` § 12

---

## Sub-Task 2 — App shell, header, footer, idle screen

**Status:** `[ ] pending`

**Intent**
Flip the app shell from dark to Carbon light. This is the most visible change —
every screen is affected because `body` and `.app` are the base layer.

**Expected outcomes**
- `body` background is `#f4f4f4` (Carbon Gray 10).
- `.app-header` and `.app-footer` are white with `#e0e0e0` border, dark text.
- `.app-header__title` is `#161616` (text-primary), weight 600.
- `.app-header__badge` is `#525252` (text-secondary), IBM Plex Mono.
- Idle screen heading is `#161616`, subtext is `#525252`.
- "Start run" button: `background: #0f62fe`, `color: #ffffff`, no border-radius or `radius-sm`.
- Focus ring on button: `outline: 2px solid #0f62fe; outline-offset: 2px`.
- Decision overlay backdrop: `rgba(0, 0, 0, 0.5)`.

**Todo**
1. Update `body` rule: `background: var(--color-bg); color: var(--color-text)`.
2. Update `.app-header`: `background: var(--color-surface); border-bottom: 1px solid var(--color-border)`.
3. Update `.app-header__title`: `color: var(--color-text); font-family: var(--font-sans); font-weight: 600`.
4. Update `.app-header__badge`: `color: var(--color-muted); font-family: var(--font-mono)`.
5. Update `.app-footer`: same as header — white bg, border-top, muted text.
6. Update `.idle-screen__heading`: `color: var(--color-text)`.
7. Update `.idle-screen__sub`: `color: var(--color-muted)`.
8. Update `.idle-screen__start`: IBM Blue bg, white text, `border-radius: var(--radius-sm)`, Carbon focus ring.
9. Update `.decision-overlay`: `background: rgba(0,0,0,0.5)`.

**Relevant context**
- File to edit: [`web/src/styles/interface.css`](../web/src/styles/interface.css)
- Design brief § 1 (colours), § 2 (typography), § 7 (focus ring)

---

## Sub-Task 3 — Agent tiles (plant cards)

**Status:** `[ ] pending`

**Intent**
Migrate `.plant` cards from dark surfaces to white Carbon cards with semantic
left-border states and Carbon status colours.

**Expected outcomes**
- `.plant` base: `background: #ffffff`, `border: 1px solid #e0e0e0`, `border-radius: var(--radius-md)`.
- `.plant--done`: `border-left: 3px solid #24a148`, faint green tint `color-mix(in srgb, #24a148 6%, #ffffff)`.
- `.plant--blocked`: `border-left: 3px solid #f1c21b`, faint amber tint.
- `.plant--paused`: `opacity: 0.65` (unchanged).
- `.plant-stem` (working): `background: #0f62fe` (IBM Blue, not green).
- `.plant-stem` (done): `background: #24a148`.
- `.plant-stem` (blocked): `background: #f1c21b`.
- `.plant-progress-fill` (working): `background: #0f62fe`.
- `.plant-progress-fill` (done): `background: #24a148`.
- `.plant-label`: `color: #525252`, `font-family: var(--font-mono)`.
- `.garden-counter`: `color: #525252`, `font-family: var(--font-mono)`.
- `.garden-counter__num`: `color: #0f62fe`.

**Todo**
1. Update `.plant` base styles in `garden.css`.
2. Update `.plant--done` and `.plant--blocked` border + background.
3. Add `.plant--working .plant-stem { background: var(--color-accent); }`.
4. Update `.plant--done .plant-stem` and `.plant--blocked .plant-stem`.
5. Update `.plant-progress-fill` and phase overrides.
6. Update `.plant-label` and `.garden-counter` typography + color.

**Relevant context**
- File to edit: [`web/src/styles/garden.css`](../web/src/styles/garden.css)
- Design brief § 4.1 (agent tiles), § 5 (state model)

---

## Sub-Task 4 — Decision card (Carbon Modal pattern)

**Status:** `[ ] pending`

**Intent**
Restyle the decision card from a dark amber-bordered box to a Carbon Modal-style
white card. The component logic and focus trap in `DecisionCard.tsx` are unchanged.

**Expected outcomes**
- `.decision-card`: `background: #ffffff`, `border: 1px solid #e0e0e0`, `border-radius: var(--radius-md)`.
- Amber colour moves to the agent badge only — NOT the card border.
- `.decision-card__badge`: amber background tint, `#8e6a00` text.
- A `border-top: 3px solid #0f62fe` at the top of the card (Carbon Modal accent).
- `.decision-card__option` buttons: `background: #f4f4f4`, `border: 1px solid #e0e0e0`, dark text.
- `.decision-card__option:hover`: `border-color: #0f62fe`, `background: #f0f4ff`.
- `.decision-card__option--selected`: `border-color: #0f62fe`, `background: #d0e2ff`.
- `.decision-card__submit`: IBM Blue (`#0f62fe`), white text.
- Focus rings: `outline: 2px solid #0f62fe; outline-offset: 2px`.

**Todo**
1. Update `.decision-card` — white bg, subtle border, blue top accent, `border-radius: var(--radius-md)`.
2. Remove amber from card border, update `.decision-card__badge` to amber badge only.
3. Update `.decision-card__question` to `color: #161616`.
4. Update `.decision-card__option`, `:hover`, `--selected` states.
5. Update `.decision-card__submit` to IBM Blue.
6. Verify focus-visible rings on all interactive elements.

**Relevant context**
- File to edit: [`web/src/styles/garden.css`](../web/src/styles/garden.css)
- Component (no logic change): [`web/src/components/DecisionCard.tsx`](../web/src/components/DecisionCard.tsx)
- Design brief § 4.3

---

## Sub-Task 5 — Risk alerts (Carbon Notification pattern)

**Status:** `[ ] pending`

**Intent**
Restyle `.risk-alert` to match Carbon inline notification: white background,
left-border severity indicator, calm text. No alarming red fill — border only.

**Expected outcomes**
- `.risk-alert` base: `background: #ffffff`, `border: 1px solid #e0e0e0`, `border-left: 3px solid #f1c21b`.
- `.risk-alert--risk` (critical): `border-left-color: #da1e28`.
- `.risk-alert__badge` (blocker): `color: #8e6a00`.
- `.risk-alert__badge` (critical): `color: #da1e28`.
- `.risk-alert__title`: `color: #161616`.
- `.risk-alert__analyzer`: `color: #525252`, `font-family: var(--font-mono)`.
- `.risk-alert__dismiss`: `color: #525252` on light bg; `:hover` → `#161616`.
- No red or amber background fill — border + text only.

**Todo**
1. Update `.risk-alert` — white bg, subtle border, amber left border.
2. Update `.risk-alert--risk` — red left border only.
3. Update `.risk-alert__badge` color for each variant.
4. Update `.risk-alert__title` and `.risk-alert__analyzer` for light bg legibility.
5. Update `.risk-alert__dismiss` for light bg.

**Relevant context**
- File to edit: [`web/src/styles/garden.css`](../web/src/styles/garden.css)
- Component: [`web/src/components/RiskAlert.tsx`](../web/src/components/RiskAlert.tsx)
- Design brief § 4.4, § 5 (calm language for alerts)

---

## Sub-Task 6 — Breathing circle and recovery panel (dark island)

**Status:** `[ ] pending`

**Intent**
Wrap the breathing circle in a `Gray 100` dark panel — the intentional exception
to the light theme. Add `prefers-reduced-motion` support.

**Expected outcomes**
- A `.recovery-panel` wrapper has `background: #161616`, `border-radius: var(--radius-md)`,
  `padding: var(--space-6)`.
- `.breathing-circle` gradient uses `#7c6be0` (violet) on the dark background.
- `.breathing-label` is white (`#f4f4f4`).
- `@media (prefers-reduced-motion: reduce)`:
  - All animations on `.breathing-circle` and `.plant-stem` are disabled.
  - `.breathing-label` shows static text "Take a breath" instead of the animated label.

**Todo**
1. In `web/src/components/BreathingCircle.tsx`, wrap the return in:
   ```tsx
   <div className="recovery-panel">
     {/* existing content */}
   </div>
   ```
2. Add `.recovery-panel` rule to `breathing.css`.
3. Update `.breathing-circle` gradient colors for dark background.
4. Update `.breathing-label` to white text.
5. Add `@media (prefers-reduced-motion: reduce)` block in `breathing.css` that:
   - Stops `.breathing-circle` animation.
   - Sets `.breathing-label` content to a static message via a CSS class toggle or
     by adding a `<span aria-hidden="true">` with static text shown only in reduced motion.

**Relevant context**
- File to edit: [`web/src/styles/breathing.css`](../web/src/styles/breathing.css)
- Component (minimal TSX change): [`web/src/components/BreathingCircle.tsx`](../web/src/components/BreathingCircle.tsx)
- Design brief § 1 (dark island exception), § 6 (motion + reduced-motion)

---

## Sub-Task 7 — Completion summary

**Status:** `[ ] pending`

**Intent**
Migrate the completion summary screen to Carbon light surfaces and add
the three action buttons specified in the design brief.

**Expected outcomes**
- `.summary` background inherits Gray 10 from body.
- `.summary-metrics li`: `background: #ffffff`, `border: 1px solid #e0e0e0`.
- `.summary-metric__value`: `color: #0f62fe` (IBM Blue).
- `.summary-metric__label`: `color: #525252`.
- `.summary-analyzer`: white bg, `border: 1px solid #e0e0e0`.
- `.summary-analyzer--done`: `border-left: 3px solid #24a148`.
- `.summary-analyzer--blocked`: `border-left: 3px solid #f1c21b`.
- `.summary-analyzer__status` (done): `color: #24a148`.
- `.summary-analyzer__status` (blocked): `color: #8e6a00`.
- `.summary-review-item`: `background: #fff8e1`, `color: #8e6a00`, `border: 1px solid #f1c21b`.
- Three action buttons added at the bottom of `CompletionSummary.tsx`:
  - "Review report" — IBM Blue primary (`background: #0f62fe; color: #fff`).
  - "View details" — secondary (`background: transparent; border: 1px solid #0f62fe; color: #0f62fe`).
  - "Restart demo" — ghost (`background: transparent; color: #525252`).

**Todo**
1. Update all `.summary-*` rules in `breathing.css` for light theme.
2. In `CompletionSummary.tsx`, add a button row at the bottom of the report (after
   the reviewRequired section):
   ```tsx
   <div className="summary-actions">
     <button className="summary-btn summary-btn--primary">Review report</button>
     <button className="summary-btn summary-btn--secondary">View details</button>
     <button className="summary-btn summary-btn--ghost">Restart demo</button>
   </div>
   ```
3. Add `.summary-actions`, `.summary-btn`, and modifier classes to `breathing.css`.

**Relevant context**
- File to edit: [`web/src/styles/breathing.css`](../web/src/styles/breathing.css)
- Component (button row only): [`web/src/components/CompletionSummary.tsx`](../web/src/components/CompletionSummary.tsx)
- Design brief § 4.5

---

## Sub-Task 8 — Accessibility audit and fixes

**Status:** `[ ] pending`

**Intent**
Verify every accessibility requirement in the design brief is met after the
visual migration. Fix any gaps found. Target: zero axe violations on the garden view.

**Expected outcomes**
- All interactive elements have visible `outline: 2px solid #0f62fe` focus ring.
- `AgentPlant` progress bar has `role="progressbar"` with `aria-valuenow`, `aria-valuemin=0`,
  `aria-valuemax=100`, `aria-label`.
- `DecisionCard` has `aria-modal="true"`, `aria-labelledby="decision-question"` (already present — verify).
- `RiskAlert` individual alerts have `role="alert"` (already present — verify).
- `CompletionSummary` has `aria-live="polite"` on the loading state and announces on render.
- No element communicates state through colour alone.
- `BreathingCircle` has `aria-hidden="true"` (already present — verify).

**Todo**
1. In `AgentPlant.tsx`, replace the plain `<div className="plant-progress-track">` with:
   ```tsx
   <div
     className="plant-progress-track"
     role="progressbar"
     aria-valuenow={progress}
     aria-valuemin={0}
     aria-valuemax={100}
     aria-label={`${label} progress`}
   />
   ```
   (the fill div remains a child inside it)
2. Verify `DecisionCard.tsx` has `aria-modal="true"` and `aria-labelledby` — it does, no change needed.
3. Verify `RiskAlert.tsx` has `role="alert"` on individual alerts — it does, no change needed.
4. In `CompletionSummary.tsx`, add `aria-live="polite"` to the loading paragraph (already present — verify).
5. Add global focus ring rule to `interface.css`:
   ```css
   :focus-visible {
     outline: 2px solid var(--color-accent);
     outline-offset: 2px;
   }
   ```
6. Check every `.plant--*` CSS state also changes the `plant-label` text — plant label already
   reflects state via `aria-label` on the plant div, confirm it updates dynamically.

**Relevant context**
- Components: all in [`web/src/components/`](../web/src/components/)
- Design brief § 7 (full accessibility checklist)
- WCAG 2.1 AA target

---

## Acceptance criteria checklist

- [ ] `body` background is `#f4f4f4` — no dark background visible except recovery panel.
- [ ] IBM Plex Sans renders for all UI text.
- [ ] IBM Plex Mono renders for analyzer IDs, counters, and technical labels.
- [ ] Agent tiles are white with Carbon status borders.
- [ ] Plant stem is IBM Blue during `working`, green when `done`, amber when `blocked`.
- [ ] Decision card is white with blue top accent — no amber border.
- [ ] Risk alert is white with left-border severity indicator — no coloured fill.
- [ ] Recovery panel is `Gray 100` dark island within the light page.
- [ ] Breathing animation stops and static text appears with `prefers-reduced-motion`.
- [ ] Completion summary uses white cards, IBM Blue metric values, and three action buttons.
- [ ] All interactive elements show `#0f62fe` focus ring on keyboard focus.
- [ ] `AgentPlant` progress bar has `role="progressbar"` with correct aria attributes.
- [ ] No axe violations on the main garden view.
