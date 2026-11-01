import { formatTime, timeParts } from "shared/lib/formatTime";

describe("formatTime", () => {
  it("formats seconds as HH:MM:SS", () => {
    expect(formatTime(3661)).toBe("01:01:01");
    expect(formatTime(0)).toBe("00:00:00");
  });

  it("clamps negative values", () => {
    expect(formatTime(-5)).toBe("00:00:00");
  });
});

describe("timeParts", () => {
  it("splits into padded parts", () => {
    expect(timeParts(3723)).toEqual({ h: "01", m: "02", sec: "03" });
  });
});
