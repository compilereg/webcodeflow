const LANGUAGE_EXTENSIONS: Record<string, readonly string[]> = {
  c: [".c"],
  "c++": [".cpp", ".cc", ".cxx", ".c++"],
  cpp: [".cpp", ".cc", ".cxx", ".c++"],
  java: [".java"],
  python: [".py"],
  rust: [".rs"],
  kotlin: [".kt", ".kts"],
  go: [".go"],
  golang: [".go"],
  "c#": [".cs"],
  csharp: [".cs"],
  pascal: [".pas", ".pp", ".p"],
  ruby: [".rb"],
  scala: [".scala"],
  haskell: [".hs"],
  lua: [".lua"],
  perl: [".pl", ".pm"],
  swift: [".swift"],
  javascript: [".js"],
  typescript: [".ts"],
};

function normalizeLanguageKey(languageName: string): string {
  return languageName.trim().toLowerCase();
}

export function getFileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex <= 0 || dotIndex === fileName.length - 1) {
    return "";
  }
  return fileName.slice(dotIndex).toLowerCase();
}

export function getAllowedExtensionsForLanguage(
  languageName: string
): string[] | null {
  const key = normalizeLanguageKey(languageName);
  if (!key) return null;

  const direct = LANGUAGE_EXTENSIONS[key];
  if (direct) return [...direct];

  if (/c\+\+|cpp|c plus plus/.test(key)) {
    return [...LANGUAGE_EXTENSIONS["c++"]];
  }
  // Exact C only — avoid matching "Objective-C", "C#", etc.
  if (key === "c" || /^(gnu\s+)?c$/.test(key) || key === "ansi c") {
    return [...LANGUAGE_EXTENSIONS.c];
  }
  if (key.includes("python")) return [...LANGUAGE_EXTENSIONS.python];
  if (key.includes("java") && !key.includes("javascript")) {
    return [...LANGUAGE_EXTENSIONS.java];
  }
  if (key.includes("rust")) return [...LANGUAGE_EXTENSIONS.rust];
  if (key.includes("kotlin")) return [...LANGUAGE_EXTENSIONS.kotlin];
  if (key === "go" || key.includes("golang")) return [...LANGUAGE_EXTENSIONS.go];
  if (key.includes("csharp") || key.includes("c#")) {
    return [...LANGUAGE_EXTENSIONS["c#"]];
  }
  if (key.includes("pascal")) return [...LANGUAGE_EXTENSIONS.pascal];
  if (key.includes("ruby")) return [...LANGUAGE_EXTENSIONS.ruby];
  if (key.includes("scala")) return [...LANGUAGE_EXTENSIONS.scala];
  if (key.includes("haskell")) return [...LANGUAGE_EXTENSIONS.haskell];
  if (key.includes("lua")) return [...LANGUAGE_EXTENSIONS.lua];
  if (key.includes("perl")) return [...LANGUAGE_EXTENSIONS.perl];
  if (key.includes("swift")) return [...LANGUAGE_EXTENSIONS.swift];
  if (key.includes("typescript")) return [...LANGUAGE_EXTENSIONS.typescript];
  if (key.includes("javascript")) return [...LANGUAGE_EXTENSIONS.javascript];

  return null;
}

export function formatAllowedExtensions(extensions: string[]): string {
  return extensions.join(", ");
}

export function isFileExtensionAllowedForLanguage(
  fileName: string,
  languageName: string
): boolean {
  const allowed = getAllowedExtensionsForLanguage(languageName);
  if (!allowed) return true;

  const extension = getFileExtension(fileName);
  if (!extension) return false;

  return allowed.includes(extension);
}

export function getFileLanguageMismatchMessage(
  fileName: string,
  languageName: string
): string | null {
  const allowed = getAllowedExtensionsForLanguage(languageName);
  if (!allowed) return null;

  if (isFileExtensionAllowedForLanguage(fileName, languageName)) {
    return null;
  }

  const extension = getFileExtension(fileName);
  const expected = formatAllowedExtensions(allowed);

  if (!extension) {
    return `The selected file has no extension. For ${languageName}, use ${expected}.`;
  }

  return `File type ${extension} does not match ${languageName}. Expected ${expected}.`;
}
