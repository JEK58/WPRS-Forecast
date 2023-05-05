import { createTRPCRouter } from "@/server/api/trpc";
import { wprsRouter } from "@/server/api/routers/wprs";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  wprs: wprsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
