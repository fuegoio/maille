import { z } from "zod";

const configSchema = z.object({
  apiUrl: z.string().url().default("http://localhost:3000"),
});

declare global {
  interface Window {
    __CONFIG__: string | undefined;
  }
}

const windowConfig = window.__CONFIG__ ?? {};
const config = configSchema.parse(windowConfig);

export default config;
