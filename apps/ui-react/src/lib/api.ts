export const baseApiURL = import.meta.env.VITE_API_URL.startsWith("http")
  ? import.meta.env.VITE_API_URL
  : window.location.origin + import.meta.env.VITE_API_URL;
