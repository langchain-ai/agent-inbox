export function useLocalStorage() {
  const setItem = (key: string, value: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, value);
  };

  const getItem = (key: string) => {
    if (typeof window === "undefined") return;
    return localStorage.getItem(key);
  };

  const removeItem = (key: string) => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
  };

  return { setItem, getItem, removeItem };
}
