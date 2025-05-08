<script setup lang="ts">
// Basic button component
</script>

<template>
  <button class="app-button">
    <slot />
  </button>
</template>



<style scoped>
.app-button {
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  background-color: #4f46e5;
  color: white;
}
</style>