import type { SchemaDefFile } from "@schemasset/schema";
import { relative, resolve } from "node:path";
import { glob } from "fast-glob";

export interface LoaderResult {
  pattern: string;
  files: string[];
  required: boolean;
}

export interface LoaderOptions {
  baseDir: string;
  files: SchemaDefFile[];
}

export async function loadFiles(options: LoaderOptions): Promise<LoaderResult[]> {
  const { baseDir, files } = options;

  const results = await Promise.all(
    files.map(async (file) => {
      const matches = await glob(file.pattern, {
        cwd: baseDir,
        absolute: false,
        dot: true,
      });

      return {
        pattern: file.pattern,
        files: matches.map(f => relative(baseDir, resolve(baseDir, f))),
        required: file.required,
      };
    }),
  );

  return results;
}
