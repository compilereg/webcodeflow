import { useLayoutEffect, useRef } from "react";

const MAX_REM = 1.85;
const MIN_REM = 0.85;
const STEP_REM = 0.05;

/**
 * Sidebar title: shrink a single long word to fit one line;
 * soft-wrap multi-word names.
 */
export function SidebarDisplayName({ name }: { name: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const trimmed = name.trim() || "Team";
  const isSingleWord = !/\s/.test(trimmed);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !isSingleWord) {
      if (el) el.style.fontSize = "";
      return;
    }

    const fit = () => {
      let size = MAX_REM;
      el.style.fontSize = `${size}rem`;
      while (size > MIN_REM && el.scrollWidth > el.clientWidth + 1) {
        size = Math.round((size - STEP_REM) * 100) / 100;
        el.style.fontSize = `${size}rem`;
      }
    };

    fit();

    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [trimmed, isSingleWord]);

  return (
    <h2
      ref={ref}
      data-tour="home-team-name"
      title={trimmed}
      className={
        isSingleWord
          ? "min-w-0 flex-1 overflow-hidden whitespace-nowrap text-[1.5rem] font-extrabold leading-none tracking-tight text-foreground sm:text-[1.85rem]"
          : "min-w-0 flex-1 break-words text-[1.5rem] font-extrabold leading-tight tracking-tight text-foreground sm:text-[1.85rem]"
      }
    >
      {trimmed}
    </h2>
  );
}
