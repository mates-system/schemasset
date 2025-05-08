import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { cwd } from "node:process";

export const DEFAULT_SCHEMA_FILES = [
  "schemasset.json",
  "schemasset.yaml",
  "schemasset.yml",
] as const;

export type SchemaFileExtension = typeof DEFAULT_SCHEMA_FILES[number];

export interface FinderOptions {
  cwd?: string;
  files?: SchemaFileExtension[];
}

export function findSchemaFile(options: FinderOptions = {}): string | undefined {
  const currentDir = options.cwd ?? cwd();
  const files = options.files ?? DEFAULT_SCHEMA_FILES;

  for (const file of files) {
    const path = resolve(currentDir, file);
    if (existsSync(path)) {
      return path;
    }
  }
  return undefined;
}
