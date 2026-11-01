import { describe, expect, it } from "vitest";
import {
  applyAnswerToPanes,
  applyClarificationAnswer,
  filterTeamClarifications,
  mergePendingClarifications,
  partitionClarifications,
  sortClarifications,
} from "./clarificationModel";

describe("partitionClarifications", () => {
  it("puts General/Generic in the general pane and problem questions in team", () => {
    const { generic, team } = partitionClarifications([
      { ProblemName: "General", Question: "Hours?" },
      { ProblemName: "generic", Question: "Also hours?" },
      { ProblemName: "A. Wired Mall", Question: "Is n=1 allowed?" },
    ]);
    expect(generic).toHaveLength(2);
    expect(team).toHaveLength(1);
    expect(team[0].ProblemName).toBe("A. Wired Mall");
  });

  it("treats unknown PC2 category names as general when the catalog is known", () => {
    const names = new Set(["A. Wired Mall"]);
    const { generic, team } = partitionClarifications(
      [
        { ProblemName: "Default", Question: "Hours?" },
        { ProblemName: "A. Wired Mall", Question: "Is n=1 allowed?" },
      ],
      names
    );
    expect(generic.map((c) => c.ProblemName)).toEqual(["Default"]);
    expect(team.map((c) => c.ProblemName)).toEqual(["A. Wired Mall"]);
  });
});

describe("team privacy", () => {
  it("keeps only clarifications owned by the authenticated login", () => {
    const result = filterTeamClarifications(
      [
        { teamname: "team01", Question: "Mine" },
        { teamname: "team02", Question: "Not mine" },
        {
          teamname: "team02",
          Question: "Broadcast",
          Status: "Broadcast",
        },
        { Question: "Unknown owner" },
      ],
      "TEAM01"
    );

    expect(result.map((c) => c.Question)).toEqual(["Mine", "Broadcast"]);
  });

  it("does not create a row from an unmatched WebSocket event", () => {
    const panes = applyAnswerToPanes([], [], {
      problem: "General",
      question: "Another team's question",
      answer: "Private answer",
      answered: true,
    });

    expect(panes).toEqual({ generic: [], team: [] });
  });

  it("adds an all-team broadcast from an unmatched WebSocket event", () => {
    const panes = applyAnswerToPanes([], [], {
      clarificationId: 12,
      clarificationTime: 500,
      teamname: "team02",
      problem: "A. Wired Mall",
      question: "Important correction",
      answer: "Use n <= 1000.",
      answered: true,
      broadcast: true,
    });

    expect(panes.generic).toEqual([
      {
        ClarificationId: 12,
        ClarificationTime: 500,
        teamname: "team02",
        ProblemName: "A. Wired Mall",
        Question: "Important correction",
        Answer: "Use n <= 1000.",
        Status: "Broadcast",
      },
    ]);
    expect(panes.team).toEqual([]);
  });

  it("moves the asker's row into broadcasts when sent to all", () => {
    const panes = applyAnswerToPanes(
      [],
      [
        {
          ClarificationId: 12,
          ProblemName: "A. Wired Mall",
          Question: "Important correction",
          Status: "New",
        },
      ],
      {
        clarificationId: 12,
        problem: "A. Wired Mall",
        question: "Important correction",
        answer: "Use n <= 1000.",
        broadcast: true,
      }
    );

    expect(panes.generic[0].Status).toBe("Broadcast");
    expect(panes.team).toEqual([]);
  });
});

describe("sortClarifications", () => {
  const rows = [
    { ClarificationId: 8, ClarificationTime: 120 },
    { ClarificationId: 10, ClarificationTime: 90 },
    { ClarificationId: 9, ClarificationTime: 120 },
  ];

  it("orders newest submission time first by default", () => {
    expect(
      sortClarifications(rows).map((c) => c.ClarificationId)
    ).toEqual([9, 8, 10]);
  });

  it("uses ID when contest times match", () => {
    expect(
      sortClarifications([
        { ClarificationId: 5, ClarificationTime: 100 },
        { ClarificationId: 12, ClarificationTime: 100 },
        { ClarificationId: 7, ClarificationTime: 100 },
      ]).map((c) => c.ClarificationId)
    ).toEqual([12, 7, 5]);
  });

  it("can order oldest submission time first", () => {
    expect(
      sortClarifications(rows, "ClarificationTime", "asc").map(
        (c) => c.ClarificationId
      )
    ).toEqual([10, 8, 9]);
  });
});

describe("mergePendingClarifications", () => {
  it("keeps optimistic question rows until the server list includes them", () => {
    const pending = {
      ProblemName: "A. Wired Mall",
      Question: "Is n=1 allowed?",
      Answer: "",
    };
    const merged = mergePendingClarifications([], [pending]);
    expect(merged).toEqual([pending]);

    const server = [
      {
        ClarificationId: 9,
        ProblemName: "A. Wired Mall",
        Question: "Is n=1 allowed?",
        Answer: "",
      },
    ];
    expect(mergePendingClarifications(server, [pending])).toEqual(server);
  });

  it("does not wipe a locally patched general answer if the list API is stale", () => {
    const previous = [
      {
        ClarificationId: 4,
        ProblemName: "General",
        Question: "Hours?",
        Answer: "Until 18:00",
        Status: "Answered",
      },
    ];
    const server = [
      {
        ClarificationId: 4,
        ProblemName: "General",
        Question: "Hours?",
        Answer: "",
        Status: "New",
      },
    ];
    const merged = mergePendingClarifications(server, previous);
    expect(merged[0].Answer).toBe("Until 18:00");
    expect(merged[0].Status).toBe("Answered");
  });
});

describe("applyClarificationAnswer", () => {
  it("fills the answer on a matching problem clarification", () => {
    const next = applyClarificationAnswer(
      [
        {
          ClarificationId: 9,
          ProblemName: "A. Wired Mall",
          Question: "Is n=1 allowed?",
          Answer: "",
          Status: "New",
        },
      ],
      {
        problem: "A. Wired Mall",
        question: "Is n=1 allowed?",
        answer: "Yes.",
        answered: true,
      }
    );
    expect(next.matched).toBe(true);
    expect(next.list[0].Answer).toBe("Yes.");
    expect(next.list[0].Status).toBe("Answered");
  });

  it("fills a general clarification even if PC2 uses a category name", () => {
    const names = new Set(["A. Wired Mall"]);
    const panes = applyAnswerToPanes(
      [
        {
          ClarificationId: 4,
          ProblemName: "General",
          Question: "Hours?",
          Answer: "",
          Status: "New",
        },
      ],
      [],
      {
        problem: "Default",
        question: "Hours?",
        answer: "Until 18:00",
        answered: true,
      },
      names
    );
    expect(panes.generic[0].Answer).toBe("Until 18:00");
    expect(panes.generic[0].Status).toBe("Answered");
    expect(panes.team).toHaveLength(0);
  });
});
