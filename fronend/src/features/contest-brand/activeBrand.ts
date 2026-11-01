import {
  contestAsset,
  DEFAULT_CONTEST_LOGOS,
  type ContestLogoSet,
} from "shared/config/contestLogos";

/** Module mirror of the active brand for non-React callers (e.g. desktop notifications). */
let activeBrand: ContestLogoSet = DEFAULT_CONTEST_LOGOS;

export function setActiveContestBrand(brand: ContestLogoSet): void {
  activeBrand = brand;
}

export function getActiveContestBrand(): ContestLogoSet {
  return activeBrand;
}

/** Icon URL matching the current document theme class. */
export function getActiveContestIcon(): string {
  const dark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");
  return contestAsset(activeBrand, "icon", dark ? "dark" : "light");
}
