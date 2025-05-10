<div align="center">
  <img src="../../assets/schemasset.png" alt="SchemaAsset Logo" width="300">

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
      targetDir: "assets",
      files: [
        { pattern: "**/favicon.ico", required: true },
        { pattern: "**/logo.png", required: true },
        { pattern: "**/og-image.png", required: false }
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
      outDir: "assets"
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
2. **Development Mode**: In development mode, only basic validation is performed
3. **Public Configuration**: If `build.subdir` is set, that subdirectory is published at the URL path specified by `build.outDir`

## Examples

### Domain-Specific Asset Management

Example configuration for managing assets for multiple domains:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@schemasset/nuxt"],

  schemasset: {
    schema: {
      targetDir: "assets",
      files: [
        { pattern: "**/favicon.ico", required: true },
        { pattern: "**/logo.png", required: true }
      ]
    },
    build: {
      // Can be dynamically set based on environment variables or runtime config
      subdir: process.env.DOMAIN || "domain-a",
      outDir: "assets"
    }
  }
});
```

## License

MIT
