import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { prisma } from "@/server/db";
import { sanitizeUrl } from "@braintree/sanitize-url";
import { isValidUrl } from "@/utils/check-valid-url";
import { getWprs } from "@/utils/calculate-wprs";
import { TRPCError } from "@trpc/server";

export const wprsRouter = createTRPCRouter({
  getWprs: publicProcedure
    .input(z.object({ url: z.string().url() }))
    .query(async ({ input }) => {
      if (!input.url) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No link submitted",
        });
      }
      return await calcWprs(input.url);
    }),
  getStats: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.usage.findMany();
  }),
});

async function calcWprs(inputUrl: string) {
  let queryID: string | undefined = undefined;
  let wprs: number | undefined;
  let compTitle: string | undefined;

  try {
    const res = await prisma.usage.create({ data: { compUrl: inputUrl } });
    queryID = res.id;
  } catch (error) {
    console.log(error);
  }

  const url = sanitizeUrl(inputUrl);

  if (!isValidUrl(url))
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No valid URL submitted",
    });

  try {
    const forecast = await getWprs(url);
    if (forecast == 0)
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Not enough pilots in this comp",
      });

    // Save result to usage DB
    try {
      wprs = forecast?.confirmed?.WPR;
      compTitle = forecast?.confirmed?.compTitle;
      if (queryID && wprs) {
        await prisma.usage.update({
          where: { id: queryID },
          data: { wprs, compTitle },
        });
      }
    } catch (error) {
      console.log(error);
    }

    if (forecast) return forecast;
    else throw new Error(`Could not calculate WPRS from URL: ${url}`);
  } catch (error) {
    console.log(error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Ooops… something went wrong",
    });
  }
}
