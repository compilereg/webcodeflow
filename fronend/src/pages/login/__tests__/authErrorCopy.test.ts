import { authErrorCopy } from "../authErrorCopy";

describe("authErrorCopy", () => {
  it("tells teams the WS block is 1 minute and to open a new window", () => {
    const copy = authErrorCopy("AUTH_WS_RATE_LIMIT");
    expect(copy.title).toBe("Temporarily blocked");
    expect(copy.detail).toMatch(/1 minute/i);
    expect(copy.detail).toMatch(/new window/i);
  });

  it("tells teams the login lockout is 5 minutes", () => {
    const copy = authErrorCopy("AUTH_RATE_LIMIT");
    expect(copy.title).toBe("Temporarily blocked");
    expect(copy.detail).toMatch(/5 minutes/i);
    expect(copy.detail).toMatch(/new window/i);
  });
});
