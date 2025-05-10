// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ["@schemasset/nuxt"],
  schemasset: {
    schema: {
      targetDir: "public-dyn",
      files: [
        { pattern: "**/favicon.ico" },
        { pattern: "**/logo.png" },
        { pattern: "**/og-image.png" },
        { pattern: "**/header-logo.png", optional: true },
      ],
    },
    build: {
      subdir: "domain-a",
      outDir: "public",
    },
    failOnError: false,
  },
  devtools: { enabled: true },
});
