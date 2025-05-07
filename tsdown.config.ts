import {
	type Options,
	type UserConfig,
	defineConfig,
	type UserConfigFn,
} from "tsdown";

export const config = (
	options: Options = {}
): UserConfig | UserConfigFn =>
	defineConfig({
		entry: "./src/index.ts",
		dts: {
			sourcemap: true,
		},
		...options,
	});

const _default_1: UserConfig | UserConfigFn = config();
export default _default_1;
