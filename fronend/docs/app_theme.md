# App theme

Visual language for the WCF (Web Code Flow) team contest frontend. Pair with [`app_colors.md`](./app_colors.md) and [`dark-mode.md`](./dark-mode.md).

## Product feel

- **Contest ops UI** inside the app: calm, dense, readable — light by default with a true dark mode.
- **Login / gate** is a separate **branded dark** composition: navy + brand blue accents — one full-viewport story, not a dashboard.

## Typography

| Role | Stack | Notes |
|------|--------|------|
| UI | `font-sans` (`Segoe UI` / system) | Controllers, tables, forms |
| Code / times | `font-mono` (`JetBrains Mono`) | Clock digits, IDs |
| Login display | Same sans, heavy weight | Gold titles; avoid Inter/Roboto as the “designed” look |

Hierarchy: brand/logo first on marketing surfaces; page titles should not overpower the product mark.

## Layout principles

1. **One job per section** — one headline, short support line, then the interaction.
2. **Pinned contest chrome** — Navbar + sticky sidebar + stats row via `ContestLayout`.
3. **Cards only when they contain interaction** — prefer surface contrast + soft shadow over nested bordered boxes.
4. **Tables** may scroll horizontally on small screens; do not crush five columns into unreadability.
5. **Login** — split composition: full-bleed hero left, form column right; stack on narrow viewports with form primary.

## Motion

Use sparingly for presence:

- Login hero reveal (curtain / fade-in) once on load.
- Toast fade-out (~7s).
- Clock / progress width transitions.

Avoid decorative bounce, glow spam, or perpetual animations in contest pages.

## Components patterns

| Pattern | Guidance |
|---------|----------|
| Primary pill | `rounded-full` + `bg-brand` (contest + login) |
| Filters / pagination | Circular controls, soft muted fill |
| Status badges | Muted fill + border tint by status token |
| Toasts | Solid muted fill by kind (`judgment` / `clarification` / `session`), top-right / mobile below nav |
| Inputs | `rounded-xl` / `rounded-2xl`, `bg-surface-muted`, focus `border-brand` |

## Login theme (gate)

- **Atmosphere:** dark navy + hero art (`/login_hero.jpg`), subtle blue edge light.
- **Card:** glass (`backdrop-blur`, translucent raised surface), rounded ~1.25rem.
- **CTA:** brand blue gradient button — highest emphasis on the form.
- **Contact Us:** full-width page footer — email + SysOps credit; not a competing card.

## Accessibility

- Keep contrast for brand-on-navy titles and white text on brand buttons.
- Don’t rely on color alone for judgment status — keep icon + label.
- Focus rings / outlines must remain visible on dark login fields.

## Related docs

- [`app_colors.md`](./app_colors.md) — token tables
- [`dark-mode.md`](./dark-mode.md) — class strategy & hairline borders
- [`architecture.md`](./architecture.md) — stack & feature layout
