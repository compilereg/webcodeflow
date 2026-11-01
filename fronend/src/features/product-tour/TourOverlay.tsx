import type { TargetRect } from "./types";

/**
 * Dark backdrop with a rectangular cutout over `rect`.
 * When the target is missing, dim the whole viewport (no cutout) so the
 * tooltip stays usable until the team presses Next / Skip.
 */
export default function TourOverlay({
  rect,
}: {
  rect: TargetRect | null;
}) {
  if (!rect) {
    return (
      <div className="acpc-tour-overlay" aria-hidden="true">
        <div
          className="acpc-tour-band"
          style={{ top: 0, left: 0, right: 0, bottom: 0 }}
        />
      </div>
    );
  }

  const pad = 6;
  const top = Math.max(rect.top - pad, 0);
  const left = Math.max(rect.left - pad, 0);
  const right = rect.right + pad;
  const bottom = rect.bottom + pad;

  return (
    <div className="acpc-tour-overlay" aria-hidden="true">
      <div
        className="acpc-tour-band"
        style={{ top: 0, left: 0, right: 0, height: top }}
      />
      <div
        className="acpc-tour-band"
        style={{ top: bottom, left: 0, right: 0, bottom: 0 }}
      />
      <div
        className="acpc-tour-band"
        style={{ top, left: 0, width: left, height: bottom - top }}
      />
      <div
        className="acpc-tour-band"
        style={{ top, left: right, right: 0, height: bottom - top }}
      />
      <div
        className="acpc-tour-spotlight-ring"
        style={{ top, left, width: right - left, height: bottom - top }}
      />
    </div>
  );
}
