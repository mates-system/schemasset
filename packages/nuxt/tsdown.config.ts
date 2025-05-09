import type { UserConfig, UserConfigFn } from "tsdown";
import { config } from "../../tsdown.config.js";

const c: UserConfig | UserConfigFn = config({
  entry: ["src/index.ts", "src/module.ts"],
});

export default c;
