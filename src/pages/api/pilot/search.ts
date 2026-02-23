import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { asc, eq, ilike, or } from "drizzle-orm";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/server/db";
import { ranking } from "@/server/db/schema";
import { normalizeName } from "@/utils/normalize-name";

const schema = z.object({
  q: z.string().trim().min(1),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const parsed = schema.safeParse({ q: req.query.q });
  if (!parsed.success) {
    return res.status(400).json({ message: "Missing query parameter `q`" });
  }

  const query = parsed.data.q;
  const normalizedQuery = normalizeName(query);
  const isNumericQuery = /^\d+$/.test(query);

  if (!isNumericQuery && query.length < 2) {
    return res.status(200).json([]);
  }

  try {
    const result = await db
      .select({
        id: ranking.id,
        name: ranking.name,
        rank: ranking.rank,
        points: ranking.points,
        nation: ranking.nation,
      })
      .from(ranking)
      .where(
        or(
          ilike(ranking.name, `%${query}%`),
          ilike(ranking.normalizedName, `%${normalizedQuery}%`),
          isNumericQuery ? eq(ranking.id, Number(query)) : undefined,
        ),
      )
      .orderBy(asc(ranking.rank))
      .limit(15);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error searching pilot ranking");
    console.error(error);
    Sentry.captureException(error);
    return res.status(500).json({ message: "Internal error" });
  }
}
