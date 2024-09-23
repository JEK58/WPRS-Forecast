import {
  pgTable,
  serial,
  text,
  doublePrecision,
  integer,
  timestamp,
  jsonb,
  uuid,
} from "drizzle-orm/pg-core";

export const compRanking = pgTable("CompRanking", {
  id: serial("id").primaryKey().notNull(),
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
