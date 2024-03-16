import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "@/env.js";
import { db } from "@/server/db";
import { ilike } from "drizzle-orm";
import { ranking } from "@/server/db/schema";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { apiKey, gender } = req.query;

  if (!apiKey || apiKey !== env.AIRTRIBUNE_API_KEY) {
    console.info("Attempted access to world ranking with invalid API key");
    return res.status(401).json({ message: "Invalid API key" });
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
  } catch (err) {
    res.status(500).json({ error: "internal error", message: err });
    console.error(err);
  }
}
export default handler;
