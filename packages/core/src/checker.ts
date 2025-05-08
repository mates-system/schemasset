import type { LoaderResult } from "./loader";

export interface Diagnostic {
  severity: "error" | "warning";
  message: string;
  pattern: string;
  code: DiagnosticCode;
  subdir?: string; // Added to indicate which subdirectory failed the check
}

export type DiagnosticCode =
  | "FILE_NOT_FOUND"
  | "PATTERN_NO_MATCH"
  | "PATTERN_EMPTY_MATCH"
  | "SUBDIR_MISSING_PATTERN"; // New error code

export interface CheckResult {
  diagnostics: Diagnostic[];
  hasError: boolean;
}

export interface CheckOptions {
  results: LoaderResult[];
}

export function check(options: CheckOptions): CheckResult {
  const { results } = options;
  const diagnostics: Diagnostic[] = [];

  const allSubDirs = new Set<string>();
  for (const result of results) {
    const { files } = result;
    for (const file of files) {
      const subdirMatch = file.match(/^([^/\\]+)[/\\]/);
      if (subdirMatch) {
        allSubDirs.add(subdirMatch[1]);
      }
    }
  }

  if (allSubDirs.size === 0) {
    for (const result of results) {
      const { pattern, files, optional } = result;

      if (files.length === 0 && !optional) {
        diagnostics.push({
          severity: "error",
          message: `Required pattern "${pattern}" did not match any files`,
          pattern,
          code: "FILE_NOT_FOUND",
        });
      }

      if (!optional && files.some(f => f.trim() === "")) {
        diagnostics.push({
          severity: "error",
          message: `Required pattern "${pattern}" matched empty or whitespace-only paths`,
          pattern,
          code: "PATTERN_EMPTY_MATCH",
        });
      }
    }
  }
  else {
    for (const result of results) {
      const { pattern, files, optional } = result;

      if (optional)
        continue;

      const subdirMatches = new Map<string, boolean>();

      for (const subdir of allSubDirs) {
        subdirMatches.set(subdir, false);
      }

      for (const file of files) {
        const subdirMatch = file.match(/^([^/\\]+)[/\\]/);
        if (subdirMatch) {
          subdirMatches.set(subdirMatch[1], true);
        }
      }

      for (const [subdir, hasMatch] of subdirMatches.entries()) {
        if (!hasMatch) {
          diagnostics.push({
            severity: "error",
            message: `Required pattern "${pattern}" is missing in subdirectory "${subdir}"`,
            pattern,
            code: "SUBDIR_MISSING_PATTERN",
            subdir,
          });
        }
      }

      if (files.length === 0) {
        diagnostics.push({
          severity: "error",
          message: `Required pattern "${pattern}" did not match any files`,
          pattern,
          code: "FILE_NOT_FOUND",
        });
      }

      if (files.some(f => f.trim() === "")) {
        diagnostics.push({
          severity: "error",
          message: `Required pattern "${pattern}" matched empty or whitespace-only paths`,
          pattern,
          code: "PATTERN_EMPTY_MATCH",
        });
      }
    }
  }

  return {
    diagnostics,
    hasError: diagnostics.some(d => d.severity === "error"),
  };
}
