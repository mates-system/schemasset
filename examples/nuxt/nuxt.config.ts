// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['../../packages/nuxt/dist/module.js'],
  schemasset: {
    checkOnBuild: true,
    schema: {
      targetDir: './assets',
      files: [
        { pattern: "*/logo.png" },
        { pattern: "*/favicon.ico" },
        { pattern: "*/og-image.png" },
        { pattern: "*/header-logo.png", optional: true }
      ]
    },
    build: {
      subdir: 'domain-a',
      outDir: 'static-assets'
    },
    failOnError: false
  },
  devtools: { enabled: true }
})