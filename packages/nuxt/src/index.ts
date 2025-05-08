import type { SchemaDef } from "@schemasset/schema";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { addTemplate, createResolver, defineNuxtModule } from "@nuxt/kit";
import { check, findSchemaFile, loadFiles, parse } from "@schemasset/core";
import { copyDirectory } from "./runtime/utils";

export interface ModuleOptions {
  /**
   * Schema configuration
   * - string: Path to the schema file
   * - object: Inline schema definition
   * - undefined: Auto-detect schema file
   */
  schema?: string | SchemaDef;

  /**
   * Whether to run the check during build
   * @default true
   */
  checkOnBuild?: boolean;

  /**
   * Build options for handling specific subdirectories
   */
  build?: {
    /**
     * Subdirectory to copy to the build directory
     * @example "domain-a" would copy only the domain-a subdirectory from targetDir
     */
    subdir?: string;

    /**
     * Destination directory relative to the Nuxt public directory
     * @default "assets"
     */
    outDir?: string;
  };

  /**
   * Whether to fail the build on schema validation errors
   * @default true
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
    const resolver = createResolver(import.meta.url);

    // Add utility functions to Nuxt for reuse
    addTemplate({
      filename: "schemasset-utils.mjs",
      write: true,
      src: resolver.resolve("./runtime/utils"),
    });

    // Add plugin only during build
    if (process.env.NODE_ENV === "production" || options.checkOnBuild) {
      nuxt.hook("build:before", async () => {
        try {
          const schemaResult = await loadSchema(options, nuxt.options.rootDir);

          if (!schemaResult) {
            console.warn("[@schemasset/nuxt] No schema configuration found");
            return;
          }

          const { schema } = schemaResult;

          // Get the target schema (use first if it's an array)
          const targetSchema = Array.isArray(schema.schema) ? schema.schema[0] : schema.schema;

          // Load files based on schema patterns
          const results = await loadFiles({
            baseDir: targetSchema.targetDir,
            files: targetSchema.files,
          });

          // Perform the check
          const { diagnostics, hasError } = check({ results });

          // Log diagnostics
          for (const diagnostic of diagnostics) {
            const logMethod = diagnostic.severity === "error" ? console.error : console.warn;
            logMethod(`[@schemasset/nuxt] [${diagnostic.code}] ${diagnostic.message}`);
          }

          // Handle failure if needed
          if (hasError && options.failOnError) {
            throw new Error("[@schemasset/nuxt] Schema validation failed");
          }
        }
        catch (error) {
          if (options.failOnError) {
            throw error instanceof Error ? error : new Error(String(error));
          }
          else {
            console.error(`[@schemasset/nuxt] ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      });

      // Process assets after successful build
      nuxt.hook("nitro:build:before", async (nitro) => {
        try {
          const schemaResult = await loadSchema(options, nuxt.options.rootDir);
          if (!schemaResult)
            return;

          const { schema } = schemaResult;
          const targetSchema = Array.isArray(schema.schema) ? schema.schema[0] : schema.schema;

          // Handle build.subdir if specified
          if (options.build?.subdir && targetSchema.targetDir) {
            const srcDir = resolve(nuxt.options.rootDir, targetSchema.targetDir);
            const subdirPath = resolve(srcDir, options.build.subdir);

            if (existsSync(subdirPath)) {
              // Define output directory in the public folder
              const outDir = options.build?.outDir || "assets";
              const publicDir = nitro.options.output.publicDir;
              const destPath = join(publicDir, outDir);

              // Copy the subdirectory to the public directory
              copyDirectory(subdirPath, destPath);

              console.info(`[@schemasset/nuxt] Copied assets from ${options.build.subdir} to ${outDir}`);
            }
            else {
              console.warn(`[@schemasset/nuxt] Build subdir not found: ${options.build.subdir}`);
            }
          }
        }
        catch (error) {
          console.error(`[@schemasset/nuxt] Error processing assets: ${error instanceof Error ? error.message : String(error)}`);
          if (options.failOnError) {
            throw error;
          }
        }
      });
    }
  },
});

/**
 * Load schema from options or by auto-detecting
 */
async function loadSchema(options: ModuleOptions, rootDir: string) {
  try {
    // Case 1: String path to schema file
    if (typeof options.schema === "string") {
      const schemaPath = resolve(rootDir, options.schema);
      return { schema: parse({ schemaFile: schemaPath }) };
    }

    // Case 2: Inline schema definition
    if (options.schema && typeof options.schema === "object") {
      // Validate with schema definition
      return {
        schema: {
          filename: "inline-schema",
          filetype: "json",
          schema: options.schema,
        },
      };
    }

    // Case 3: Auto-detect
    const schemaPath = findSchemaFile({ cwd: rootDir });
    if (schemaPath) {
      return { schema: parse({ schemaFile: schemaPath }) };
    }

    return null;
  }
  catch (error) {
    throw new Error(`Failed to load schema: ${error instanceof Error ? error.message : String(error)}`);
  }
}
