import { useTheme } from "features/theme";
import {
  contestAsset,
  type ContestLogoKind,
  type ContestLogoMode,
} from "shared/config/contestLogos";
import { useContestBrand } from "./ContestBrandProvider";

/**
 * Theme-aware contest logo/icon URLs.
 * Pass `mode` to force a surface (login is always dark).
 */
export function useContestAssets(mode?: ContestLogoMode) {
  const { logos, contestTitle, loading } = useContestBrand();
  const { theme } = useTheme();
  const resolved: ContestLogoMode = mode ?? theme;

  const src = (kind: ContestLogoKind) =>
    contestAsset(logos, kind, resolved);

  return {
    contestTitle,
    loading,
    logos,
    mode: resolved,
    logoSrc: src("logo"),
    iconSrc: src("icon"),
  };
}
