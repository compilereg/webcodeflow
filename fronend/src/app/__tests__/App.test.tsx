import { render, screen, waitFor } from "@testing-library/react";
import App from "app";
import { vi } from "vitest";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status: 401,
    text: async () =>
      JSON.stringify({ authenticated: false, message: "Not logged in" }),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("renders login page when session is unauthenticated", async () => {
  render(<App />);

  await waitFor(() => {
    expect(
      screen.getByRole("heading", { name: /^login$/i })
    ).toBeInTheDocument();
  });
});
