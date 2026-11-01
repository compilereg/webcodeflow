import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { PrivateRoute, PublicRoute, AuthCatchAll } from "app/RouteGuards";
import { vi } from "vitest";

function renderWithRoutes({ sessionOk }: { sessionOk: boolean }) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: sessionOk,
    status: sessionOk ? 200 : 401,
    text: async () =>
      JSON.stringify(
        sessionOk
          ? { authenticated: true, message: "Session is valid." }
          : { authenticated: false, message: "Not logged in" }
      ),
  });

  return render(
    <MemoryRouter initialEntries={["/home"]}>
      <Routes>
        <Route path="/" element={<div>Login Page</div>} />
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <div>Home Page</div>
            </PrivateRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("PrivateRoute", () => {
  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("redirects unauthenticated users to login", async () => {
    renderWithRoutes({ sessionOk: false });

    await waitFor(() => {
      expect(screen.getByText("Login Page")).toBeInTheDocument();
    });
  });

  it("renders children when authenticated", async () => {
    renderWithRoutes({ sessionOk: true });

    await waitFor(() => {
      expect(screen.getByText("Home Page")).toBeInTheDocument();
    });
  });
});

describe("PublicRoute", () => {
  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("redirects authenticated users to home", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({ authenticated: true, message: "Session is valid." }),
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route
            path="/"
            element={
              <PublicRoute>
                <div>Login Page</div>
              </PublicRoute>
            }
          />
          <Route path="/home" element={<div>Home Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Home Page")).toBeInTheDocument();
    });
  });
});

describe("AuthCatchAll", () => {
  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  function renderCatchAll({ sessionOk }: { sessionOk: boolean }) {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: sessionOk,
      status: sessionOk ? 200 : 401,
      text: async () =>
        JSON.stringify(
          sessionOk
            ? { authenticated: true, message: "Session is valid." }
            : { authenticated: false, message: "Not logged in" }
        ),
    });

    return render(
      <MemoryRouter initialEntries={["/unknown-path"]}>
        <Routes>
          <Route path="/" element={<div>Login Page</div>} />
          <Route path="/home" element={<div>Home Page</div>} />
          <Route path="*" element={<AuthCatchAll />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it("sends authenticated users to home", async () => {
    renderCatchAll({ sessionOk: true });
    await waitFor(() => {
      expect(screen.getByText("Home Page")).toBeInTheDocument();
    });
  });

  it("sends unauthenticated users to login", async () => {
    renderCatchAll({ sessionOk: false });
    await waitFor(() => {
      expect(screen.getByText("Login Page")).toBeInTheDocument();
    });
  });
});
