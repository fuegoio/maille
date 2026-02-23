import { createAuthClient } from "better-auth/react";

const baseURL = import.meta.env.VITE_API_URL.startsWith("http")
  ? import.meta.env.VITE_API_URL + "/auth"
  : window.location.origin + import.meta.env.VITE_API_URL + "/auth";

export const authClient = createAuthClient({
  baseURL,
});
