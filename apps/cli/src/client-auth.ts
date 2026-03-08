import { createAuthClient } from "better-auth/client";
import { deviceAuthorizationClient } from "better-auth/client/plugins";
import { readConfig } from "./config.js";

export function createCliAuthClient(apiUrl?: string) {
  const url = apiUrl ?? readConfig().apiUrl;
  return createAuthClient({
    baseURL: `${url}/auth`,
    plugins: [deviceAuthorizationClient()],
  });
}
