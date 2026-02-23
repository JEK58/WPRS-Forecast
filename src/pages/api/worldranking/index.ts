import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "@/env.js";
import { db } from "@/server/db";
import { ilike } from "drizzle-orm";
import { ranking } from "@/server/db/schema";
import * as Sentry from "@sentry/nextjs";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { apiKey, gender } = req.query;

  if (
    !apiKey ||
    (apiKey !== env.AIRTRIBUNE_API_KEY && apiKey !== env.PILOT_UNION_API_KEY)
  ) {
    console.info("Attempted access to world ranking with invalid API key");
    return res.status(401).json({ message: "Invalid API key" });
  }

  if (apiKey === env.AIRTRIBUNE_API_KEY) {
    console.info("World ranking queried by Airtribune");
  } else if (apiKey === env.PILOT_UNION_API_KEY) {
    console.info("World ranking queried by Pilot Union");
  }

  console.info(
    "World ranking endpoint called with gender: " + gender?.toString(),
  );

  const useOptions =
    typeof gender === "string" && ["M", "m", "F", "f"].includes(gender);

  try {
    const result = await db
      .select()
      .from(ranking)
      .where(useOptions ? ilike(ranking.gender, gender) : undefined);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching world ranking:");
    console.error(error);
    Sentry.captureException(error);
    res.status(500).json({ message: "Internal error" });
  }
}
export default handler;
