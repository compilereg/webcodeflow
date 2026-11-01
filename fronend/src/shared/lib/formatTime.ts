/** Format seconds as HH:MM:SS (non-negative). */
export function formatTime(seconds: number | string | null | undefined): string {
  const s = Math.max(0, Number(seconds || 0));
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

/** Split seconds into zero-padded hour/minute/second parts. */
export function timeParts(seconds: number | string | null | undefined): {
  h: string;
  m: string;
  sec: string;
} {
  const s = Math.max(0, Number(seconds || 0));
  return {
    h: String(Math.floor(s / 3600)).padStart(2, "0"),
    m: String(Math.floor((s % 3600) / 60)).padStart(2, "0"),
    sec: String(s % 60).padStart(2, "0"),
  };
}
