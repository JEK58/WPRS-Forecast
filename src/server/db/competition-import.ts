import { z } from "zod";

const competitorSchema = z.object({
  rank: z.number().int(),
  point_factor: z.number(),
  points: z.number(),
  time_devaluated_points: z.number(),
  competition_score: z.number().int(),
  pilot_name: z.string().min(1),
  nation: z.string().min(1),
  civl_id: z.number().int(),
});

const competitionSummarySchema = z.object({
  period: z.string().min(1),
  discipline: z.string().min(1),
  ta: z.number(),
  pn: z.number(),
  pq: z.number(),
  td: z.number(),
  tasks: z.number().int(),
  pq_srp: z.number(),
  pq_srtp: z.number(),
  number_of_pilots: z.number().int(),
  pq_rank_date: z.number().int().nullable(),
  pilots_last_12_months: z.number().int(),
  competitions_last_12_months: z.number().int(),
  days_since_end: z.number().int(),
  last_score: z.number(),
  winner_score: z.number(),
  results_updated: z.string(),
});

export const competitionImportSchema = z.object({
  schema_version: z.number().int(),
  competition_id: z.number().int(),
  source_url: z.string().url(),
  competition_name: z.string().min(1),
  summary: competitionSummarySchema,
  competitors: z.array(competitorSchema),
});

export type CompetitionImportRecord = z.infer<typeof competitionImportSchema>;

export function parseCompetitionPeriod(period: string) {
  const parts = period
    .split("\n")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length !== 2) {
    throw new Error(`Expected period to contain two dates, received: "${period}"`);
  }

  const [startDate, endDate] = parts as [string, string];

  return {
    startDate: parseCompetitionDate(startDate),
    endDate: parseCompetitionDate(endDate),
  };
}

function parseCompetitionDate(value: string) {
  const parsed = new Date(`${value} UTC`);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid competition date: "${value}"`);
  }

  return parsed.toISOString().slice(0, 10);
}

export function mapCompetitionImport(record: CompetitionImportRecord) {
  const parsedRecord = competitionImportSchema.parse(record);
  const { startDate, endDate } = parseCompetitionPeriod(
    parsedRecord.summary.period,
  );

  return {
    competition: {
      competitionId: parsedRecord.competition_id,
      schemaVersion: parsedRecord.schema_version,
      sourceUrl: parsedRecord.source_url,
      competitionName: parsedRecord.competition_name,
      period: parsedRecord.summary.period,
      startDate,
      endDate,
      discipline: parsedRecord.summary.discipline,
      ta: parsedRecord.summary.ta,
      pn: parsedRecord.summary.pn,
      pq: parsedRecord.summary.pq,
      td: parsedRecord.summary.td,
      tasks: parsedRecord.summary.tasks,
      pqSrp: parsedRecord.summary.pq_srp,
      pqSrtp: parsedRecord.summary.pq_srtp,
      numberOfPilots: parsedRecord.summary.number_of_pilots,
      pqRankDate: parsedRecord.summary.pq_rank_date,
      pilotsLast12Months: parsedRecord.summary.pilots_last_12_months,
      competitionsLast12Months: parsedRecord.summary.competitions_last_12_months,
      daysSinceEnd: parsedRecord.summary.days_since_end,
      lastScore: parsedRecord.summary.last_score,
      winnerScore: parsedRecord.summary.winner_score,
      resultsUpdated: parsedRecord.summary.results_updated,
    },
    competitors: parsedRecord.competitors.map((competitor) => ({
      civlId: competitor.civl_id,
      rank: competitor.rank,
      pointFactor: competitor.point_factor,
      points: competitor.points,
      timeDevaluatedPoints: competitor.time_devaluated_points,
      competitionScore: competitor.competition_score,
      pilotName: competitor.pilot_name,
      nation: competitor.nation,
    })),
  };
}
