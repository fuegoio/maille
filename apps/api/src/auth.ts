import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/database";
import { deviceAuthorization } from "better-auth/plugins";
import { account, deviceCode, session, user, verification } from "./tables";
import { env } from "./env";
import { createUserAccounts } from "./services/users";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
      deviceCode,
    },
  }),
  plugins: [
    deviceAuthorization({
      expiresIn: "1800s",
      interval: "5s",
    }),
  ],
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  password: {
    minLength: 8,
    requireSpecialChar: true,
    requireNumber: true,
  },
  trustedOrigins: ["http://localhost:3000", "http://localhost:5173"],
  user: {
    additionalFields: {
      currency: {
        type: "string",
      },
      startingDate: {
        type: "date",
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await createUserAccounts(user.id);
        },
      },
    },
  },
});
