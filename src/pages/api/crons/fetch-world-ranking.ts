import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "@/env.mjs";
import { updateWorldRanking } from "@/utils/update-world-ranking";
import { updateRecentComps } from "@/utils/update-recent-comps";

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
  } catch (err) {
    res.status(500).json({ error: "internal error", message: err });
    console.error(err);
  }
}
export default handler;
