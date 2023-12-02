import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { prisma } from "@/server/db";
import { sanitizeUrl } from "@braintree/sanitize-url";
import { isValidUrl } from "@/utils/check-valid-url";
import { getForecast as calculateWprs } from "@/utils/get-forecast";
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
      return await getForecast(input.url);
    }),
  getStats: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.usage.findMany();
  }),
});

async function getForecast(inputUrl: string) {
  let queryID: string | undefined = undefined;
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
      message: "No valid URL submitted.",
    });

  // Calculate WPRS and measure processing time
  const startTime = performance.now();

  const forecast = await calculateWprs(url);

  const endTime = performance.now();
  const processingTime = +((endTime - startTime) / 1000).toFixed(2);

  if ("error" in forecast) {
    try {
      if (queryID) {
        await prisma.usage.update({
          where: { id: queryID },
          data: { error: forecast.error, processingTime },
        });
      }
    } catch (error) {
      console.log(error);
    }
    if (forecast?.error === "NOT_ENOUGH_PILOTS")
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Not enough pilots in this comp.",
      });

    if (forecast?.error === "PAST_EVENT")
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Competition date is in the past.",
      });

    if (forecast?.error === "UNSUPPORTED_PLATFORM")
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No valid URL submitted.",
      });

    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Something went wrong.",
    });
  }

  try {
    const wprs = forecast?.confirmed?.WPRS?.[0]?.Ta3;
    const potentialWprs = forecast.all?.WPRS?.[0]?.Ta3;
    const compTitle = forecast?.compTitle;
    if (queryID && (wprs || potentialWprs)) {
      await prisma.usage.update({
        where: { id: queryID },
        data: {
          wprs,
          compTitle,
          processingTime,
          potentialWprs,
          meta: forecast?.meta,
        },
      });
    }
  } catch (error) {
    console.log(error);
  }

  return forecast;
}
