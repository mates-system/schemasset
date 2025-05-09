import type { Options, UserConfig, UserConfigFn } from "tsdown";
import { defineConfig } from "tsdown";

export function config(options: Options = {}): UserConfig | UserConfigFn {
  return defineConfig({
    entry: "./src/index.ts",
    format: ["esm"],
    dts: {
      sourcemap: true,
    },
    ...options,
  });
}

const rootConfig: UserConfig | UserConfigFn = config();

export default rootConfig;
