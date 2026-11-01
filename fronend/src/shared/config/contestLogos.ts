/**
 * Contest branding assets under `public/contests_logos/<country>/`.
 * Resolve which set to use from the contest title’s first word
 * (e.g. "Jordan …" / "Egyptian …" from GET /api/main/contestinfo).
 *
 * Each country has light + dark raster pairs:
 *   logo.png / logo-dark.png
 *   icon.png / icon-dark.png
 */

export type ContestCountryId = "egyptian" | "jordan" | "qatar" | "lebanese";

export type ContestLogoSet = {
  id: ContestCountryId;
  /** Full contest mark — light UI. */
  logo: string;
  /** Full contest mark — dark UI / login. */
  logoDark: string;
  /** Compact mark — light UI. */
  icon: string;
  /** Compact mark — dark UI. */
  iconDark: string;
};

export type ContestLogoKind = "logo" | "icon";
export type ContestLogoMode = "light" | "dark";

function logosFor(id: ContestCountryId): ContestLogoSet {
  return {
    id,
    logo: `/contests_logos/${id}/logo.png`,
    logoDark: `/contests_logos/${id}/logo-dark.png`,
    icon: `/contests_logos/${id}/icon.png`,
    iconDark: `/contests_logos/${id}/icon-dark.png`,
  };
}

export const CONTEST_LOGOS: Record<ContestCountryId, ContestLogoSet> = {
  egyptian: logosFor("egyptian"),
  jordan: logosFor("jordan"),
  qatar: logosFor("qatar"),
  lebanese: logosFor("lebanese"),
};

/** Fallback when the title is missing or unrecognized. */
export const DEFAULT_CONTEST_LOGOS = CONTEST_LOGOS.egyptian;

export function contestTitleFirstWord(
  title: string | null | undefined
): string {
  return (title ?? "").trim().split(/\s+/)[0]?.toLowerCase() ?? "";
}

/**
 * Map contest title → logo set by the first word.
 * "Egyptian …" → egyptian, "Jordan …" / "Jordanian …" → jordan,
 * "Qatar …" → qatar, "Lebanese …" / "Lebanon …" → lebanese.
 */
export function resolveContestLogos(
  title: string | null | undefined
): ContestLogoSet {
  const first = contestTitleFirstWord(title);
  if (first.startsWith("egypt")) return CONTEST_LOGOS.egyptian;
  if (first.startsWith("jordan")) return CONTEST_LOGOS.jordan;
  if (first.startsWith("qatar")) return CONTEST_LOGOS.qatar;
  if (first.startsWith("leban")) return CONTEST_LOGOS.lebanese;
  return DEFAULT_CONTEST_LOGOS;
}

/** Pick light or dark asset for the requested kind. */
export function contestAsset(
  logos: ContestLogoSet,
  kind: ContestLogoKind,
  mode: ContestLogoMode
): string {
  if (kind === "logo") {
    return mode === "dark" ? logos.logoDark : logos.logo;
  }
  return mode === "dark" ? logos.iconDark : logos.icon;
}
