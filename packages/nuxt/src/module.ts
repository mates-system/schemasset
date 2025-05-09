import type { CheckResult } from "@schemasset/core";
import type { SchemaDef } from "@schemasset/schema";

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

import { defineNuxtModule } from "@nuxt/kit";
import { check, loadFiles, parse } from "@schemasset/core";
import consola from "consola";

export interface ModuleOptions {
  /**
   * Schema configuration
   * - object: Inline schema definition
   */
  schema?: SchemaDef;

  /**
   * Schema configuration
   * - string: Path to the schema file
   */
  schemaPath?: string;

  /**
   * Whether to check assets during build
   */
  checkOnBuild?: boolean;

  /**
   * Build options
   */
  build?: {
    /**
     * Subdirectory to use
     */
    subdir?: string;

    /**
     * Output directory
     */
    outDir?: string;
  };

  /**
   * Whether to fail on error
   */
  failOnError?: boolean;
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: "@schemasset/nuxt",
    configKey: "schemasset",
    compatibility: {
      nuxt: "^3.0.0",
    },
  },
  defaults: {
    checkOnBuild: true,
    failOnError: true,
    build: {
      outDir: "assets",
    },
  },
  setup(options, nuxt) {
    consola.info("[@schemasset/nuxt] Setting up schema asset validation");

    if (options.checkOnBuild) {
      nuxt.hook("build:before", async () => {
        try {
          if (nuxt.options.dev) {
            await validateSchema();
          }
        }
        catch (error) {
          consola.error(`[@schemasset/nuxt] Error during schema validation: ${error instanceof Error ? error.message : String(error)}`);
          if (options.failOnError) {
            throw error;
          }
        }
      });

      // Handle asset processing during build
      nuxt.hook("nitro:build:before", async (nitro) => {
        try {
          if (!options.schema || !options.build?.subdir) {
            return;
          }

          const { schema, baseDir } = await validateSchema();
          if (!schema)
            return;

          // Generate
          const subdirPath = resolve(baseDir, options.build.subdir);
          if (!existsSync(subdirPath)) {
            consola.warn(`[@schemasset/nuxt] Subdirectory to process for build not found: ${subdirPath}. Skipping asset copying for this path.`);
            return;
          }
          consola.info(`[@schemasset/nuxt] Configuring assets from '${subdirPath}' to be served at '/${options.build.outDir}'`);
          nitro.options.publicAssets.push({
            dir: subdirPath,
            baseURL: options.build.outDir,
            maxAge: 0,
          });

          consola.success(`[@schemasset/nuxt] Assets from subdirectory '${options.build.subdir}' will be available under '/${options.build.outDir}'`);
        }
        catch (error) {
          consola.error(`[@schemasset/nuxt] Error preparing asset processing: ${error instanceof Error ? error.message : String(error)}`);
        }
      });

      async function validateSchema(): Promise<{
        schema: SchemaDef | null;
        baseDir: string;
        checkResult: CheckResult | null;
      }> {
        if (!options.schema) {
          consola.warn("[@schemasset/nuxt] No schema configuration found");
          return { schema: null, baseDir: "", checkResult: null };
        }

        const schema = options.schema ?? parse({ schemaFile: options.schemaPath }).schema;

        // Log schema configuration
        consola.info("[@schemasset/nuxt] Using schema configuration:");
        consola.log(`- Target directory: ${schema.targetDir}`);
        consola.log(`- File patterns: ${schema.files.length}`);

        const baseDir = resolve(nuxt.options.rootDir, schema.targetDir);

        // Check if target directory exists
        if (!existsSync(baseDir)) {
          consola.error(`[@schemasset/nuxt] Target directory not found: ${baseDir}`);
          return { schema, baseDir, checkResult: null };
        }

        // Load files and validate
        const files = await loadFiles({ baseDir: schema.targetDir, files: schema.files });
        const checkResult = check({ results: files });

        // Log diagnostic information
        for (const diagnostic of checkResult.diagnostics) {
          const logger = diagnostic.severity === "error" ? consola.error : consola.warn;
          logger(`[${diagnostic.code}] ${diagnostic.message}`);
        }

        if (checkResult.hasError) {
          consola.error(`[@schemasset/nuxt] Schema validation failed`);
          if (process.env.NODE_ENV === "production") {
            process.exit(1);
          }
          throw new Error("Schema validation failed");
        }

        return { schema, baseDir, checkResult };
      }
    }
  },
});
