#!/usr/bin/env node
import { defineCommand, runMain } from "citty";
import { check } from "./commands/check.js";

const main = defineCommand({
  meta: {
    name: "schemasset",
    version: "0.0.1",
    description: "Asset management with schema validation",
  },
  subCommands: {
    check,
  },
});

// Run the CLI when this file is executed directly
runMain(main);

export default main;
