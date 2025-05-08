import { defineCommand } from "citty";
import { check } from "./commands/check.js";

export default defineCommand({
  meta: {
    name: "schemasset",
    version: "0.0.1",
    description: "Asset management with schema validation",
  },
  subCommands: {
    check,
  },
});
