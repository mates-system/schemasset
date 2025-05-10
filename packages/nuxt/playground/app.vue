<template>
  <div class="container">
    <h1>@schemasset/nuxt Playground</h1>
    <p>This is a test environment for the @schemasset/nuxt module.</p>

    <h2>Asset Testing</h2>
    <div class="assets">
      <div class="asset-item">
        <h3>Logo</h3>
        <img src="/logo.png" alt="Logo" height="100">
      </div>

      <div class="asset-item">
        <h3>Favicon</h3>
        <img src="/favicon.ico" alt="Favicon" height="32">
      </div>

      <div class="asset-item">
        <h3>OG Image</h3>
        <img src="/og-image.png" alt="OG Image" height="100">
      </div>

      <div class="asset-item">
        <h3>Header Logo</h3>
        <img src="/header-logo.png" alt="Header Logo" height="100">
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
}

h1 {
  font-size: 2rem;
  margin-bottom: 1rem;
}

h2 {
  font-size: 1.5rem;
  margin-top: 2rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #ddd;
  padding-bottom: 0.5rem;
}

.domain-selector {
  margin: 2rem 0;
  padding: 1rem;
  background: #f8f8f8;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 1rem;
}

select {
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.reload-btn {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.reload-btn:hover {
  background: #45a049;
}

.assets {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  margin-bottom: 2rem;
}

.asset-item {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}

pre {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
}

.code {
  background: #2d2d2d;
  color: #f8f8f8;
  padding: 1rem;
}
</style>
