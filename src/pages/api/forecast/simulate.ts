import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { asc, inArray } from "drizzle-orm";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/server/db";
import { ranking } from "@/server/db/schema";
import { calculateWPRS } from "@/utils/calculate-wprs";
import { calculateGender, calculateNationalities } from "@/utils/get-forecast";
import { buildPrefixSums, computeImpactContributions } from "@/utils/simulation-impact";
import { type ForecastSimulation } from "@/types/common";

const bodySchema = z.object({
  selectedPilotKeys: z.array(z.string().min(1)).max(1000),
  allPilots: z
    .array(
      z.object({
        key: z.string().min(1),
        civlId: z.number().int().positive().optional(),
      }),
    )
    .max(1000),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ForecastSimulation | { message: string }>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  try {
    const selectedPilotSet = new Set(parsed.data.selectedPilotKeys);
    const selectedPilots = parsed.data.allPilots.filter((pilot) =>
      selectedPilotSet.has(pilot.key),
    );
    const selectedCount = selectedPilots.length;
    const maxTopHalfCount = Math.floor((selectedCount + 1) / 2);

    const allCivlIds = [
      ...new Set(
        parsed.data.allPilots
          .map((pilot) => pilot.civlId)
          .filter(
            (civlId): civlId is number =>
              typeof civlId === "number" && civlId > 0,
          ),
      ),
    ];

    const rankedPilots =
      allCivlIds.length > 0
        ? await db.select().from(ranking).where(inArray(ranking.id, allCivlIds)).execute()
        : [];

    const rankedByCivlId = new Map(rankedPilots.map((pilot) => [pilot.id, pilot]));

    const selectedUniqueCivlIds = [
      ...new Set(
        selectedPilots
          .map((pilot) => pilot.civlId)
          .filter(
            (civlId): civlId is number =>
              typeof civlId === "number" && civlId > 0,
          ),
      ),
    ];

    const selectedRankedPilots = selectedUniqueCivlIds
      .map((civlId) => rankedByCivlId.get(civlId))
      .filter((pilot): pilot is (typeof rankedPilots)[number] => !!pilot);

    const topWorldRankings =
      maxTopHalfCount > 0
        ? await db
            .select({ points: ranking.points })
            .from(ranking)
            .orderBy(asc(ranking.rank))
            .limit(maxTopHalfCount)
        : [];
    const topWorldPrefixSums = buildPrefixSums(
      topWorldRankings.map((pilot) => pilot.points),
    );

    const contributions = computeImpactContributions({
      allPilots: parsed.data.allPilots,
      selectedPilotKeys: parsed.data.selectedPilotKeys,
      rankedByCivlId,
      topWorldPrefixSums,
    });

    const confirmed = await calculateWPRS(selectedRankedPilots, selectedCount);

    return res.status(200).json({
      confirmed,
      nationalities: calculateNationalities(selectedRankedPilots),
      genders: calculateGender(selectedRankedPilots),
      contributions,
    });
  } catch (error) {
    console.error("Error simulating forecast");
    console.error(error);
    Sentry.captureException(error);
    return res.status(500).json({ message: "Internal error" });
  }
}
