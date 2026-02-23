import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://c0edf5a499204f85a8f5c1bc123b9c8b@o4504899889397760.ingest.us.sentry.io/4504899897393152",
  enabled: process.env.NODE_ENV === "production",
  tracesSampleRate: 1,
  debug: false,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
