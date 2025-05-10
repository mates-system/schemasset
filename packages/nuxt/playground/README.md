# @schemasset/nuxt Playground

This is a development and testing environment for the `@schemasset/nuxt` module.

## Features

- Test the module functionality in a real Nuxt environment
- Switch between different domains to see dynamic asset loading
- View configuration examples
- API endpoint to simulate domain switching

## Getting Started

### Development Mode

To start the development server:

```bash
# Navigate to the playground directory
cd packages/nuxt/playground

# Install dependencies
npm install # or pnpm install or yarn install

# Start the development server
npm run dev
```

The playground will be available at `http://localhost:3000`.

### Using the Playground

1. **View Assets**: The main page shows assets from the selected domain
2. **Change Domain**: Use the dropdown to switch between domains
3. **Reload Assets**: Click the "Reload Assets" button to refresh the assets without reloading the page

### Configuration

The playground uses this configuration in `nuxt.config.ts`:

```ts
schemasset: {
  verbose: true,
  schema: {
    targetDir: 'public-dyn',
    files: [
      { pattern: "**/favicon.ico" },
      { pattern: "**/logo.png" },
      { pattern: "**/og-image.png" },
      { pattern: "**/header-logo.png", optional: true }
    ]
  },
  build: {
    subdir: 'public', // Initial domain
    outDir: 'static-assets'
  },
  failOnError: false
}
```

## Module Features Demo

1. **Asset Validation**: Validates that required assets exist
2. **Asset Copying**: Copies assets from the specified subdirectory to public output
3. **Dynamic Asset Loading**: Demonstrates how assets can be switched at runtime

## Directory Structure

```
playground/
├── assets/         # Source assets directory
│   ├── domain-a/   # Assets for Domain A
│   ├── domain-b/   # Assets for Domain B
│   └── domain-c/   # Assets for Domain C
├── public/         # Public directory
│   └── static-assets/ # Generated assets directory
├── server/         # Server API routes
│   └── api/        # API endpoints
├── app.vue         # Main application component
├── nuxt.config.ts  # Nuxt configuration
├── package.json    # Dependencies
└── README.md       # This file
```
