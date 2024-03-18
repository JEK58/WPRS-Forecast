import OpenAI from "openai";
import { env } from "@/env.js";
import Redis from "ioredis";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

interface RedisCompDate {
  startDate: string;
  endDate: string;
}

export async function getStartAndEndDateFromRange(input?: string) {
  const redis = new Redis({ host: env.REDIS_URL });
  if (!input) return;

  // Check cache before asking GPT-3
  const cachedDate = await redis.get(`compDate:${input}`);

  if (cachedDate) {
    try {
      const date = JSON.parse(cachedDate) as RedisCompDate;
      return {
        startDate: new Date(date.startDate),
        endDate: new Date(date.endDate),
      };
    } catch (error) {
      console.error("Error parsing JSON:", error);
    }
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
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

    // Cache result
    await redis.set(`compDate:${input}`, JSON.stringify(compDate));

    return compDate;
  } catch (error) {
    console.log(error);
    return;
  }
}
