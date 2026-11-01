import { describe, expect, it } from "vitest";
import {
  getAllowedExtensionsForLanguage,
  getFileLanguageMismatchMessage,
  isFileExtensionAllowedForLanguage,
} from "../languageFileExtensions";

describe("languageFileExtensions", () => {
  it("maps common contest languages to extensions", () => {
    expect(getAllowedExtensionsForLanguage("Python")).toEqual([".py"]);
    expect(getAllowedExtensionsForLanguage("Java")).toEqual([".java"]);
    expect(getAllowedExtensionsForLanguage("C++")).toEqual([
      ".cpp",
      ".cc",
      ".cxx",
      ".c++",
    ]);
    expect(getAllowedExtensionsForLanguage("C")).toEqual([".c"]);
    expect(getAllowedExtensionsForLanguage("GNU C")).toEqual([".c"]);
    expect(getAllowedExtensionsForLanguage("Rust")).toEqual([".rs"]);
  });

  it("does not treat Objective-C as plain C", () => {
    expect(getAllowedExtensionsForLanguage("Objective-C")).toBeNull();
  });

  it("validates main file extension against selected language", () => {
    expect(isFileExtensionAllowedForLanguage("solution.py", "Python")).toBe(
      true
    );
    expect(isFileExtensionAllowedForLanguage("solution.cpp", "Python")).toBe(
      false
    );
    expect(isFileExtensionAllowedForLanguage("Main.java", "Java")).toBe(true);
    expect(isFileExtensionAllowedForLanguage("main.c", "C++")).toBe(false);
    expect(isFileExtensionAllowedForLanguage("main.cpp", "C++")).toBe(true);
  });

  it("returns a helpful mismatch message", () => {
    expect(getFileLanguageMismatchMessage("main.cpp", "Python")).toBe(
      "File type .cpp does not match Python. Expected .py."
    );
    expect(getFileLanguageMismatchMessage("main.py", "Python")).toBeNull();
  });
});
