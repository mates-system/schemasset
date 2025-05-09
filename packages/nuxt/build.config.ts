import type { BuildConfig } from "unbuild";
import { defineBuildConfig } from "unbuild";

const c: BuildConfig[] = defineBuildConfig({
  entries: [],
  failOnWarn: false,
});

export default c;
