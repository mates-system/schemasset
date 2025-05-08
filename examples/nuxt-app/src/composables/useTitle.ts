export function useTitle() {
  const title = ref("Nuxt Example");
  const setTitle = (newTitle: string) => {
    title.value = newTitle;
  };

  return {
    title: readonly(title),
    setTitle,
  };
}
