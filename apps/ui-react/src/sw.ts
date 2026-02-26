/// <reference lib="webworker" />

import type { ManifestEntry } from "workbox-build";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { registerRoute } from "workbox-routing";
import { CacheFirst } from "workbox-strategies";

declare let self: ServiceWorkerGlobalScope;

const CACHE_NAME = "maille-sw";

function deduplicateManifest(manifest: Array<ManifestEntry>) {
  const seen = new Set();
  return manifest.filter((entry) => {
    const url = new URL(entry.url, self.location.origin).pathname;
    if (seen.has(url)) {
      return false;
    } else {
      seen.add(url);
      return true;
    }
  });
}

const manifest = deduplicateManifest(
  // @ts-expect-error This is injected by Vite PWA
  self.__WB_MANIFEST as Array<ManifestEntry>,
);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Ajoute tous les assets du manifest au cache
      return cache.addAll(
        manifest.map((entry) => {
          const url = new URL(entry.url, self.location.origin);
          return url.href;
        }),
      );
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.keys().then((keys) => {
        const manifestPaths = new Set(
          manifest.map(
            (entry) => new URL(entry.url, self.location.origin).pathname,
          ),
        );

        return Promise.all(
          keys.map((key) => {
            const url = new URL(key.url);
            if (!manifestPaths.has(url.pathname)) {
              return cache.delete(key);
            }
            return Promise.resolve();
          }),
        );
      });
    }),
  );
});

registerRoute(
  ({ request }) => request.mode === "navigate",
  async ({ request }) => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        cache.put("/index.html", networkResponse.clone());
      }
      return networkResponse;
    } catch {
      const cached = await cache.match("/index.html");
      return cached || Response.error();
    }
  },
);

registerRoute(
  ({ url }) =>
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/assets/") ||
      manifest.some(
        (entry) =>
          url.pathname === new URL(entry.url, self.location.origin).pathname,
      )),
  new CacheFirst({
    cacheName: CACHE_NAME,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  }),
);
