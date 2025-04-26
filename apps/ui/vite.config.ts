import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";

import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import type { ManifestEntry } from "workbox-build";
import { sentryVitePlugin } from "@sentry/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    build: {
      sourcemap: true,
    },
    plugins: [
      vue(),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "inline",
        scope: "https://banqr.app/",
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          ignoreURLParametersMatching: [/^v$/],
          manifestTransforms: [
            (manifestEntries: (ManifestEntry & { size: number })[]) => {
              manifestEntries.forEach((entry) => {
                entry.url = `https://client.banqr.app/${entry.url}`;
              });
              return { manifest: manifestEntries };
            },
          ],
          inlineWorkboxRuntime: true,
          navigateFallback: null,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/banqr\.app\/.*/i,
              handler: "NetworkFirst",
              options: {
                precacheFallback: {
                  fallbackURL: "https://client.banqr.app/index.html",
                },
              },
            },
            {
              urlPattern: /^https:\/\/client\.banqr\.app\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "banqr-client-ressources",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        includeAssets: ["https://client.banqr.app/favicon.ico"],
        manifest: {
          name: "Maille",
          short_name: "Maille",
          description: "Maille is a personal finance for developers.",
          theme_color: "#ffffff",
          start_url: "https://banqr.app/login",
          icons: [
            {
              src: "https://client.banqr.app/icon-72x72.png",
              sizes: "72x72",
              type: "image/png",
              purpose: "maskable any",
            },
            {
              src: "https://client.banqr.app/icon-96x96.png",
              sizes: "96x96",
              type: "image/png",
              purpose: "maskable any",
            },
            {
              src: "https://client.banqr.app/icon-128x128.png",
              sizes: "128x128",
              type: "image/png",
              purpose: "maskable any",
            },
            {
              src: "https://client.banqr.app/icon-144x144.png",
              sizes: "144x144",
              type: "image/png",
              purpose: "maskable any",
            },
            {
              src: "https://client.banqr.app/icon-152x152.png",
              sizes: "152x152",
              type: "image/png",
              purpose: "maskable any",
            },
            {
              src: "https://client.banqr.app/icon-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "maskable any",
            },
            {
              src: "https://client.banqr.app/icon-384x384.png",
              sizes: "384x384",
              type: "image/png",
              purpose: "maskable any",
            },
            {
              src: "https://client.banqr.app/icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable any",
            },
          ],
        },
      }),
      sentryVitePlugin({
        org: "fuegoio",
        project: "banqr",
        telemetry: false,
        disable: mode !== "production",
      }),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    experimental: {
      renderBuiltUrl(
        filename: string,
        {
          hostId,
          hostType,
          type,
        }: {
          hostId: string;
          hostType: "js" | "css" | "html";
          type: "public" | "asset";
        }
      ) {
        return "https://client.banqr.app/" + filename;
      },
    },
  };
});
