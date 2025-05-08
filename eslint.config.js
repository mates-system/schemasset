import antfu from "@antfu/eslint-config";

export default antfu({
  type: "lib",
  typescript: true,
  stylistic: {
    semi: true,
    quotes: "double",
    indent: 2,
  },
})
  .append({
    ignores: ["node_modules", "dist", "examples"],
  });
