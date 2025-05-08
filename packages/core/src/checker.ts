import type { LoaderResult } from "./loader";

export interface Diagnostic {
  severity: "error" | "warning";
  message: string;
  pattern: string;
  code: DiagnosticCode;
}

export type DiagnosticCode =
  | "FILE_NOT_FOUND"
  | "PATTERN_NO_MATCH"
  | "PATTERN_EMPTY_MATCH";

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

  for (const result of results) {
    const { pattern, files, required } = result;

    // Check if files were found
    if (files.length === 0) {
      const severity = required ? "error" : "warning";
      const code = required ? "FILE_NOT_FOUND" : "PATTERN_NO_MATCH";

      diagnostics.push({
        severity,
        message: required
          ? `Required pattern "${pattern}" did not match any files`
          : `Pattern "${pattern}" did not match any files`,
        pattern,
        code,
      });
      continue;
    }

    // Check if pattern matched empty set when files are required
    if (required && files.some(f => f.trim() === "")) {
      diagnostics.push({
        severity: "error",
        message: `Required pattern "${pattern}" matched empty or whitespace-only paths`,
        pattern,
        code: "PATTERN_EMPTY_MATCH",
      });
    }
  }

  return {
    diagnostics,
    hasError: diagnostics.some(d => d.severity === "error"),
  };
}
