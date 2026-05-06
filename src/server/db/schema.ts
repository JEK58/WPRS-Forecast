import {
  date,
  index,
  primaryKey,
  pgTable,
  text,
  doublePrecision,
  integer,
  timestamp,
  jsonb,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const compRanking = pgTable("CompRanking", {
  id: integer("id")
    .primaryKey()
    .generatedAlwaysAsIdentity({ cache: 1 })
    .notNull(),
  period: text("period").notNull(),
  name: text("name").notNull(),
  link: text("link"),
  discipline: text("discipline").notNull(),
  ta: doublePrecision("ta").notNull(),
  pn: doublePrecision("pn").notNull(),
  pq: doublePrecision("pq").notNull(),
  td: doublePrecision("td").notNull(),
  tasks: integer("tasks").notNull(),
  pilots: integer("pilots").notNull(),
  pilotsLast12Months: integer("pilotsLast12Months").notNull(),
  compsLast12Months: integer("compsLast12Months").notNull(),
  daysSinceCompEnd: integer("daysSinceCompEnd").notNull(),
  lastScore: doublePrecision("lastScore").notNull(),
  winnerScore: doublePrecision("winnerScore").notNull(),
  resultsUpdated: timestamp("resultsUpdated", {
    precision: 3,
    mode: "string",
  }).notNull(),
});

export const usage = pgTable("Usage", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt", {
    precision: 3,
    mode: "string",
  })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", {
    precision: 3,
    mode: "string",
  })
    .defaultNow()
    .notNull(),
  compUrl: text("compUrl").notNull(),
  civlId: integer("civlId"),
  civlName: text("civlName"),
  wprs: doublePrecision("wprs"),
  compTitle: text("compTitle"),
  error: text("error"),
  processingTime: doublePrecision("processingTime"),
  potentialWprs: doublePrecision("potentialWprs"),
  meta: jsonb("meta"),
  pilotsUrl: text("pilotsUrl"),
  endDate: timestamp("endDate", {
    precision: 3,
    mode: "string",
  }),
  startDate: timestamp("startDate", {
    precision: 3,
    mode: "string",
  }),
});

export const ranking = pgTable("Ranking", {
  id: integer("id").primaryKey().notNull(),
  createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3, mode: "string" })
    .notNull()
    .defaultNow(),
  name: text("name").notNull(),
  gender: text("gender").notNull(),
  points: doublePrecision("points").notNull(),
  rank: integer("rank").notNull(),
  nation: text("nation").notNull(),
  date: timestamp("date", { precision: 3, mode: "string" }).notNull(),
  normalizedName: text("normalizedName"),
});

export const competition = pgTable(
  "Competition",
  {
    id: integer("id")
      .primaryKey()
      .generatedAlwaysAsIdentity({ cache: 1 })
      .notNull(),
    competitionId: integer("competitionId").notNull(),
    schemaVersion: integer("schemaVersion").notNull(),
    sourceUrl: text("sourceUrl").notNull(),
    competitionName: text("competitionName").notNull(),
    period: text("period").notNull(),
    startDate: date("startDate", { mode: "string" }).notNull(),
    endDate: date("endDate", { mode: "string" }).notNull(),
    discipline: text("discipline").notNull(),
    ta: doublePrecision("ta").notNull(),
    pn: doublePrecision("pn").notNull(),
    pq: doublePrecision("pq").notNull(),
    td: doublePrecision("td").notNull(),
    tasks: integer("tasks").notNull(),
    pqSrp: doublePrecision("pqSrp").notNull(),
    pqSrtp: doublePrecision("pqSrtp").notNull(),
    numberOfPilots: integer("numberOfPilots").notNull(),
    pqRankDate: integer("pqRankDate"),
    pilotsLast12Months: integer("pilotsLast12Months").notNull(),
    competitionsLast12Months: integer("competitionsLast12Months").notNull(),
    daysSinceEnd: integer("daysSinceEnd").notNull(),
    lastScore: doublePrecision("lastScore").notNull(),
    winnerScore: doublePrecision("winnerScore").notNull(),
    resultsUpdated: text("resultsUpdated").notNull(),
  },
  (table) => [
    uniqueIndex("Competition_competitionId_sourceUrl_idx").on(
      table.competitionId,
      table.sourceUrl,
    ),
  ],
);

export const competitionResult = pgTable(
  "CompetitionResult",
  {
    competitionRowId: integer("competitionRowId")
      .notNull()
      .references(() => competition.id, { onDelete: "cascade" }),
    civlId: integer("civlId").notNull(),
    rank: integer("rank").notNull(),
    pointFactor: doublePrecision("pointFactor").notNull(),
    points: doublePrecision("points").notNull(),
    timeDevaluatedPoints: doublePrecision("timeDevaluatedPoints").notNull(),
    competitionScore: integer("competitionScore").notNull(),
    pilotName: text("pilotName").notNull(),
    nation: text("nation").notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.competitionRowId, table.civlId],
      name: "CompetitionResult_competitionRowId_civlId_pk",
    }),
    index("CompetitionResult_civlId_idx").on(table.civlId),
  ],
);

export const positionForecastSnapshot = pgTable(
  "PositionForecastSnapshot",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    createdAt: timestamp("createdAt", {
      precision: 3,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", {
      precision: 3,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
    competitionUrl: text("competitionUrl").notNull(),
    pilotsUrl: text("pilotsUrl"),
    competitionTitle: text("competitionTitle"),
    startDate: timestamp("startDate", {
      precision: 3,
      mode: "string",
    }),
    endDate: timestamp("endDate", {
      precision: 3,
      mode: "string",
    }),
    scenario: text("scenario").notNull(),
    selectedCivlId: integer("selectedCivlId").notNull(),
    selectedPilotName: text("selectedPilotName"),
    fieldSize: integer("fieldSize").notNull(),
    fieldCivlIds: jsonb("fieldCivlIds").$type<number[]>().notNull(),
    fieldSignature: text("fieldSignature").notNull(),
    predictedPosition: integer("predictedPosition").notNull(),
    expectedPlace: doublePrecision("expectedPlace").notNull(),
    likelyRangeLower: integer("likelyRangeLower").notNull(),
    likelyRangeUpper: integer("likelyRangeUpper").notNull(),
    likelyRangeProbability: doublePrecision("likelyRangeProbability").notNull(),
    winProbability: doublePrecision("winProbability").notNull(),
    podiumProbability: doublePrecision("podiumProbability").notNull(),
    topTenProbability: doublePrecision("topTenProbability").notNull(),
    confidence: text("confidence").notNull(),
    selectedPilotCompetitionCount: integer(
      "selectedPilotCompetitionCount",
    ).notNull(),
    directComparisonCount: integer("directComparisonCount").notNull(),
    opponentHistoryCoverage: doublePrecision(
      "opponentHistoryCoverage",
    ).notNull(),
    forecast: jsonb("forecast").$type<Record<string, unknown>>().notNull(),
  },
  (table) => [
    uniqueIndex(
      "PositionForecastSnapshot_competition_pilot_scenario_field_idx",
    ).on(
      table.competitionUrl,
      table.selectedCivlId,
      table.scenario,
      table.fieldSignature,
    ),
    index("PositionForecastSnapshot_selectedCivlId_idx").on(
      table.selectedCivlId,
    ),
    index("PositionForecastSnapshot_competitionUrl_idx").on(
      table.competitionUrl,
    ),
    index("PositionForecastSnapshot_endDate_idx").on(table.endDate),
  ],
);
