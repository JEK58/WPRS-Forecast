import { prisma } from "@/server/db";
import type { NextApiRequest, NextApiResponse } from "next";
import rateLimit from "@/utils/rate-limit";
import { env } from "@/env.mjs";
import { updateWorldRanking } from "@/utils/update-world-ranking";

const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 40, // Max 40 users per second
});

const SUBMIT_RATE_LIMIT = parseInt(env.SUBMIT_RATE_LIMIT, 10);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await updateWorldRanking();
    res.status(201).send("done");
  } catch (err) {
    res.status(500).json({ error: "internal error", message: err });
    console.log(err);
  }
}
export default handler;
