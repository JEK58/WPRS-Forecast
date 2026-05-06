import type { NextApiRequest, NextApiResponse } from "next";
import { createHash } from "node:crypto";
import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/server/db";
import {
  competition,
  competitionResult,
  positionForecastSnapshot,
  ranking,
} from "@/server/db/schema";
import {
  forecastHistoricalPosition,
  type HistoricalPositionForecastInput,
} from "@/utils/historical-position-forecast";
import {
  type PositionForecastRequestContext,
  type PositionForecastResponse,
} from "@/types/common";

const civlIdSchema = z.number().int().positive();
const scenarioSchema = z.array(civlIdSchema).max(1000);
const forecastContextSchema = z.object({
  competitionUrl: z.string().url().optional(),
  pilotsUrl: z.string().url().optional(),
  competitionTitle: z.string().min(1).max(200).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const bodySchema = z.object({
  selectedCivlId: civlIdSchema,
  selectedPilotName: z.string().min(1).max(120).optional(),
  context: forecastContextSchema.optional(),
  scenarios: z
    .object({
      confirmed: scenarioSchema.optional(),
      registered: scenarioSchema.optional(),
    })
    .refine(
      (scenarios) =>
        scenarios.confirmed !== undefined || scenarios.registered !== undefined,
    ),
});

const scenarioKeys = ["confirmed", "registered"] as const;

type ForecastScenarioArgs = {
  selectedCivlId: number;
  participantCivlIds?: number[];
  historicalResults: HistoricalPositionForecastInput["historicalResults"];
  rankingPointsByCivlId: Map<number, number>;
};

export function forecastScenario({
  selectedCivlId,
  participantCivlIds,
  historicalResults,
  rankingPointsByCivlId,
}: ForecastScenarioArgs) {
  if (!participantCivlIds?.length) return null;

  return (
    forecastHistoricalPosition({
      selectedCivlId,
      participantCivlIds,
      historicalResults,
      rankingPointsByCivlId,
    }) ?? null
  );
}

export function createPositionForecastFieldSignature(civlIds: number[]) {
  const normalizedIds = [
    ...new Set(civlIds.filter((id) => Number.isInteger(id) && id > 0)),
  ].sort((a, b) => a - b);

  return createHash("sha256")
    .update(JSON.stringify(normalizedIds))
    .digest("hex");
}

export function buildPositionForecastSnapshotRows({
  selectedCivlId,
  selectedPilotName,
  context,
  scenarios,
  participantCivlIdsByScenario,
}: {
  selectedCivlId: number;
  selectedPilotName?: string;
  context?: PositionForecastRequestContext;
  scenarios: PositionForecastResponse["scenarios"];
  participantCivlIdsByScenario: Partial<Record<
    (typeof scenarioKeys)[number],
    number[] | undefined
  >>;
}) {
  if (!context?.competitionUrl) return [];

  const competitionUrl = context.competitionUrl;
  const now = new Date().toISOString();

  return scenarioKeys.flatMap((scenario) => {
    const forecast = scenarios[scenario];
    const participantCivlIds = participantCivlIdsByScenario[scenario] ?? [];

    if (!forecast || participantCivlIds.length === 0) return [];

    return {
      updatedAt: now,
      competitionUrl,
      pilotsUrl: context.pilotsUrl,
      competitionTitle: context.competitionTitle,
      startDate: context.startDate,
      endDate: context.endDate,
      scenario,
      selectedCivlId,
      selectedPilotName,
      fieldSize: forecast.totalPilots,
      fieldCivlIds: participantCivlIds,
      fieldSignature: createPositionForecastFieldSignature(participantCivlIds),
      predictedPosition: forecast.predictedPosition,
      expectedPlace: forecast.expectedPlace,
      likelyRangeLower: forecast.likelyRange.lower,
      likelyRangeUpper: forecast.likelyRange.upper,
      likelyRangeProbability: forecast.likelyRange.probability,
      winProbability: forecast.winProbability,
      podiumProbability: forecast.podiumProbability,
      topTenProbability: forecast.topTenProbability,
      confidence: forecast.confidence,
      selectedPilotCompetitionCount: forecast.selectedPilotCompetitionCount,
      directComparisonCount: forecast.directComparisonCount,
      opponentHistoryCoverage: forecast.opponentHistoryCoverage,
      forecast: forecast as unknown as Record<string, unknown>,
    };
  });
}

async function recordPositionForecastSnapshots({
  selectedCivlId,
  selectedPilotName,
  context,
  scenarios,
  participantCivlIdsByScenario,
}: {
  selectedCivlId: number;
  selectedPilotName?: string;
  context?: PositionForecastRequestContext;
  scenarios: PositionForecastResponse["scenarios"];
  participantCivlIdsByScenario: Partial<Record<
    (typeof scenarioKeys)[number],
    number[] | undefined
  >>;
}) {
  const rows = buildPositionForecastSnapshotRows({
    selectedCivlId,
    selectedPilotName,
    context,
    scenarios,
    participantCivlIdsByScenario,
  });

  if (rows.length === 0) return;

  for (const row of rows) {
    const existingSnapshots = await db
      .select({
        id: positionForecastSnapshot.id,
        evaluatedAt: positionForecastSnapshot.evaluatedAt,
      })
      .from(positionForecastSnapshot)
      .where(
        and(
          eq(positionForecastSnapshot.competitionUrl, row.competitionUrl),
          eq(positionForecastSnapshot.selectedCivlId, row.selectedCivlId),
          eq(positionForecastSnapshot.scenario, row.scenario),
          eq(positionForecastSnapshot.fieldSignature, row.fieldSignature),
        ),
      )
      .limit(1);
    const existingSnapshot = existingSnapshots[0];

    if (!existingSnapshot) {
      await db.insert(positionForecastSnapshot).values(row);
      continue;
    }

    if (existingSnapshot.evaluatedAt) continue;

    await db
      .update(positionForecastSnapshot)
      .set({
        updatedAt: new Date().toISOString(),
        pilotsUrl: row.pilotsUrl,
        competitionTitle: row.competitionTitle,
        startDate: row.startDate,
        endDate: row.endDate,
        selectedPilotName: row.selectedPilotName,
        fieldSize: row.fieldSize,
        fieldCivlIds: row.fieldCivlIds,
        predictedPosition: row.predictedPosition,
        expectedPlace: row.expectedPlace,
        likelyRangeLower: row.likelyRangeLower,
        likelyRangeUpper: row.likelyRangeUpper,
        likelyRangeProbability: row.likelyRangeProbability,
        winProbability: row.winProbability,
        podiumProbability: row.podiumProbability,
        topTenProbability: row.topTenProbability,
        confidence: row.confidence,
        selectedPilotCompetitionCount: row.selectedPilotCompetitionCount,
        directComparisonCount: row.directComparisonCount,
        opponentHistoryCoverage: row.opponentHistoryCoverage,
        forecast: row.forecast,
      })
      .where(eq(positionForecastSnapshot.id, existingSnapshot.id));
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PositionForecastResponse | { message: string }>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  try {
    const scenarioEntries = Object.entries(parsed.data.scenarios) as [
      keyof PositionForecastResponse["scenarios"],
      number[] | undefined,
    ][];
    const allCivlIds = [
      ...new Set([
        parsed.data.selectedCivlId,
        ...scenarioEntries.flatMap(([, civlIds]) => civlIds ?? []),
      ]),
    ];
    const hasForecastableScenario = scenarioEntries.some(
      ([, civlIds]) => (civlIds?.length ?? 0) > 0,
    );

    if (!hasForecastableScenario) {
      return res.status(200).json({
        scenarios: {
          confirmed: null,
          registered: null,
        },
      });
    }

    const [historicalResults, rankingRows] = await Promise.all([
      db
        .select({
          competitionRowId: competitionResult.competitionRowId,
          civlId: competitionResult.civlId,
          rank: competitionResult.rank,
          numberOfPilots: competition.numberOfPilots,
          endDate: competition.endDate,
        })
        .from(competitionResult)
        .innerJoin(
          competition,
          eq(competitionResult.competitionRowId, competition.id),
        )
        .where(inArray(competitionResult.civlId, allCivlIds)),
      db
        .select({
          civlId: ranking.id,
          points: ranking.points,
        })
        .from(ranking)
        .where(inArray(ranking.id, allCivlIds)),
    ]);
    const rankingPointsByCivlId = new Map(
      rankingRows.map((pilot) => [pilot.civlId, pilot.points]),
    );

    const scenarios = {
      confirmed: forecastScenario({
        selectedCivlId: parsed.data.selectedCivlId,
        participantCivlIds: parsed.data.scenarios.confirmed,
        historicalResults,
        rankingPointsByCivlId,
      }),
      registered: forecastScenario({
        selectedCivlId: parsed.data.selectedCivlId,
        participantCivlIds: parsed.data.scenarios.registered,
        historicalResults,
        rankingPointsByCivlId,
      }),
    };

    try {
      await recordPositionForecastSnapshots({
        selectedCivlId: parsed.data.selectedCivlId,
        selectedPilotName: parsed.data.selectedPilotName,
        context: parsed.data.context,
        scenarios,
        participantCivlIdsByScenario: parsed.data.scenarios,
      });
    } catch (error) {
      console.error("Error recording historical pilot position forecast");
      console.error(error);
      Sentry.captureException(error);
    }

    return res.status(200).json({
      scenarios: {
        confirmed: scenarios.confirmed,
        registered: scenarios.registered,
      },
    });
  } catch (error) {
    console.error("Error forecasting historical pilot position");
    console.error(error);
    Sentry.captureException(error);
    return res.status(500).json({ message: "Internal error" });
  }
}
