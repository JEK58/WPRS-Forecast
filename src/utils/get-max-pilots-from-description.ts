import OpenAI from "openai";
import { env } from "@/env.js";
import * as Sentry from "@sentry/nextjs";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export async function getMaxPilotsFromDescription(input: string) {
  if (input.length < 40) return 0;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You do not answer in sentences. You only answer single numbers",
        },

        {
          role: "user",
          content:
            "How many pilots (max pilots accepted) are allowed in this comp? The number can only be between 30 and 150. In any other case return 0. Also if there is no answer just return 0. Answer only a single number, not a sentence. It's about the number of allowed or accepted pilots, not the number of registered pilots" +
            input,
        },
      ],
    });
    const result = completion.choices[0]?.message?.content;
    if (!result) return 0;

    const num = parseInt(result);
    return isNaN(num) ? 0 : num;
  } catch (error) {
    console.error("Error getting max pilots from description");
    console.log(error);
    Sentry.captureException(error);
    return 0;
  }
}
