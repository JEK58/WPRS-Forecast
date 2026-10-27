import OpenAI from "openai";
import { env } from "@/env.js";
import * as Sentry from "@sentry/nextjs";
import { redis } from "@/server/cache/redis";
import { isValidCompetitionDateRange } from "./competition-dates";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

interface RedisCompDate {
  startDate: string;
  endDate: string;
}
const COMP_DATE_CACHE_TTL = 60 * 60 * 24 * 20; // 20 days

export async function getStartAndEndDateFromRange(input?: string) {
  if (!input) return;

  // Check cache before asking OpenAI
  const cachedDate = redis
    ? await redis.get(`compDate:${input}`).catch(() => null)
    : null;

  if (cachedDate) {
    try {
      const date = JSON.parse(cachedDate) as RedisCompDate;
      const compDate = {
        startDate: new Date(date.startDate),
        endDate: new Date(date.endDate),
      };
      if (isValidCompetitionDateRange(compDate)) return compDate;
    } catch (error) {
      console.error("Error parsing JSON:", error);
      Sentry.captureException(error);
    }
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.6-sol",
      reasoning_effort: "none",
      messages: [
        {
          role: "system",
          content:
            "You do not answer in sentences. You only answer by returning two dates separated by a comma. Start date first",
        },

        {
          role: "user",
          content:
            "Please provide the start and end date as iso strings without time just date from the given range:" +
            input +
            "Always interpret dates as UTC, ignore any location information.",
        },
      ],
    });
    const result = completion.choices[0]?.message?.content;
    if (!result) return;

    const [startDate, endDate] = result.split(",");

    if (!startDate || !endDate)
      throw new Error("OpenAI answer does not look plausible");

    const compDate = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };
    if (!isValidCompetitionDateRange(compDate)) {
      throw new Error("OpenAI returned invalid competition dates");
    }

    // Cache result
    if (redis) {
      await redis
        .set(
          `compDate:${input}`,
          JSON.stringify(compDate),
          "EX",
          COMP_DATE_CACHE_TTL,
        )
        .catch(() => null);
    }

    return compDate;
  } catch (error) {
    console.error("Error getting start and end date from range");
    console.log(error);
    Sentry.captureException(error);
    return;
  }
}
