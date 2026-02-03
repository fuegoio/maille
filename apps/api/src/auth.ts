import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/database";
import { bearer } from "better-auth/plugins";
import { account, session, user, verification } from "./tables";

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
  password: {
    minLength: 8,
    requireSpecialChar: true,
    requireNumber: true,
  },
});
