<div align="center">
  <img src="https://github.com/mates-system/schemasset/blob/main/assets/schemasset.png?raw=true" alt="schemasset logo" height="150" width="150">

# @schemasset/nuxt

</div>

[![npm version](https://img.shields.io/npm/v/@schemasset/nuxt)](https://www.npmjs.com/package/@schemasset/nuxt)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](../../LICENSE)

> Nuxt module for schemasset - schema-based asset file validation

## Overview

`@schemasset/nuxt` is a Nuxt module for validating asset files (images, icons, fonts, etc.) based on schema definitions within your Nuxt project. Using this module, you can verify that the asset files in your project match the expected structure, and receive warnings or errors during the build process if there are issues.

## Features

- **Asset Validation**: Validate the existence and structure of asset files during development and build
- **Flexible Configuration**: Configure using inline schema definitions or schema file paths
- **Build Process Integration**: Seamlessly integrated with the Nuxt build process
- **Public Asset Configuration**: Automatically configure specific subdirectories as public assets

## Installation

```bash
# npm
npm install --save-dev @schemasset/nuxt

# yarn
yarn add -D @schemasset/nuxt

# pnpm
pnpm add -D @schemasset/nuxt
```

## Usage

Add the module to your `nuxt.config.ts` file and configure as needed:

```ts
export default defineNuxtConfig({
  modules: ["@schemasset/nuxt"],

  schemasset: {
    // Schema definition (inline)
    schema: {
      targetDir: "public-dyn",
      files: [
        { pattern: "**/favicon.ico" },
        { pattern: "**/logo.png" },
        { pattern: "**/og-image.png", optional: true }
      ]
    },

    // Or use a schema file path
    // schemaPath: './schemasset.json',

    // Whether to check during build (default: true)
    checkOnBuild: true,

    // Whether to fail on error (default: true)
    failOnError: true,

    // Whether to show detailed logs (default: false)
    verbose: false,

    // Build settings
    build: {
      // Subdirectory to publish
      subdir: "domain-a",

      // Output directory (default: 'assets')
      outDir: "public"
    }
  }
});
```

## Configuration Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `schema` | `Object` | `undefined` | Inline schema definition |
| `schemaPath` | `String` | `undefined` | Path to schema file |
| `checkOnBuild` | `Boolean` | `true` | Whether to validate assets during build |
| `failOnError` | `Boolean` | `true` | Whether to fail the build on error |
| `verbose` | `Boolean` | `false` | Whether to show detailed logs during validation and build |
| `build.subdir` | `String` | `undefined` | Subdirectory of assets to publish |
| `build.outDir` | `String` | `'assets'` | Output directory for public assets |

## How It Works

1. **Validation Process**: Asset validation is executed before build (`build:before`) and before Nitro build (`nitro:build:before`)
2. **Development Mode**: In development mode, the module serves assets from your configured subdirectory using a virtual server middleware
3. **Production Mode**: In production, assets are configured as public assets in Nitro
4. **Public Directory Support**: If assets are located within Nuxt's public directory, paths are automatically adjusted

When a `build.subdir` is specified, the module will:
- In production: Configure those assets to be available under the specified `build.outDir` URL path
- In development: Set up a virtual server middleware that handles 404s and serves assets from that directory under the same URL structure

## Examples

### Domain-Specific Asset Management

Example configuration for managing assets for multiple domains:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@schemasset/nuxt"],

  schemasset: {
    schema: {
      targetDir: "public-dyn",
      files: [
        { pattern: "**/favicon.ico" },
        { pattern: "**/logo.png" }
      ]
    },
    build: {
      // Can be dynamically set based on environment variables or runtime config
      subdir: process.env.DOMAIN || "domain-a",
      outDir: "public"
    }
  }
});
```

## License

MIT
