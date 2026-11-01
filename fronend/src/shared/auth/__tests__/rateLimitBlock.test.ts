import {
  clearRateLimitBlock,
  formatRateLimitRemaining,
  getRateLimitBlock,
  LOGIN_LOCKOUT_MS,
  remainingRateLimitMs,
  setRateLimitBlock,
  WS_RATE_LIMIT_MS,
} from "../rateLimitBlock";

describe("rateLimitBlock", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("stores a 60s WS block matching ContestSocket.WINDOW_MS", () => {
    const before = Date.now();
    const block = setRateLimitBlock("ws");
    expect(block.kind).toBe("ws");
    expect(block.until).toBeGreaterThanOrEqual(before + WS_RATE_LIMIT_MS);
    expect(getRateLimitBlock()?.kind).toBe("ws");
    expect(remainingRateLimitMs()).toBeGreaterThan(50_000);
  });

  it("stores a 5 minute login block matching maincontroller.LOCK_TIME", () => {
    const block = setRateLimitBlock("login");
    expect(block.kind).toBe("login");
    expect(block.until - Date.now()).toBeGreaterThan(LOGIN_LOCKOUT_MS - 1000);
  });

  it("does not extend an active block of the same kind", () => {
    const first = setRateLimitBlock("ws");
    const second = setRateLimitBlock("ws");
    expect(second.until).toBe(first.until);
  });

  it("formats remaining time", () => {
    expect(formatRateLimitRemaining(5_000)).toBe("5s");
    expect(formatRateLimitRemaining(65_000)).toBe("1:05");
  });

  it("clears expired or invalid blocks", () => {
    sessionStorage.setItem(
      "wcf:rateLimitBlock",
      JSON.stringify({ kind: "ws", until: Date.now() - 1 })
    );
    expect(getRateLimitBlock()).toBeNull();
    clearRateLimitBlock();
    expect(getRateLimitBlock()).toBeNull();
  });
});
