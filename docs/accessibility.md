# Accessibility Guidelines — Task Board (Sample Application)

This document defines the WCAG 2.1 Level AA requirements that IBM Bob's `deps-scanner`
subagent must verify and correct. Work through every item on this checklist.

---

## 1. Colour contrast

**Requirement:** All text must achieve a contrast ratio of at least **4.5:1** against its
background (WCAG 1.4.3). Large text (18pt / 14pt bold) requires **3:1**.

**Check these pairs:**

| Element | Foreground token | Background token | Minimum ratio |
| --- | --- | --- | --- |
| Body text | `--color-text` | `--color-bg` | 4.5:1 |
| Muted / placeholder text | `--color-text-muted` | `--color-bg` | 4.5:1 |
| Muted text on surface | `--color-text-muted` | `--color-surface` | 4.5:1 |
| Button label (accent) | `#ffffff` | `--color-accent` | 4.5:1 |
| Danger button hover | `#ffffff` | `--color-danger` | 4.5:1 |
| Done task text | `--color-done` | `--color-surface` | 4.5:1 |

Verify both light mode (`:root`) and dark mode (`body.dark`) values.
Use the APCA or WCAG contrast algorithm. Fix any failing pair by adjusting the token
value in `global.css` — do not change individual component styles.

---

## 2. Keyboard navigation

**Requirement:** All interactive elements must be reachable and operable by keyboard
alone, with a visible focus indicator (WCAG 2.1.1, 2.4.7).

**Check every interactive element:**

- [ ] Checkbox in each task row — reachable with Tab, toggled with Space
- [ ] "Remove" button in each task row — reachable with Tab, activated with Enter/Space
- [ ] Text input in AddTaskForm — reachable with Tab
- [ ] "Add" submit button — reachable with Tab, activated with Enter/Space
- [ ] Focus ring is visible in both light and dark mode (do not use `outline: none` without a replacement)

**Fix:** if any element lacks a visible focus ring, add one using:
```css
:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
```

---

## 3. ARIA labels and roles

**Requirement:** All interactive elements and landmark regions must have accessible names
(WCAG 4.1.2).

**Verify these are present and accurate:**

| Element | Required attribute |
| --- | --- |
| `<header>` | Implicit landmark — no extra attribute needed |
| `<main>` | Implicit landmark — no extra attribute needed |
| `<ul>` task list | `aria-label="Task list"` |
| `<form>` | `aria-label="Add a new task"` |
| Checkbox per task | `aria-label="Mark '…' as complete/incomplete"` (dynamic) |
| Remove button per task | `aria-label="Delete task: …"` (dynamic) |
| Remaining-count badge | `aria-label="N tasks remaining"` |

If any of these are missing or incorrect, add them.

---

## 4. Semantic HTML

**Requirement:** Content must use appropriate HTML elements so assistive technologies
can interpret structure correctly (WCAG 1.3.1).

**Verify:**

- [ ] Page heading uses `<h1>` — one `<h1>` per page
- [ ] Task list uses `<ul>` with `<li>` items — not `<div>` elements
- [ ] Form uses `<form>` with a `<label>` explicitly associated to the `<input>` via `htmlFor` / `id`
- [ ] Buttons use `<button>` — not `<div onClick>` or `<a>` without `href`
- [ ] `<header>` and `<main>` landmark elements are present

---

## 5. Images and icons

**Requirement:** All non-decorative images must have descriptive `alt` text (WCAG 1.1.1).
Decorative images must have `alt=""`.

The current application contains no images. If any are added during dark mode
implementation (e.g. a sun/moon icon for the toggle), apply this rule.

---

## 6. Dark mode toggle (added by diff-analyst)

Once `diff-analyst` adds the dark mode toggle button, verify:

- [ ] The toggle button has an accessible label that reflects the *current* mode:
  `aria-label="Switch to dark mode"` / `aria-label="Switch to light mode"`
- [ ] The toggle is keyboard-reachable
- [ ] The toggled state is communicated — use `aria-pressed` if implemented as a toggle button

---

## Reporting

For each item checked, record:
- **Pass** — requirement met as-is
- **Fixed** — requirement was not met; describe what was changed
- **N/A** — not applicable to the current state of the app

Include this report as part of the Bob task session evidence.
