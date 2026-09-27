// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import { unified } from "@astrojs/markdown-remark";
import {
  rehypeCode,
  remarkCodeTab,
  remarkHeading,
  remarkNpm,
  remarkStructure,
} from "fumadocs-core/mdx-plugins";

const remarkPlugins = [
  remarkHeading,
  remarkCodeTab,
  remarkNpm,
  [remarkStructure, { exportAs: "structuredData" }],
];
const rehypePlugins = [rehypeCode];

export default defineConfig({
  redirects: {
    "/docs/financial/account-types": "/docs/financial/accounts",
    "/docs/financial/account-types/bank-accounts": "/docs/financial/accounts/bank-accounts",
    "/docs/financial/account-types/cash": "/docs/financial/accounts/cash",
    "/docs/financial/account-types/investment-accounts":
      "/docs/financial/accounts/investment-accounts",
    "/docs/financial/account-types/assets": "/docs/financial/accounts/assets",
    "/docs/financial/account-types/liabilities": "/docs/financial/accounts/liabilities",
    "/docs/financial/account-types/expenses": "/docs/financial/accounts/expenses",
    "/docs/financial/account-types/revenues": "/docs/financial/accounts/revenues",
  },
  markdown: {
    processor: unified({
      syntaxHighlight: false,
      remarkPlugins,
      rehypePlugins,
    }),
  },
  integrations: [
    react(),
    mdx({
      extendMarkdownConfig: true,
      syntaxHighlight: false,
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
