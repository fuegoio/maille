import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    LOG_LEVEL: z.string().default("info"),
    DATABASE_URL: z.string().default("postgres://postgres:postgres@localhost:5432/maille"),
    // AI harness (movement-to-activity assistant). Absent key = harness disabled.
    MISTRAL_API_KEY: z.string().optional(),
    HARNESS_LLM_BASE_URL: z.string().default("https://api.mistral.ai/v1"),
    HARNESS_LLM_MODEL: z.string().default("glm-5-2"),
    HARNESS_MAX_ATTEMPTS: z.coerce.number().default(2),
    HARNESS_TIMEOUT_MS: z.coerce.number().default(120_000),
    HARNESS_RETRY_DELAY_MS: z.coerce.number().default(5_000),
  },
  client: {},
  runtimeEnv: {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    LOG_LEVEL: process.env.LOG_LEVEL,
    DATABASE_URL: process.env.DATABASE_URL,
    MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
    HARNESS_LLM_BASE_URL: process.env.HARNESS_LLM_BASE_URL,
    HARNESS_LLM_MODEL: process.env.HARNESS_LLM_MODEL,
    HARNESS_MAX_ATTEMPTS: process.env.HARNESS_MAX_ATTEMPTS,
    HARNESS_TIMEOUT_MS: process.env.HARNESS_TIMEOUT_MS,
    HARNESS_RETRY_DELAY_MS: process.env.HARNESS_RETRY_DELAY_MS,
  },

  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
