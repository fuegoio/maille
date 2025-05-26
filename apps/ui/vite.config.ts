import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import graphqlCodegen from "vite-plugin-graphql-codegen";

import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    server: {
      port: 12000,
      host: '0.0.0.0',
      allowedHosts: true,
      cors: true,
    },
    build: {
      sourcemap: true,
    },
    plugins: [
      vue(),
      graphqlCodegen(),
      // VitePWA({
      //   registerType: "autoUpdate",
      //   injectRegister: "inline",
      //   includeAssets: ["favicon.ico"],
      //   manifest: {
      //     name: "Maille",
      //     short_name: "Maille",
      //     description: "Maille is a personal finance for developers.",
      //     theme_color: "#1C1C1C",
      //     icons: [
      //       {
      //         src: "icon-72x72.png",
      //         sizes: "72x72",
      //         type: "image/png",
      //         purpose: "maskable any",
      //       },
      //       {
      //         src: "icon-96x96.png",
      //         sizes: "96x96",
      //         type: "image/png",
      //         purpose: "maskable any",
      //       },
      //       {
      //         src: "icon-128x128.png",
      //         sizes: "128x128",
      //         type: "image/png",
      //         purpose: "maskable any",
      //       },
      //       {
      //         src: "icon-144x144.png",
      //         sizes: "144x144",
      //         type: "image/png",
      //         purpose: "maskable any",
      //       },
      //       {
      //         src: "icon-152x152.png",
      //         sizes: "152x152",
      //         type: "image/png",
      //         purpose: "maskable any",
      //       },
      //       {
      //         src: "icon-192x192.png",
      //         sizes: "192x192",
      //         type: "image/png",
      //         purpose: "maskable any",
      //       },
      //       {
      //         src: "icon-384x384.png",
      //         sizes: "384x384",
      //         type: "image/png",
      //         purpose: "maskable any",
      //       },
      //       {
      //         src: "icon-512x512.png",
      //         sizes: "512x512",
      //         type: "image/png",
      //         purpose: "maskable any",
      //       },
      //     ],
      //   },
      // }),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  };
});
