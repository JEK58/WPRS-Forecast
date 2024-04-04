import { db } from "@/server/db";
import { desc, eq, gt, isNotNull, and } from "drizzle-orm";
import { compRanking, usage } from "@/server/db/schema";
import { z } from "zod";
import { sanitizeUrl } from "@braintree/sanitize-url";
import { isValidUrl } from "@/utils/check-valid-url";
import { type GetForecastError, getForecast } from "@/utils/get-forecast";
import { type Forecast } from "@/types/common";
import * as Sentry from "@sentry/nextjs";

export const fetchHistory = async () => {
  const MAX_DAYS_AGO = 120;

  try {
    const searchDateDaysAgo = new Date();
    searchDateDaysAgo.setDate(searchDateDaysAgo.getDate() - MAX_DAYS_AGO);

    const compsInRanking = await db
      .select({
        name: compRanking.name,
        winnerScore: compRanking.winnerScore,
        tasks: compRanking.tasks,
      })
      .from(compRanking)
      .where(gt(compRanking.resultsUpdated, searchDateDaysAgo.toISOString()));

    const compNames = compsInRanking.map((comp) => comp.name);

    const data = await db
      .select({
        wprs: usage.wprs,
        id: usage.id,
        compTitle: usage.compTitle,
        createdAt: usage.createdAt,
      })
      .from(usage)
      .orderBy(desc(usage.createdAt))
      .where(and(isNotNull(usage.potentialWprs), isNotNull(usage.wprs)));

    const trimmedCompNames = compNames.map((name) => name.trim().toLowerCase());

    const filteredData = data.filter((item) => {
      if (!item.compTitle) return false;
      return trimmedCompNames.includes(item.compTitle.trim().toLowerCase());
    });

    const history = filteredData
      // Convert createdAt to milliseconds because of serialization issues with dates
      .map(({ createdAt, ...rest }) => {
        return { createdAt: new Date(createdAt).getTime(), ...rest };
      })
      // Filter out duplicate entries (due to sort only the most recent one stays)
      .filter(
        (item, index, self) =>
          index === self.findIndex((i) => i.compTitle === item.compTitle),
      )
      // Add wprs and # of tasks to each entry
      .map((el) => {
        const actualWprs = compsInRanking.find(
          (comp) =>
            comp.name.toLowerCase().trim() ===
            el.compTitle?.toLowerCase().trim(),
        )?.winnerScore;
        const tasks = compsInRanking.find(
          (comp) =>
            comp.name.toLowerCase().trim() ===
            el.compTitle?.toLowerCase().trim(),
        )?.tasks;
        return {
          ...el,
          actualWprs,
          tasks,
        };
      })

      // sort by date
      .sort((a, b) => b.createdAt - a.createdAt);

    return history;
  } catch (error) {
    console.log("Error fetching history");
    console.log(error);
    Sentry.captureException(error);

    return [];
  }
};

type Error = { error: "NO_URL" | "SOMETHING_WENT_WRONG" };

export async function fetchForecastData(
  url?: string,
): Promise<Forecast | GetForecastError | Error> {
  const urlSchema = z.object({ url: z.string().url() });
  const val = urlSchema.safeParse({ url });

  if (!val.success) return { error: "NO_URL" };

  let queryID: string | undefined = undefined;
  try {
    const res = await db
      .insert(usage)
      .values({ compUrl: val.data.url })
      .returning({ id: usage.id });

    queryID = res[0]?.id;
  } catch (error) {
    console.error("Error inserting usage");
    console.log(error);
    Sentry.captureException(error);
  }

  const sanitizedUrl = sanitizeUrl(val.data.url);

  if (!isValidUrl(sanitizedUrl)) return { error: "NO_URL" };

  // Calculate WPRS and measure processing time
  const startTime = performance.now();

  const forecast = await getForecast(val.data.url);

  const endTime = performance.now();
  const processingTime = +((endTime - startTime) / 1000).toFixed(2);

  if ("error" in forecast) {
    try {
      if (queryID) {
        await db
          .update(usage)
          .set({ error: forecast.error, processingTime })
          .where(eq(usage.id, queryID));
      }
    } catch (error) {
      console.error("Error updating usage");
      console.log(error);
      Sentry.captureException(error);
    }

    return forecast;
  }

  try {
    const wprs = forecast?.confirmed?.WPRS?.[0]?.Ta3;
    const potentialWprs = forecast.all?.WPRS?.[0]?.Ta3;
    const compTitle = forecast?.compTitle?.trim();
    if (queryID && (wprs ?? potentialWprs)) {
      await db
        .update(usage)
        .set({
          wprs,
          compTitle,
          pilotsUrl: forecast?.pilotsUrl,
          processingTime,
          potentialWprs,
          startDate: forecast?.compDate?.startDate?.toISOString(),
          endDate: forecast?.compDate?.endDate?.toISOString(),
          meta: {
            ...forecast?.meta,
            confirmed: forecast?.confirmed?.civlIds,
            registered: forecast?.all?.civlIds,
          },
        })
        .where(eq(usage.id, queryID));
    }
  } catch (error) {
    console.error("Error updating usage");
    console.log(error);
    Sentry.captureException(error);
  }

  return forecast;
}

export async function fetchRecentQueries() {
  const res = await db
    .select()
    .from(usage)
    .where(isNotNull(usage.potentialWprs))
    .orderBy(desc(usage.createdAt))
    .limit(100)
    .execute();

  const comps = res.map(({ createdAt, startDate, endDate, ...rest }) => {
    const now = new Date();
    const timeDiff = now.getTime() - new Date(createdAt).getTime(); // in milliseconds

    // Calculate time differences in hours and days
    const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));

    // Time till comp start
    let daysTillCompStart: number | null = null;
    let daysSinceCompEnd: number | null = null;
    if (startDate != null) {
      const diffInMilliseconds = new Date(startDate).getTime() - now.getTime();
      daysTillCompStart = Math.ceil(diffInMilliseconds / (1000 * 60 * 60 * 24));
    }
    // Time since comp end
    if (endDate != null) {
      const diffInMilliseconds = new Date(endDate).getTime() - now.getTime();
      daysSinceCompEnd = Math.ceil(diffInMilliseconds / (1000 * 60 * 60 * 24));
    }

    return {
      ...rest,
      ageInHours: hoursDiff,
      daysTillCompStart,
      daysSinceCompEnd,
    };
  });
  return comps;
}
