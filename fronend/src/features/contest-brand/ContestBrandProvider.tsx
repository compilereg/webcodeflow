import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useTheme } from "features/theme";
import { fetchContestInfo } from "shared/api/contestInfoApi";
import {
  contestAsset,
  DEFAULT_CONTEST_LOGOS,
  resolveContestLogos,
  type ContestLogoSet,
} from "shared/config/contestLogos";
import { setActiveContestBrand } from "./activeBrand";

type ContestBrandValue = {
  contestTitle: string | null;
  logos: ContestLogoSet;
  /** True until the first contestinfo attempt finishes. */
  loading: boolean;
};

const ContestBrandContext = createContext<ContestBrandValue>({
  contestTitle: null,
  logos: DEFAULT_CONTEST_LOGOS,
  loading: true,
});

function applyFavicon(iconSrc: string) {
  if (typeof document === "undefined") return;
  const link =
    document.querySelector<HTMLLinkElement>("link[rel='icon']") ||
    (() => {
      const created = document.createElement("link");
      created.rel = "icon";
      document.head.appendChild(created);
      return created;
    })();
  link.href = iconSrc;
}

export function ContestBrandProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const [contestTitle, setContestTitle] = useState<string | null>(null);
  const [logos, setLogos] = useState<ContestLogoSet>(DEFAULT_CONTEST_LOGOS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const title = await fetchContestInfo();
      if (cancelled) return;
      const next = resolveContestLogos(title);
      setContestTitle(title);
      setLogos(next);
      setActiveContestBrand(next);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setActiveContestBrand(logos);
    applyFavicon(contestAsset(logos, "icon", theme));
  }, [logos, theme]);

  return (
    <ContestBrandContext.Provider value={{ contestTitle, logos, loading }}>
      {children}
    </ContestBrandContext.Provider>
  );
}

export function useContestBrand(): ContestBrandValue {
  return useContext(ContestBrandContext);
}
