import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z
      .string()
      .url()
      .refine(
        (str) => !str.includes("YOUR_MYSQL_URL_HERE"),
        "You forgot to change the default URL",
      ),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    API_KEY: z.string(),
    AIRTRIBUNE_API_KEY: z.string(),
    REDIS_URL: z.string(),
    OPENAI_API_KEY: z.string(),
    ALGOLIA_APP_ID: z.string(),
    ALGOLIA_API_KEY: z.string(),
    // NEXTAUTH_SECRET:
    //   process.env.NODE_ENV === "production"
    //     ? z.string()
    //     : z.string().optional(),
    // NEXTAUTH_URL: z.preprocess(
    //   // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
    //   // Since NextAuth.js automatically uses the VERCEL_URL if present.
    //   (str) => process.env.VERCEL_URL ?? str,
    //   // VERCEL_URL doesn't include `https` so it cant be validated as a URL
    //   process.env.VERCEL ? z.string() : z.string().url(),
    // ),
    // DISCORD_CLIENT_ID: z.string(),
    // DISCORD_CLIENT_SECRET: z.string(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
    NEXT_PUBLIC_PLAUSIBLE_URL: z.string().url().optional(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    API_KEY: process.env.API_KEY,
    AIRTRIBUNE_API_KEY: process.env.AIRTRIBUNE_API_KEY,
    REDIS_URL: process.env.REDIS_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ALGOLIA_API_KEY: process.env.ALGOLIA_API_KEY,
    ALGOLIA_APP_ID: process.env.ALGOLIA_APP_ID,
    NEXT_PUBLIC_PLAUSIBLE_URL: process.env.NEXT_PUBLIC_PLAUSIBLE_URL,
    // NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    // NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    // DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    // DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});