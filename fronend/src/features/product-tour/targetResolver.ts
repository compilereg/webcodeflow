/**
 * Resolves a tour step's target(s) to a single bounding rect in
 * viewport coordinates, or null if nothing currently matches.
 */

import type { TargetRect, TextTarget, TourStep } from "./types";

function isVisible(el: HTMLElement): boolean {
  return el.offsetParent !== null || el === document.body;
}

function queryCssElements(selectors: string | string[]): HTMLElement[] {
  const list = Array.isArray(selectors) ? selectors : [selectors];
  return list
    .flatMap((sel) => Array.from(document.querySelectorAll(sel)))
    .filter((el): el is HTMLElement => el instanceof HTMLElement)
    .filter(isVisible);
}

function queryTextElements({ root, text }: TextTarget): HTMLElement[] {
  const rootEl = document.querySelector(root);
  if (!rootEl) return [];

  return Array.from(rootEl.querySelectorAll("*"))
    .filter((el): el is HTMLElement => el instanceof HTMLElement)
    .filter((el) => {
      const ownText = Array.from(el.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent)
        .join("")
        .trim();
      return ownText === text;
    })
    .filter(isVisible);
}

function unionRect(elements: HTMLElement[]): TargetRect | null {
  if (elements.length === 0) return null;

  const rects = elements.map((el) => el.getBoundingClientRect());
  const top = Math.min(...rects.map((r) => r.top));
  const left = Math.min(...rects.map((r) => r.left));
  const right = Math.max(...rects.map((r) => r.right));
  const bottom = Math.max(...rects.map((r) => r.bottom));

  return {
    top,
    left,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
  };
}

/** Visible DOM nodes matching this step's target. */
export function resolveStepElements(step: TourStep): HTMLElement[] {
  if (step.selectorStrategy === "text") {
    return queryTextElements(step.target as TextTarget);
  }
  return queryCssElements(step.target as string | string[]);
}

export function resolveStepTarget(step: TourStep): TargetRect | null {
  return unionRect(resolveStepElements(step));
}

/**
 * Scroll the first matching target into view when it sits outside
 * (or near the edge of) the viewport. Safe to call repeatedly.
 */
export function scrollStepTargetIntoView(step: TourStep): void {
  const [el] = resolveStepElements(step);
  if (!el) return;

  const rect = el.getBoundingClientRect();
  const margin = 80;
  const fullyVisible =
    rect.top >= margin &&
    rect.bottom <= window.innerHeight - margin &&
    rect.left >= 0 &&
    rect.right <= window.innerWidth;

  if (fullyVisible) return;

  el.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "nearest",
  });
}
