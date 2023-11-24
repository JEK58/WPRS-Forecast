import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "@/env.mjs";
import { prisma } from "@/server/db";
import Redis from "ioredis";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { apiKey } = req.query;

  if (!apiKey || apiKey !== env.API_KEY) {
    console.info("Attempted to populate cache with invalid API key");
    return res.status(401).json({ message: "Invalid API key" });
  }

  console.info("🥖 Populating cache...");
  try {
    await populateCache();
    console.info("🧹 ...done");
    res.status(200).send("done");
  } catch (err) {
    res.status(500).json({ error: "internal error", message: err });
    console.error(err);
  }
}

async function populateCache() {
  const redis = new Redis({ host: env.REDIS_URL });

  const ranking = await prisma.ranking.findMany();

  const keyValuePairs = ranking.map((item) => [
    "name:" + item.name.toLocaleLowerCase(),
    item.id,
  ]);

  await redis.mset(...keyValuePairs.flat());
  await redis.quit();
}

export default handler;
