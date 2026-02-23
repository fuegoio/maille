import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/database";
import { bearer } from "better-auth/plugins";
import { account, session, user, verification } from "./tables";
import { env } from "./env";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
  plugins: [bearer()],
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
});
