import type { CheckResult } from "@schemasset/core";
import type { SchemaDef } from "@schemasset/schema";

import { existsSync } from "node:fs";
import { relative, resolve } from "node:path";
import process from "node:process";

import { defineNuxtModule } from "@nuxt/kit";
import { check, loadFiles, parse } from "@schemasset/core";
import { createLogger } from "@schemasset/utils";

// Create a logger with a specific prefix for this module
const _logger = createLogger({ prefix: "@schemasset/nuxt" });

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
   *
   * @default true
   */
  failOnError?: boolean;

  /**
   * Whether to show verbose logs
   *
   * @default false
   */
  verbose?: boolean;
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
    verbose: false,
    build: {
      outDir: "assets",
    },
  },
  setup(options, nuxt) {
    // Create log functions that respect the verbose setting
    const logger = {
      info: (message: string) => {
        if (options.verbose)
          _logger.info(message);
      },
      log: (message: string) => {
        if (options.verbose)
          _logger.log(message);
      },
      success: (message: string) => {
        if (options.verbose)
          _logger.success(message);
      },
      // Always show warnings and errors
      warn: _logger.warn,
      error: _logger.error,
    };

    logger.info("Setting up schema asset validation");

    if (options.checkOnBuild) {
      nuxt.hook("build:before", async () => {
        try {
          if (nuxt.options.dev) {
            await validateSchema();
          }
        }
        catch (error) {
          logger.error(`Error during schema validation: ${error instanceof Error ? error.message : String(error)}`);
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
            logger.warn(`Subdirectory to process for build not found: ${subdirPath}. Skipping asset copying for this path.`);
            return;
          }

          // Check if targetDir starts with public directory
          const publicDir = resolve(nuxt.options.rootDir, "public");
          let dir = subdirPath;
          let baseURL = options.build.outDir;

          // If the subdirPath is within the public directory, adjust the path and baseURL
          if (subdirPath.startsWith(publicDir)) {
            const relativePath = relative(publicDir, subdirPath);
            logger.info(`Detected path inside public directory, adjusting path: ${relativePath}`);
            dir = subdirPath;
            baseURL = relativePath || options.build.outDir;
            logger.info(`Configuring assets from '${dir}' to be served directly from public at '/${baseURL}'`);
          }
          else {
            logger.info(`Configuring assets from '${dir}' to be served at '/${baseURL}'`);
          }

          nitro.options.publicAssets.push({ dir, baseURL, maxAge: 0 });

          logger.success(`Assets from subdirectory '${options.build.subdir}' will be available under '/${baseURL}'`);
        }
        catch (error) {
          logger.error(`Error preparing asset processing: ${error instanceof Error ? error.message : String(error)}`);
        }
      });

      async function validateSchema(): Promise<{
        schema: SchemaDef | null;
        baseDir: string;
        checkResult: CheckResult | null;
      }> {
        if (!options.schema) {
          logger.warn("No schema configuration found");
          return { schema: null, baseDir: "", checkResult: null };
        }

        const schema = options.schema ?? parse({ schemaFile: options.schemaPath }).schema;

        // Log schema configuration
        logger.info("Using schema configuration:");
        logger.log(`- Target directory: ${schema.targetDir}`);
        logger.log(`- File patterns: ${schema.files.length}`);

        const baseDir = resolve(nuxt.options.rootDir, schema.targetDir);

        // Check if target directory exists
        if (!existsSync(baseDir)) {
          logger.error(`Target directory not found: ${baseDir}`);
          return { schema, baseDir, checkResult: null };
        }

        // Load files and validate
        const files = await loadFiles({ baseDir: schema.targetDir, files: schema.files });
        const checkResult = check({ results: files });

        // Log diagnostic information
        for (const diagnostic of checkResult.diagnostics) {
          const logMethod = diagnostic.severity === "error" ? logger.error : logger.warn;
          logMethod(`[${diagnostic.code}] ${diagnostic.message}`);
        }

        if (checkResult.hasError) {
          logger.error(`Schema validation failed`);
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
