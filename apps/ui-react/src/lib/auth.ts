import { createAuthClient } from "better-auth/react";

import { baseApiURL } from "./api";

export const authClient = createAuthClient({
  baseURL: baseApiURL + "/auth",
});
