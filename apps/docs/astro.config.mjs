// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  integrations: [
    starlight({
      title: "Maille Docs",
      description:
        "Documentation for Maille, a personal finance tool for developers built on a strict double-entry ledger.",
      locales: {
        root: {
          label: "English",
          lang: "en",
        },
      },
      customCss: ["./src/styles/custom.css"],
      sidebar: [
        { label: "Introduction", link: "/" },
        {
          label: "Get started",
          items: [
            { label: "Self-hosting", slug: "getting-started/self-hosting" },
            { label: "Connect the CLI", slug: "getting-started/connect-the-cli" },
          ],
        },
        {
          label: "Concepts",
          items: [
            { label: "The double-entry ledger", slug: "concepts/double-entry-ledger" },
            { label: "Accounts", slug: "concepts/accounts" },
            { label: "Activities", slug: "concepts/activities" },
            { label: "Transactions", slug: "concepts/transactions" },
            { label: "Movements", slug: "concepts/movements" },
            { label: "Funds", slug: "concepts/funds" },
            { label: "Sharing and liability", slug: "concepts/sharing" },
          ],
        },
        {
          label: "Guides",
          items: [
            { label: "The daily loop", slug: "guides/daily-loop" },
            { label: "Recording bank movements", slug: "guides/bank-sync" },
            { label: "AI reconciliation workflows", slug: "guides/ai-reconciliation" },
          ],
        },
        {
          label: "Reference",
          items: [
            { label: "CLI commands", slug: "reference/cli" },
            { label: "GraphQL API", slug: "reference/graphql" },
            { label: "Configuration", slug: "reference/configuration" },
          ],
        },
      ],
    }),
  ],
});
