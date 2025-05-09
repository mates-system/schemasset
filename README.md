<div align="center">

  <img src="./assets/schemasset.png" alt="schemasset logo" width="300">

# schemasset

A schema-based tool for asset file validation

</div>

> [!TIP]
> The name "schemasset" is derived from "schemed asset", referring to assets that are validated against a defined schema.

## 🎯 Motivation

Managing asset files (images, icons, etc.) across multiple domains or projects can become complex. Common challenges include:

- Verifying that required assets exist across multiple domains (subdirectories)
- Ensuring that mandatory assets (logos, favicons, OG images, etc.) are present in each domain without omissions
- Allowing some assets to be optional while enforcing specific patterns when they do exist

`schemasset` addresses these asset management challenges through schema-based definitions.

### 🌐 Example: Multi-domain Asset Management

Consider an asset directory structure like this:

```txt
dynamic-assets/
  domain-a/
    favicon.ico
    header-logo.png
    logo.png
    og-image.png
  domain-b/
    logo.png
    og-image.png
  domain-c/
    favicon.ico
    logo.png
```

You can define required file structures for each domain in a schema definition file (`schemasset.json`):

```json
{
  "$schema": "node_modules/@schemasset/schema/dist/schema.json",
  "targetDir": "./dynamic-assets",
  "files": [
    { "pattern": "*/logo.png" },
    { "pattern": "*/header-logo.png", "optional": true },
    { "pattern": "*/favicon.ico" },
    { "pattern": "*/og-image.png" }
  ]
}
```

Running the CLI performs checks for required files:

```bash
npx schemasset check
```

In this example, errors would be shown because domain-b is missing favicon.ico and domain-c is missing og-image.png.

## 🔌 Integrations

### Nuxt Module

`@schemasset/nuxt` allows you to integrate schema-based asset validation directly into your Nuxt projects. This module provides seamless verification of assets during the build process and can publish specific asset subdirectories.

[Read more about the Nuxt module](./packages/nuxt/README.md)

## 📦 Installation

```bash
# npm
npm install -D @schemasset/cli

# yarn
yarn add -D @schemasset/cli

# pnpm
pnpm add -D @schemasset/cli
```

## 🚀 Usage

### 1. Create a Schema File

Create a `schemasset.json` or `schemasset.yaml` in your project's root directory:

#### JSON Format

```json
{
  "$schema": "node_modules/@schemasset/schema/dist/schema.json",
  "targetDir": "./path/to/assets",
  "files": [
    { "pattern": "*/logo.png" },
    { "pattern": "*/favicon.ico" },
    { "pattern": "*/og-image.png" },
    { "pattern": "*/header-logo.png", "optional": true }
  ]
}
```

#### YAML Format

```yaml
$schema: node_modules/@schemasset/schema/dist/schema.json
targetDir: ./path/to/assets
files:
  - pattern: "*/logo.png"
  - pattern: "*/favicon.ico"
  - pattern: "*/og-image.png"
  - pattern:
      "*/header-logo.png"
    optional: true
```

### 2. Run the CLI

```bash
# If installed locally
npx schemasset check -c schemasset.json

# If installed globally
schemasset check -c schemasset.json
```

### 🛠️ CLI Options

The `schemasset` command line interface supports the following options:

| Option | Alias | Description |
|--------|-------|-------------|
| `--config` | `-c` | Path to the schema config file (JSON or YAML format) |
| `--cwd` | `-d` | Working directory for asset validation |
| `--help` | `-h` | Display help information |
| `--version` | `-v` | Display version information |

Example usage with options:

```bash
# Specify a custom schema file
npx schemasset check --config ./configs/custom-schema.yaml

# Run from a specific working directory
npx schemasset check --cwd ./project-directory
```

## 📚 API

### 📝 Schema Definition

Schema definition files follow this format:

```ts
interface SchemaDef {
  $schema?: string;
  targetDir: string;
  files: SchemaDefFile[];
}

interface SchemaDefFile {
  pattern: string; // glob pattern
  optional?: boolean; // defaults to false
}
```

| Property | Description |
|----------|-------------|
| `targetDir` | Base directory for asset files |
| `files` | Array of file pattern definitions to check |
| `files[].pattern` | Glob pattern (e.g., `*/logo.png`) |
| `files[].optional` | If `true`, file doesn't trigger an error when missing |

### 💻 Programmatic Usage

You can use the `@schemasset/core` package to perform schema checks programmatically:

```ts
import { check, loadFiles, parse } from "@schemasset/core";

// Parse schema definition file
const schema = parse({
  schemaFile: "path/to/schemasset.json",
});

const targetSchema = Array.isArray(schema.schema) ? schema.schema[0] : schema.schema;

// Load files based on schema patterns
const results = await loadFiles({
  baseDir: targetSchema.targetDir,
  files: targetSchema.files,
});

// Perform the check
const { diagnostics, hasError } = check({ results });

// Process diagnostic results
for (const diagnostic of diagnostics) {
  console.log(`[${diagnostic.code}] ${diagnostic.message}`);
}
```
