/**
 * Single source of truth for app colors.
 * Edit values here; `installThemeStyles()` pushes them into CSS variables
 * that Tailwind utilities (`bg-brand`, `text-success`, …) consume.
 */
export type ThemeMode = "light" | "dark";

export type ThemePalette = {
  brand: string;
  brandHover: string;
  brandMuted: string;

  surface: string;
  surfaceRaised: string;
  surfaceSidebar: string;
  surfaceMuted: string;
  border: string;
  borderStrong: string;

  foreground: string;
  foregroundMuted: string;
  foregroundSubtle: string;

  success: string;
  successMuted: string;
  warning: string;
  warningMuted: string;
  danger: string;
  dangerMuted: string;

  accentGold: string;
  accentGoldDeep: string;
  accentGoldBright: string;

  navbar: string;
  dropzone: string;
  progressTrack: string;
  progressFill: string;

  /** Scoreboard cell: first team to solve a problem */
  scoreboardFirstSolve: string;
  scoreboardFirstSolveFg: string;
  /** Scoreboard cell: solved (not first) */
  scoreboardSolved: string;
  scoreboardSolvedFg: string;
  /** Scoreboard cell: unjudged submission(s) */
  scoreboardPending: string;
  scoreboardPendingFg: string;
};

/** CSS custom property names (without `--`) for each palette key. */
export const themeCssVarNames = {
  brand: "wcf-brand",
  brandHover: "wcf-brand-hover",
  brandMuted: "wcf-brand-muted",
  surface: "wcf-surface",
  surfaceRaised: "wcf-surface-raised",
  surfaceSidebar: "wcf-surface-sidebar",
  surfaceMuted: "wcf-surface-muted",
  border: "wcf-border",
  borderStrong: "wcf-border-strong",
  foreground: "wcf-foreground",
  foregroundMuted: "wcf-foreground-muted",
  foregroundSubtle: "wcf-foreground-subtle",
  success: "wcf-success",
  successMuted: "wcf-success-muted",
  warning: "wcf-warning",
  warningMuted: "wcf-warning-muted",
  danger: "wcf-danger",
  dangerMuted: "wcf-danger-muted",
  accentGold: "wcf-accent-gold",
  accentGoldDeep: "wcf-accent-gold-deep",
  accentGoldBright: "wcf-accent-gold-bright",
  navbar: "wcf-navbar",
  dropzone: "wcf-dropzone",
  progressTrack: "wcf-progress-track",
  progressFill: "wcf-progress-fill",
  scoreboardFirstSolve: "wcf-scoreboard-first-solve",
  scoreboardFirstSolveFg: "wcf-scoreboard-first-solve-fg",
  scoreboardSolved: "wcf-scoreboard-solved",
  scoreboardSolvedFg: "wcf-scoreboard-solved-fg",
  scoreboardPending: "wcf-scoreboard-pending",
  scoreboardPendingFg: "wcf-scoreboard-pending-fg",
} as const satisfies Record<keyof ThemePalette, string>;

export const lightTheme: ThemePalette = {
  brand: "#2563eb",
  brandHover: "#1d4ed8",
  brandMuted: "#dbeafe",

  surface: "#eef2f7",
  surfaceRaised: "#ffffff",
  surfaceSidebar: "#ffffff",
  surfaceMuted: "#f7f9fc",
  border: "#e6ebf2",
  borderStrong: "#d5dde8",

  foreground: "#0f1b2d",
  foregroundMuted: "#64748b",
  foregroundSubtle: "#94a3b8",

  success: "#16a34a",
  successMuted: "#dcfce7",
  warning: "#d97706",
  warningMuted: "#fef3c7",
  danger: "#dc2626",
  dangerMuted: "#fee2e2",

  accentGold: "#c9a227",
  accentGoldDeep: "#a8841a",
  accentGoldBright: "#e8c547",

  navbar: "#ffffff",
  dropzone: "#f8fafc",
  progressTrack: "#e2e8f0",
  progressFill: "#3b82f6",

  scoreboardFirstSolve: "#166534",
  scoreboardFirstSolveFg: "#ffffff",
  scoreboardSolved: "#bbf7d0",
  scoreboardSolvedFg: "#14532d",
  scoreboardPending: "#e9d5ff",
  scoreboardPendingFg: "#6b21a8",
};

export const darkTheme: ThemePalette = {
  brand: "#3b82f6",
  brandHover: "#60a5fa",
  brandMuted: "#1e3a5f",

  surface: "#0b1220",
  surfaceRaised: "#111827",
  surfaceSidebar: "#0f172a",
  surfaceMuted: "#1a2332",
  border: "rgb(255 255 255 / 0.035)",
  borderStrong: "rgb(255 255 255 / 0.06)",

  foreground: "#f1f5f9",
  foregroundMuted: "#94a3b8",
  foregroundSubtle: "#64748b",

  success: "#22c55e",
  successMuted: "#14532d",
  warning: "#fbbf24",
  warningMuted: "#78350f",
  danger: "#f87171",
  dangerMuted: "#7f1d1d",

  accentGold: "#e8c547",
  accentGoldDeep: "#c9a227",
  accentGoldBright: "#f5d76e",

  navbar: "#0f172a",
  dropzone: "#0f172a",
  progressTrack: "rgb(255 255 255 / 0.06)",
  progressFill: "#3b82f6",

  scoreboardFirstSolve: "#14532d",
  scoreboardFirstSolveFg: "#ecfdf5",
  scoreboardSolved: "#bbf7d0",
  scoreboardSolvedFg: "#14532d",
  scoreboardPending: "#4c1d95",
  scoreboardPendingFg: "#e9d5ff",
};

export const themes: Record<ThemeMode, ThemePalette> = {
  light: lightTheme,
  dark: darkTheme,
};

/** Tailwind class names for scoreboard problem cells. */
export const scoreboardCellClasses = {
  firstSolve:
    "bg-scoreboard-first-solve text-scoreboard-first-solve-fg",
  solved: "bg-scoreboard-solved text-scoreboard-solved-fg",
  pending: "bg-scoreboard-pending text-scoreboard-pending-fg",
  failed: "bg-danger-muted text-danger",
  empty: "bg-surface-muted/70 text-foreground-subtle",
} as const;

function paletteToCssDeclarations(palette: ThemePalette): string {
  return (Object.keys(themeCssVarNames) as (keyof ThemePalette)[])
    .map((key) => `  --${themeCssVarNames[key]}: ${palette[key]};`)
    .join("\n");
}

/**
 * Injects `:root` / `.dark` CSS variables from {@link themes}.
 * Safe to call multiple times (replaces the previous style tag).
 */
export function installThemeStyles(): void {
  if (typeof document === "undefined") return;

  const css = [
    `:root {\n${paletteToCssDeclarations(lightTheme)}\n}`,
    `.dark {\n${paletteToCssDeclarations(darkTheme)}\n}`,
  ].join("\n\n");

  let el = document.getElementById("wcf-theme-vars") as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = "wcf-theme-vars";
    document.head.appendChild(el);
  }
  el.textContent = css;
}
