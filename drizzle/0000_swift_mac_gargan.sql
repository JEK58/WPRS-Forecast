-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE IF NOT EXISTS "CompRanking" (
	"id" serial PRIMARY KEY NOT NULL,
	"period" text NOT NULL,
	"name" text NOT NULL,
	"link" text,
	"discipline" text NOT NULL,
	"ta" double precision NOT NULL,
	"pn" double precision NOT NULL,
	"pq" double precision NOT NULL,
	"td" double precision NOT NULL,
	"tasks" integer NOT NULL,
	"pilots" integer NOT NULL,
	"pilotsLast12Months" integer NOT NULL,
	"compsLast12Months" integer NOT NULL,
	"daysSinceCompEnd" integer NOT NULL,
	"lastScore" double precision NOT NULL,
	"winnerScore" double precision NOT NULL,
	"resultsUpdated" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Ranking" (
	"id" integer PRIMARY KEY NOT NULL,
	"createdAt" timestamp(3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"name" text NOT NULL,
	"gender" text NOT NULL,
	"points" double precision NOT NULL,
	"rank" integer NOT NULL,
	"nation" text NOT NULL,
	"date" timestamp(3) NOT NULL,
	"normalizedName" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Usage" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp(3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"compUrl" text NOT NULL,
	"wprs" double precision,
	"compTitle" text,
	"error" text,
	"processingTime" double precision,
	"potentialWprs" double precision,
	"meta" jsonb,
	"pilotsUrl" text,
	"endDate" timestamp(3),
	"startDate" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pg_stat_statements" (
	"userid" "oid",
	"dbid" "oid",
	"queryid" bigint,
	"query" text,
	"plans" bigint,
	"total_plan_time" double precision,
	"min_plan_time" double precision,
	"max_plan_time" double precision,
	"mean_plan_time" double precision,
	"stddev_plan_time" double precision,
	"calls" bigint,
	"total_exec_time" double precision,
	"min_exec_time" double precision,
	"max_exec_time" double precision,
	"mean_exec_time" double precision,
	"stddev_exec_time" double precision,
	"rows" bigint,
	"shared_blks_hit" bigint,
	"shared_blks_read" bigint,
	"shared_blks_dirtied" bigint,
	"shared_blks_written" bigint,
	"local_blks_hit" bigint,
	"local_blks_read" bigint,
	"local_blks_dirtied" bigint,
	"local_blks_written" bigint,
	"temp_blks_read" bigint,
	"temp_blks_written" bigint,
	"blk_read_time" double precision,
	"blk_write_time" double precision,
	"wal_records" bigint,
	"wal_fpi" bigint,
	"wal_bytes" numeric
);

*/