import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "@/env.js";
import { updateWorldRanking } from "@/utils/update-world-ranking";
import { updateRecentComps } from "@/utils/update-recent-comps";
import * as Sentry from "@sentry/nextjs";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { apiKey } = req.query;

  if (!apiKey || apiKey !== env.API_KEY) {
    console.info("Attempted world ranking update with invalid API key");
    return res.status(401).json({ message: "Invalid API key" });
  }

  try {
    console.info("🧹 Updating world ranking db...");
    await updateWorldRanking();
    console.info("🧹 ...done");

    console.info("🧹 Updating recent comps db...");
    await updateRecentComps();
    console.info("🧹 ...done");

    res.status(200).send("done");
  } catch (error) {
    res.status(500).json({ error: "internal error", message: error });
    console.error(error);
    Sentry.captureException(error);
  }
}
export default handler;
