# Shell_for_Bob_Break — UI Source Files

These are the original design/prototype files used to build the Bob Break React integration.

| File | Description |
|---|---|
| `bob-break-shell.html` | Full standalone HTML shell — the original working demo with vanilla JS. Open in Chrome/Edge. |
| `bob-break-raw.css` | Raw CSS source (IBM Carbon tokens, Tailwind imports). Used as design reference for `src/styles/bob-break.css`. |
| `page.tsx` | Original Next.js page component (shadcn/ui Switch + lucide-react). Ported to `src/components/BobBreak.tsx`. |

## How they were integrated

```
bob-break-shell.html  ──► src/hooks/useBobBreak.ts   (all JS logic → React state)
                      ──► src/components/BobBreak.tsx (HTML structure → JSX)
bob-break-raw.css     ──► src/styles/bob-break.css   (CSS adapted, no Tailwind)
page.tsx              ──► src/components/BobBreak.tsx (component merged in)
```
