# Dark mode

How light/dark theming works in this frontend, and how to avoid bright
“white hairline” borders on navy surfaces.

## Mechanism

1. **Class strategy** — `html` gets a `.dark` class. That is the only dark-mode switch.
2. **FOUC guard** — `index.html` runs a tiny inline script that reads `localStorage["wcf:theme"]` (falls back to legacy `ecpc:theme`) and applies `.dark` before paint.
3. **Runtime** — [`src/features/theme/ThemeProvider.tsx`](../src/features/theme/ThemeProvider.tsx) owns theme state, persists it, and toggles the class + `color-scheme`.
4. **Tokens** — [`src/index.css`](../src/index.css) defines semantic colors in `@theme` (light defaults). The `.dark { … }` block overrides the same CSS variables (`--color-surface`, `--color-border`, …).
5. **Utilities** — Components use semantic classes (`bg-surface`, `text-foreground`, `border-border`, `bg-brand`, …). They flip automatically when the variables change. Prefer this over scattering `dark:` on every node.

Tailwind v4 custom variant:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

## Rules of thumb (avoid white lines)

Dark mode hairlines usually come from **light border colors** that were never themed, or from **`ring-1` / `border`** that stay too bright against navy cards.

| Do | Don’t |
|----|--------|
| Use `border-border`, `ring-border`, or no outline at all | Hard-code `#eee`, `#e5e7eb`, `border-slate-200`, `border-white` |
| In dark tokens keep `--color-border` very soft (`rgb(255 255 255 / 0.04)`-ish) | Use opaque light gray borders in dark |
| Prefer card separation via `bg-surface` vs `bg-surface-raised` + soft shadow | Rely on thick/bright rings for every card |

## Adding a new surface

1. Use semantic background/text/border tokens from `index.css`.
2. If you need a divider, use `border-border` at low opacity (`/40`–`/60`), not a fixed light gray.
3. Check both themes before shipping — especially tables, selects, and cards.

## Toggle UX

Navbar sun/moon button calls `useTheme().toggleTheme()`. Storage key: `wcf:theme` (`"light"` | `"dark"`).
