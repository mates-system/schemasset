import type { CheckResult } from "@schemasset/core";
import type { SchemaDef } from "@schemasset/schema";

import { appendFileSync, existsSync, readdirSync, readFileSync, rmdirSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import process from "node:process";

import { defineNuxtModule } from "@nuxt/kit";
import { check, loadFiles, parse } from "@schemasset/core";
import { createLogger } from "@schemasset/utils";
import { copyDirectory } from "./runtime/utils";

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
      warn: (message: string) => _logger.warn(message),
      error: (message: string) => _logger.error(message),
    };

    logger.info("Setting up schema asset validation");

    // Cleanup previously generated files on module initialization
    cleanupGeneratedFiles(nuxt.options.rootDir);

    if (options.checkOnBuild) {
      nuxt.hook("build:before", async () => {
        try {
          await copyAssets();
        }
        catch (error) {
          logger.error(`Error during schema validation: ${error instanceof Error ? error.message : String(error)}`);
          if (options.failOnError) {
            throw error;
          }
        }
      });

      nuxt.hook("nitro:build:before", async () => {
        try {
          await copyAssets();
        }
        catch (error) {
          logger.error(`Error preparing asset processing: ${error instanceof Error ? error.message : String(error)}`);
        }
      });
    }

    async function copyAssets(): Promise<string | undefined> {
      if (!options.schema || !options.build?.subdir) {
        return;
      }

      const { schema, baseDir } = await validateSchema();
      if (!schema) {
        return;
      }

      const subdirPath = resolve(baseDir, options.build?.subdir);
      if (!existsSync(subdirPath)) {
        logger.warn(`Subdirectory to process for build not found: ${subdirPath}. Skipping asset copying for this path.`);
        return;
      }

      if (!options.build.outDir) {
        logger.warn(`No output directory specified. Skipping asset copying.`);
        return;
      }

      // Check if targetDir starts with "public"
      const isPublicPath = schema.targetDir.startsWith("public/") || schema.targetDir.startsWith("./public/") || schema.targetDir === "public";

      // Get the output directory name from options
      const outDir = options.build.outDir;

      // Special case: when outDir itself is named "public" (avoid duplicate public directories)
      const isOutDirNamedPublic = outDir === "public";

      let targetDir: string;

      if (isPublicPath) {
        // For paths starting with "public"
        // Extract the part after "public/"
        const publicSuffix = schema.targetDir === "public"
          ? ""
          : schema.targetDir.replace(/^\.?\/?(public)\/?/, "");

        if (isOutDirNamedPublic) {
          // When outDir="public", avoid creating /public/public
          targetDir = resolve(nuxt.options.rootDir, "public", publicSuffix);
          logger.info(`Special case: outDir is named "public" and targetDir starts with "public". Using target: ${targetDir}`);
        }
        else {
          // Normal case with public path
          targetDir = resolve(nuxt.options.rootDir, "public", publicSuffix, outDir);
          logger.info(`Public path detected: ${schema.targetDir}, using target: ${targetDir}`);
        }
      }
      else {
        // For non-public paths
        if (isOutDirNamedPublic) {
          // When outDir="public", avoid creating /public/public
          targetDir = resolve(nuxt.options.rootDir, "public");
          logger.info(`Special case: outDir is named "public". Using target: ${targetDir}`);
        }
        else {
          // Normal case
          targetDir = resolve(nuxt.options.rootDir, "public", outDir);
        }
      }

      // Path prefix for .gitignore entries
      const gitignorePathPrefix = "public";

      // Calculate relative path for gitignore entries
      let relativeToPublic: string;

      if (isOutDirNamedPublic) {
        // When outDir is "public", use simpler paths for gitignore
        relativeToPublic = isPublicPath && schema.targetDir !== "public"
          ? schema.targetDir.replace(/^\.?\/?(public)\/?/, "")
          : "";
      }
      else {
        // Normal path calculation
        relativeToPublic = isPublicPath
          ? (schema.targetDir === "public" ? outDir : resolve(schema.targetDir.replace(/^\.?\/?(public)\/?/, ""), outDir))
          : outDir;
      }

      const gitignorePath = resolve(nuxt.options.rootDir, ".gitignore");

      const gitignoreComment = "# @schemasset/nuxt - auto-generated asset files - DO NOT EDIT THIS SECTION MANUALLY";
      const gitignoreEndComment = "# End of @schemasset/nuxt auto-generated entries";

      let relativeAssetFiles: string[] = [];
      try {
        const sourceFiles = collectFilesRecursively(subdirPath);

        relativeAssetFiles = sourceFiles.map((file) => {
          const dirname = file.split("/").slice(0, -1).join("/");

          // Fix double slash issue by properly joining paths
          let gitignorePath = gitignorePathPrefix;

          // Only add slash if relativeToPublic is not empty
          if (relativeToPublic) {
            gitignorePath += `/${relativeToPublic}`;
          }

          // Add dirname if it exists
          if (dirname) {
            gitignorePath += `/${dirname}`;
          }

          return `${gitignorePath}/${basename(file)}`;
        });

        if (relativeAssetFiles.length === 0) {
          logger.warn(`No files found in ${subdirPath} to generate .gitignore entries`);
        }
      }
      catch (error) {
        logger.error(`Error collecting files for .gitignore: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Also fix the fallback entry to avoid double slashes
      const gitignoreEntries = relativeAssetFiles.length > 0
        ? relativeAssetFiles.join("\n")
        : `# No files found in source directory\n${gitignorePathPrefix}${relativeToPublic ? `/${relativeToPublic}` : ""}/*`;

      const gitignoreBlock = `\n${gitignoreComment}\n${gitignoreEntries}\n${gitignoreEndComment}\n`;

      if (existsSync(gitignorePath)) {
        const gitignore = readFileSync(gitignorePath, "utf-8");

        if (gitignore.includes(gitignoreComment) && gitignore.includes(gitignoreEndComment)) {
          const startIndex = gitignore.indexOf(gitignoreComment);
          const endIndex = gitignore.indexOf(gitignoreEndComment) + gitignoreEndComment.length;

          const beforeSection = gitignore.substring(0, startIndex);
          const afterSection = gitignore.substring(endIndex);

          const newContent = `${beforeSection + gitignoreComment}\n${gitignoreEntries}\n${gitignoreEndComment}${afterSection}`;
          writeFileSync(gitignorePath, newContent);
          logger.info(`Updated existing @schemasset/nuxt section in .gitignore with actual file paths`);
        }
        else {
          appendFileSync(gitignorePath, gitignoreBlock);
          logger.info(`Added @schemasset/nuxt section to .gitignore with actual file paths`);
        }
      }
      else {
        writeFileSync(gitignorePath, gitignoreBlock);
        logger.info(`Created .gitignore with @schemasset/nuxt section and actual file paths`);
      }

      logger.info(`Copying assets from '${subdirPath}' to '${targetDir}'`);
      copyDirectory(subdirPath, targetDir);

      // Adjust log message to match the path
      const logPath = isPublicPath
        ? `${schema.targetDir}/${outDir}`
        : `public/${outDir}`;
      logger.success(`Assets from subdirectory '${options.build?.subdir}' have been copied to '${logPath}'`);

      return targetDir;
    }

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

      logger.info("Using schema configuration:");
      logger.log(`- Target directory: ${schema.targetDir}`);
      logger.log(`- File patterns: ${schema.files.length}`);

      const baseDir = resolve(nuxt.options.rootDir, schema.targetDir);

      if (!existsSync(baseDir)) {
        logger.error(`Target directory not found: ${baseDir}`);
        return { schema, baseDir, checkResult: null };
      }

      const files = await loadFiles({ baseDir: schema.targetDir, files: schema.files });
      const checkResult = check({ results: files });

      for (const diagnostic of checkResult.diagnostics) {
        const logMethod = diagnostic.severity === "error" ? logger.error : logger.warn;
        logMethod(`[${diagnostic.code}] ${diagnostic.message}`);
      }

      if (checkResult.hasError) {
        logger.error(`Schema validation failed, but continuing with asset copying`);
        // Don't exit or throw error, continue with asset copying
        if (process.env.NODE_ENV === "production" && options.failOnError) {
          process.exit(1);
        }
      }

      return { schema, baseDir, checkResult };
    }

    function deleteFileOrDirectory(path: string): void {
      try {
        if (!existsSync(path)) {
          return;
        }

        const stats = statSync(path);
        if (stats.isFile()) {
          unlinkSync(path);
        }
        else if (stats.isDirectory()) {
          const files = readdirSync(path);
          for (const file of files) {
            deleteFileOrDirectory(join(path, file));
          }
          rmdirSync(path);
        }
      }
      catch (error) {
        console.error(`Error deleting ${path}:`, error);
      }
    }

    /**
     * Extract auto-generated file patterns from .gitignore
     */
    function extractAutoGeneratedPaths(gitignorePath: string): {
      patterns: string[];
      startIndex: number;
      endIndex: number;
      exists: boolean;
    } {
      const gitignoreComment = "# @schemasset/nuxt - auto-generated asset files - DO NOT EDIT THIS SECTION MANUALLY";
      const gitignoreEndComment = "# End of @schemasset/nuxt auto-generated entries";
      const defaultResult = { patterns: [], startIndex: -1, endIndex: -1, exists: false };

      if (!existsSync(gitignorePath)) {
        return defaultResult;
      }

      try {
        const gitignore = readFileSync(gitignorePath, "utf-8");

        if (!gitignore.includes(gitignoreComment) || !gitignore.includes(gitignoreEndComment)) {
          return defaultResult;
        }

        const startIndex = gitignore.indexOf(gitignoreComment);
        const endIndex = gitignore.indexOf(gitignoreEndComment) + gitignoreEndComment.length;

        // Extract the content between markers
        const sectionContent = gitignore.substring(
          startIndex + gitignoreComment.length,
          gitignore.indexOf(gitignoreEndComment),
        ).trim();

        // Extract actual paths, skipping comments and empty lines
        const patterns = sectionContent.split("\n")
          .map(line => line.trim())
          .filter(line => line && !line.startsWith("#"));

        return {
          patterns,
          startIndex,
          endIndex,
          exists: true,
        };
      }
      catch (error) {
        console.error(`Error extracting paths from .gitignore:`, error);
        return defaultResult;
      }
    }

    function collectFilesRecursively(dir: string, basePath: string = dir): string[] {
      let results: string[] = [];
      const entries = readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relativePath = relative(basePath, fullPath);

        if (entry.isDirectory()) {
          results = results.concat(collectFilesRecursively(fullPath, basePath));
        }
        else if (entry.isFile()) {
          results.push(relativePath);
        }
      }

      return results;
    }

    function cleanupGeneratedFiles(rootDir: string): void {
      const gitignorePath = resolve(rootDir, ".gitignore");
      const autoGeneratedPaths = extractAutoGeneratedPaths(gitignorePath);

      if (!autoGeneratedPaths.exists) {
        logger.info("No auto-generated files found to clean up");
        return;
      }

      for (const pattern of autoGeneratedPaths.patterns) {
        const fullPath = resolve(rootDir, pattern);
        deleteFileOrDirectory(fullPath);
        logger.info(`Deleted auto-generated file or directory: ${fullPath}`);
      }

      try {
        const gitignore = readFileSync(gitignorePath, "utf-8");
        const newContent = gitignore.substring(0, autoGeneratedPaths.startIndex) + gitignore.substring(autoGeneratedPaths.endIndex);
        writeFileSync(gitignorePath, newContent);
        logger.info("Cleaned up auto-generated entries in .gitignore");
      }
      catch (error) {
        logger.error(`Error cleaning up .gitignore: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  },
});
