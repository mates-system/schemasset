export default defineEventHandler((event) => {
  return {
    message: "Hello from Nuxt!",
    timestamp: new Date().toISOString(),
  };
});
