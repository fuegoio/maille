import type { App } from "vue";
import type { Router } from "vue-router";

import * as Sentry from "@sentry/vue";

export const initSentry = (app: App, router: Router) => {
  if (!import.meta.env.VITE_SENTRY_DSN) return;

  Sentry.init({
    app,
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      new Sentry.BrowserTracing({
        routingInstrumentation: Sentry.vueRouterInstrumentation(router),
      }),
      new Sentry.Replay({
        maskAllText: false,
      }),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
};
