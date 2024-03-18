import {
  pgTable,
  serial,
  text,
  doublePrecision,
  integer,
  timestamp,
  jsonb,
  bigint,
  numeric,
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

export const ranking = pgTable("Ranking", {
  id: integer("id").primaryKey().notNull(),
  createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3, mode: "string" }).notNull(),
  name: text("name").notNull(),
  gender: text("gender").notNull(),
  points: doublePrecision("points").notNull(),
  rank: integer("rank").notNull(),
  nation: text("nation").notNull(),
  date: timestamp("date", { precision: 3, mode: "string" }).notNull(),
  normalizedName: text("normalizedName"),
});

export const usage = pgTable("Usage", {
  id: text("id").primaryKey().notNull(),
  createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3, mode: "string" }).notNull(),
  compUrl: text("compUrl").notNull(),
  wprs: doublePrecision("wprs"),
  compTitle: text("compTitle"),
  error: text("error"),
  processingTime: doublePrecision("processingTime"),
  potentialWprs: doublePrecision("potentialWprs"),
  meta: jsonb("meta"),
  pilotsUrl: text("pilotsUrl"),
  endDate: timestamp("endDate", { precision: 3, mode: "string" }),
  startDate: timestamp("startDate", { precision: 3, mode: "string" }),
});

export const pgStatStatements = pgTable("pg_stat_statements", {
  // TODO: failed to parse database type 'oid'
  userid: unknown("userid"),
  // TODO: failed to parse database type 'oid'
  dbid: unknown("dbid"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  queryid: bigint("queryid", { mode: "number" }),
  query: text("query"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  plans: bigint("plans", { mode: "number" }),
  totalPlanTime: doublePrecision("total_plan_time"),
  minPlanTime: doublePrecision("min_plan_time"),
  maxPlanTime: doublePrecision("max_plan_time"),
  meanPlanTime: doublePrecision("mean_plan_time"),
  stddevPlanTime: doublePrecision("stddev_plan_time"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  calls: bigint("calls", { mode: "number" }),
  totalExecTime: doublePrecision("total_exec_time"),
  minExecTime: doublePrecision("min_exec_time"),
  maxExecTime: doublePrecision("max_exec_time"),
  meanExecTime: doublePrecision("mean_exec_time"),
  stddevExecTime: doublePrecision("stddev_exec_time"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  rows: bigint("rows", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  sharedBlksHit: bigint("shared_blks_hit", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  sharedBlksRead: bigint("shared_blks_read", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  sharedBlksDirtied: bigint("shared_blks_dirtied", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  sharedBlksWritten: bigint("shared_blks_written", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  localBlksHit: bigint("local_blks_hit", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  localBlksRead: bigint("local_blks_read", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  localBlksDirtied: bigint("local_blks_dirtied", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  localBlksWritten: bigint("local_blks_written", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  tempBlksRead: bigint("temp_blks_read", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  tempBlksWritten: bigint("temp_blks_written", { mode: "number" }),
  blkReadTime: doublePrecision("blk_read_time"),
  blkWriteTime: doublePrecision("blk_write_time"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  walRecords: bigint("wal_records", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  walFpi: bigint("wal_fpi", { mode: "number" }),
  walBytes: numeric("wal_bytes"),
});
