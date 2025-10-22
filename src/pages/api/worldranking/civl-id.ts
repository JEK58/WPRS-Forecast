import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "@/env.js";
import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { ranking } from "@/server/db/schema";
import * as Sentry from "@sentry/nextjs";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { apiKey, civlId } = req.query;

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

  if (!civlId || typeof civlId !== "string") {
    return res.status(400).json({ message: "Missing civlId" });
  }

  try {
    const result = await db
      .select()
      .from(ranking)
      .where(eq(ranking.id, +civlId));

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: "internal error", message: error });
    console.error("Error fetching world ranking:");
    console.error(error);
    Sentry.captureException(error);
  }
}
export default handler;
