import OpenAI from "openai";
import { env } from "@/env.mjs";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export async function getStartAndEndDateFromRange(input?: string) {
  if (!input) return;
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
            input,
        },
      ],
    });
    const result = completion.choices[0]?.message?.content;
    if (!result) return;

    const [startDate, endDate] = result.split(",");

    if (!startDate || !endDate)
      throw new Error("OpenAi answer does not look plausible");

    return {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };
  } catch (error) {
    console.log(error);
    return;
  }
}
