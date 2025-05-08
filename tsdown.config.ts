import type { Options, UserConfig, UserConfigFn } from "tsdown";
import {
  defineConfig,

} from "tsdown";

export function config(options: Options = {}): UserConfig | UserConfigFn {
  return defineConfig({
    entry: "./src/index.ts",
    dts: {
      sourcemap: true,
    },
    ...options,
  });
}

const _default_1: UserConfig | UserConfigFn = config();
export default _default_1;
