import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "@/env.mjs";
import { prisma } from "@/server/db";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { apiKey } = req.query;

  if (!apiKey || apiKey !== env.AIRTRIBUNE_API_KEY) {
    console.info("Attempted access to world ranking with invalid API key");
    return res.status(401).json({ message: "Invalid API key" });
  }

  try {
    const result = await prisma.ranking.findMany();
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: "internal error", message: err });
    console.error(err);
  }
}
export default handler;
