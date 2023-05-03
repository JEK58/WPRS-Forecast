import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const wprsRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),
  getStats: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.usage.findMany();
  }),
});
