import { exit } from "node:process";
import { check as checkFiles, loadFiles, parse } from "@schemasset/core";
import { defineCommand } from "citty";
import consola from "consola";

export const check = defineCommand({
  meta: {
    name: "check",
    description: "Check assets based on schema definitions",
  },
  args: {
    config: {
      type: "string",
      description: "Path to the schema config file",
      alias: "c",
    },
    cwd: {
      type: "string",
      description: "Working directory",
      alias: "d",
    },
  },
  async run({ args }) {
    try {
      // Parse schema file
      const schema = parse({
        schemaFile: args.config,
      });

      // Get first schema if array
      const targetSchema = Array.isArray(schema.schema) ? schema.schema[0] : schema.schema;

      // Load files based on schema patterns
      const results = await loadFiles({
        baseDir: targetSchema.targetDir,
        files: targetSchema.files,
      });

      // Check files
      const { diagnostics, hasError } = checkFiles({ results });

      // Output diagnostics
      for (const diagnostic of diagnostics) {
        const logger = diagnostic.severity === "error" ? consola.error : consola.warn;
        logger(`[${diagnostic.code}] ${diagnostic.message}`);
      }

      // Exit with appropriate code
      if (hasError) {
        exit(1);
      }
    }
    catch (error) {
      consola.error(error instanceof Error ? error.message : String(error));
      exit(1);
    }
  },
});
