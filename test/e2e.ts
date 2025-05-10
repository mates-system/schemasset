#!/usr/bin/env node
/* eslint-disable antfu/no-top-level-await */

import { exec } from "node:child_process";
import { promises as fs } from "node:fs";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
// eslint-disable-next-line antfu/no-import-dist
import { createLogger } from "../packages/utils/dist/index.js";

// Create a logger for testing
const logger = createLogger({ prefix: "test" });

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..");
const EXAMPLES_DIR = join(ROOT_DIR, "examples/basic");
const SNAPSHOTS_DIR = join(__dirname, "./__snapshots__");
const BIN = join(ROOT_DIR, "packages/cli/dist/index.js");

class CommandError extends Error {
  constructor(message: string, public stdout: string, public stderr: string) {
    super(message);
    this.name = "CommandError";
  }
}

function runCommand(command: string, cwd: string): Promise<{
  stdout: string;
  stderr: string;
}> {
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        reject(new CommandError("Command failed", stdout, stderr));
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

async function main(updateSnapshot: boolean): Promise<void> {
  await fs.mkdir(SNAPSHOTS_DIR, { recursive: true });

  const exampleDir = join(EXAMPLES_DIR);
  logger.log(`\n🧪 Testing example: ${exampleDir}`);

  try {
  // For basic example, run the CLI check command
    const command = `cd ${exampleDir} && node ${BIN} check`;
    logger.log(`Running: ${command}`);
    const { stdout, stderr } = await runCommand(command, exampleDir);

    // Save snapshot
    const snapshotFile = join(SNAPSHOTS_DIR, `e2e.snapshot`);
    const content = `STDOUT:\n${stdout}\nSTDERR:\n${stderr}`;

    // Check if snapshot exists
    const existingSnapshot = await fs.readFile(snapshotFile, "utf-8");
    if (existingSnapshot.trim() !== content.trim()) {
      logger.error(`Snapshot mismatch`);
      logger.log("Expected:");
      logger.log(existingSnapshot);
      logger.log("Received:");
      logger.log(content);
      process.exit(1);
    }
    else {
      logger.success(`Snapshot match`);
    }
  }
  catch (e) {
    if (e instanceof CommandError) {
      const { stdout, stderr } = e;
      const snapshotFile = join(SNAPSHOTS_DIR, `e2e.snapshot`);
      const content = `STDOUT:\n${stdout}\nSTDERR:\n${stderr}`;

      if (updateSnapshot) {
        logger.info(`📸 Updating snapshot`);
        await fs.writeFile(snapshotFile, content);
        logger.success("\n✨ All tests completed successfully");
      }
      else {
        const existingSnapshot = await fs.readFile(snapshotFile, "utf-8");
        if (existingSnapshot.trim() !== content.trim()) {
          logger.error(`Snapshot mismatch`);
          logger.log("Expected:");
          logger.log(existingSnapshot);
          logger.log("Received:");
          logger.log(content);
          process.exit(1);
        }
        else {
          logger.success(`No changes to snapshot`);
        }
      }
    }
  }
}

await main(process.argv.includes("--update"));
