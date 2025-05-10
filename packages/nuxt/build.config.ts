import type { BuildConfig } from "unbuild";
import { defineBuildConfig } from "unbuild";

const c: BuildConfig[] = defineBuildConfig({
  entries: [],
  failOnWarn: false,
  rollup: {
    esbuild: {
      minify: true,
    },
  },
});

export default c;
