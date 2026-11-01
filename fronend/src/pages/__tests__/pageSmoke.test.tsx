import { type ReactElement } from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ContestRealtimeStub } from "features/contest-realtime";
import { ThemeProvider } from "features/theme";
import { ContestLayout } from "shared/ui";
import Home from "pages/home";
import Clarifications from "pages/clarifications";
import Judgments from "pages/judgments";
import Scoreboard from "pages/scoreboard";
import Tutorials from "pages/tutorials";
import Login from "pages/login";
import { vi } from "vitest";

const wsValue = {
  socket: null,
  scoreboard: [
    {
      teamName: "Team Test",
      rank: 4,
      solved: 5,
      penalty: 100,
      problems: [],
    },
  ],
  timeLeft: 3600,
  isRunning: true,
  ready: true,
  hasInitialData: true,
  elapsedSeconds: 1800,
  contestLengthSeconds: 10800,
  notifications: [],
  hasUnread: false,
  setHasUnread: vi.fn(),
  setNotifications: vi.fn(),
};

function mockFetchOk(payload: unknown) {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(payload),
  };
}

function wrap(ui: ReactElement, path = "/home") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ThemeProvider>
        <ContestRealtimeStub value={wsValue}>
          <Routes>
            <Route path="/" element={ui} />
            <Route element={<ContestLayout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/clarifications" element={<Clarifications />} />
              <Route path="/judgments" element={<Judgments />} />
              <Route path="/scoreboard" element={<Scoreboard />} />
              <Route path="/tutorials" element={<Tutorials />} />
            </Route>
          </Routes>
        </ContestRealtimeStub>
      </ThemeProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  sessionStorage.setItem("username", "teamtest");
  sessionStorage.setItem("displayName", "Team Test");
  sessionStorage.setItem("teamName", "Team Test");
  sessionStorage.setItem("csrfToken", "csrf");
  document.documentElement.classList.remove("dark");
  globalThis.fetch = vi.fn().mockImplementation((url: string) => {
    if (String(url).includes("listProblem")) {
      return Promise.resolve(
        mockFetchOk([{ name: "Two Sum", alphabte: "A", isDeleted: false }])
      );
    }
    if (String(url).includes("listlanguages")) {
      return Promise.resolve(
        mockFetchOk([{ languageName: "Java", title: "javac" }])
      );
    }
    if (String(url).includes("listClarification")) {
      return Promise.resolve(mockFetchOk([]));
    }
    if (String(url).includes("listSubmitRuns")) {
      return Promise.resolve(mockFetchOk([]));
    }
    if (String(url).includes("getrank")) {
      return Promise.resolve(mockFetchOk({ teamName: "Team Test", teamRank: 4 }));
    }
    if (String(url).includes("scoreboard")) {
      return Promise.resolve(mockFetchOk(wsValue.scoreboard));
    }
    return Promise.resolve(mockFetchOk({}));
  });
});

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  document.documentElement.classList.remove("dark");
  vi.restoreAllMocks();
});

test("Login smoke", () => {
  wrap(<Login />, "/");
  expect(
    screen.getByRole("heading", { name: /^login$/i })
  ).toBeInTheDocument();
});

test("Home smoke shows quick submit and uses display name as value", async () => {
  wrap(<Home />, "/home");
  expect(
    screen.getByRole("heading", { name: /Quick Submit/i })
  ).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.getByRole("option", { name: "Two Sum" })).toBeInTheDocument();
  });
  // wwfapi ProblemResolver matches IProblem.getName(), not shortName
  expect(screen.getByRole("option", { name: "Two Sum" })).toHaveValue(
    "Two Sum"
  );
  expect(screen.getByText("#4")).toBeInTheDocument();
});

test("Home theme toggle applies dark class", async () => {
  wrap(<Home />, "/home");
  const toggle = screen.getByRole("button", { name: /switch to dark mode/i });
  fireEvent.click(toggle);
  expect(document.documentElement.classList.contains("dark")).toBe(true);
  expect(localStorage.getItem("wcf:theme")).toBe("dark");
});

test("Clarifications smoke uses display name option values", async () => {
  wrap(<Clarifications />, "/clarifications");
  expect(screen.getByText(/Write Clarification/i)).toBeInTheDocument();

  const typeSelect = screen.getByDisplayValue("Select Type");
  fireEvent.change(typeSelect, { target: { value: "question" } });

  await waitFor(() => {
    expect(screen.getByRole("option", { name: "Two Sum" })).toBeInTheDocument();
  });
  expect(screen.getByRole("option", { name: "Two Sum" })).toHaveValue(
    "Two Sum"
  );
});

test("Judgments smoke", async () => {
  wrap(<Judgments />, "/judgments");
  expect(screen.getByText(/Submission Judgments/i)).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.getByText(/No submissions yet/i)).toBeInTheDocument();
  });
});

test("Scoreboard smoke", async () => {
  wrap(<Scoreboard />, "/scoreboard");
  expect(screen.getByText(/Live Standings/i)).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.getAllByText("#4").length).toBeGreaterThan(0);
  });
});

test("Tutorials smoke shows five replay tiles", () => {
  wrap(<Tutorials />, "/tutorials");
  expect(
    screen.getByRole("heading", { name: /^tutorials$/i })
  ).toBeInTheDocument();
  for (const title of [
    "General",
    "Submission",
    "Clarifications",
    "Judgments",
    "Scoreboard",
  ]) {
    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
  }
});
