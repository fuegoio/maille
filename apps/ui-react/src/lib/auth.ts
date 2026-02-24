import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { baseApiURL } from "./api";

export const authClient = createAuthClient({
  baseURL: baseApiURL + "/auth",
  plugins: [
    inferAdditionalFields({
      user: {
        currency: {
          type: "string",
        },
        startingDate: {
          type: "date",
        },
      },
    }),
  ],
});

export type User = typeof authClient.$Infer.Session.user;
export type Session = typeof authClient.$Infer.Session.session;
