import type { UserConfig, UserConfigFn } from "tsdown";
import { config } from "../../tsdown.config.js";

const c: UserConfig | UserConfigFn = config();
export default c;
