# App colors

Canonical color tokens for the WCF (Web Code Flow) team portal. **Source of truth:** [`src/index.css`](../src/index.css) (`@theme` + `.dark` overrides). Prefer semantic utilities (`bg-brand`, `text-foreground`, `border-border`, …) over raw hex in components.

## Brand & accent

| Token | Light | Dark | Usage |
|-------|-------|------|--------|
| `brand` | `#2563eb` | `#3b82f6` | Primary actions, active nav, links, login accents |
| `brand-hover` | `#1d4ed8` | `#60a5fa` | Hover on primary |
| `brand-muted` | `#dbeafe` | `#1e3a5f` | Soft brand surfaces (rank badge, chips) |

## Surfaces

| Token | Light | Dark | Usage |
|-------|-------|------|--------|
| `surface` | `#eef2f7` | `#0b1220` | App page background |
| `surface-raised` | `#ffffff` | `#111827` | Cards, panels |
| `surface-sidebar` | `#ffffff` | `#0f172a` | Sidebar / navy panels |
| `surface-muted` | `#f7f9fc` | `#1a2332` | Nested wells, table headers |
| `navbar` | `#ffffff` | `#0f172a` | Top bar |
| `dropzone` | `#f8fafc` | `#0f172a` | Upload / dashed fields |

## Borders

| Token | Light | Dark | Usage |
|-------|-------|------|--------|
| `border` | `#e6ebf2` | `rgb(255 255 255 / 0.035)` | Default dividers |
| `border-strong` | `#d5dde8` | `rgb(255 255 255 / 0.06)` | Stronger edges |

Keep dark borders **very soft** — see [`dark-mode.md`](./dark-mode.md).

## Text

| Token | Light | Dark | Usage |
|-------|-------|------|--------|
| `foreground` | `#0f1b2d` | `#f1f5f9` | Primary copy |
| `foreground-muted` | `#64748b` | `#94a3b8` | Secondary labels |
| `foreground-subtle` | `#94a3b8` | `#64748b` | Hints, timestamps |

## Status

| Token | Light | Dark | Usage |
|-------|-------|------|--------|
| `success` / `success-muted` | `#16a34a` / `#dcfce7` | `#22c55e` / `#14532d` | Solved, success toasts |
| `warning` / `warning-muted` | `#d97706` / `#fef3c7` | `#fbbf24` / `#78350f` | Pending, clarification accent |
| `danger` / `danger-muted` | `#dc2626` / `#fee2e2` | `#f87171` / `#7f1d1d` | Failed, logout, session toasts |

## Progress

| Token | Light | Dark |
|-------|-------|------|
| `progress-track` | `#e2e8f0` | `rgb(255 255 255 / 0.06)` |
| `progress-fill` | `#3b82f6` | `#3b82f6` |

## Login surface (marketing)

Login is always a **dark branded** composition (does not follow the app light/dark toggle). Mapped to tokens:

| Role | Token / value | Notes |
|------|----------------|-------|
| Hero / left plane | `/login_hero.jpg` | ACPC artwork (binary / problem-solver theme) |
| Form column | `surface-sidebar` dark `#0f172a` | Solid navy |
| Glass card | `surface-raised` @ ~55% + blur | Thin `brand` edge |
| Title | `brand` | “Login” |
| Fields | muted navy fill + `border-strong` | Focus ring uses `brand` |
| Primary button | `brand` → `brand-hover` gradient | White label text |
| Contact footer | muted foreground on navy | Email uses `brand` hover |

## Do not

- Hard-code light grays (`#eee`, `border-slate-200`) for contest chrome — use semantic tokens.
- Introduce purple / indigo “AI default” gradients or cream + terracotta stacks.
- Mix Bootstrap color utilities; the app is Tailwind-only.
