import { describe, expect, it } from "vitest";
import {
  CONTEST_LOGOS,
  DEFAULT_CONTEST_LOGOS,
  contestAsset,
  resolveContestLogos,
} from "../contestLogos";

describe("resolveContestLogos", () => {
  it("picks Jordan logos from a Jordan title", () => {
    expect(
      resolveContestLogos("Jordan Collegiate Programming Contest 2026")
    ).toEqual(CONTEST_LOGOS.jordan);
  });

  it("picks Jordan logos when the first word is Jordanian", () => {
    expect(
      resolveContestLogos("Jordanian Collegiate Programming Contest")
    ).toEqual(CONTEST_LOGOS.jordan);
  });

  it("picks Egyptian logos from an Egyptian title", () => {
    expect(
      resolveContestLogos("Egyptian Collegiate Programming Contest (ECPC)")
    ).toEqual(CONTEST_LOGOS.egyptian);
  });

  it("picks Qatar logos from a Qatar title", () => {
    expect(
      resolveContestLogos("Qatar Collegiate Programming Contest")
    ).toEqual(CONTEST_LOGOS.qatar);
  });

  it("picks Lebanese logos from a Lebanese title", () => {
    expect(
      resolveContestLogos("Lebanese Collegiate Programming Contest")
    ).toEqual(CONTEST_LOGOS.lebanese);
  });

  it("falls back when the title is missing or unknown", () => {
    expect(resolveContestLogos(null)).toEqual(DEFAULT_CONTEST_LOGOS);
    expect(resolveContestLogos("")).toEqual(DEFAULT_CONTEST_LOGOS);
    expect(resolveContestLogos("ACPC Finals")).toEqual(DEFAULT_CONTEST_LOGOS);
  });
});

describe("contestAsset", () => {
  it("returns light and dark paths", () => {
    const logos = CONTEST_LOGOS.jordan;
    expect(contestAsset(logos, "logo", "light")).toBe(
      "/contests_logos/jordan/logo.png"
    );
    expect(contestAsset(logos, "logo", "dark")).toBe(
      "/contests_logos/jordan/logo-dark.png"
    );
    expect(contestAsset(logos, "icon", "dark")).toBe(
      "/contests_logos/jordan/icon-dark.png"
    );
  });
});

