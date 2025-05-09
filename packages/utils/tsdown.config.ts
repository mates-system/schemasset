import type { UserConfig, UserConfigFn } from "tsdown";
import { config } from "../../tsdown.config.js";

const c: UserConfig | UserConfigFn = config({
  target: "es2020",
  entry: "./src/index.ts",
  format: ["cjs", "esm"],
});
export default c;
