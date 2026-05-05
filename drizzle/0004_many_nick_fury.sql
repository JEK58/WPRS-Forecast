CREATE TABLE "Competition" (
	"id" serial PRIMARY KEY NOT NULL,
	"competitionId" integer NOT NULL,
	"schemaVersion" integer NOT NULL,
	"sourceUrl" text NOT NULL,
	"competitionName" text NOT NULL,
	"period" text NOT NULL,
	"startDate" date NOT NULL,
	"endDate" date NOT NULL,
	"discipline" text NOT NULL,
	"ta" double precision NOT NULL,
	"pn" double precision NOT NULL,
	"pq" double precision NOT NULL,
	"td" double precision NOT NULL,
	"tasks" integer NOT NULL,
	"pqSrp" double precision NOT NULL,
	"pqSrtp" double precision NOT NULL,
	"numberOfPilots" integer NOT NULL,
	"pqRankDate" integer,
	"pilotsLast12Months" integer NOT NULL,
	"competitionsLast12Months" integer NOT NULL,
	"daysSinceEnd" integer NOT NULL,
	"lastScore" double precision NOT NULL,
	"winnerScore" double precision NOT NULL,
	"resultsUpdated" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CompetitionResult" (
	"competitionRowId" integer NOT NULL,
	"civlId" integer NOT NULL,
	"rank" integer NOT NULL,
	"pointFactor" double precision NOT NULL,
	"points" double precision NOT NULL,
	"timeDevaluatedPoints" double precision NOT NULL,
	"competitionScore" integer NOT NULL,
	"pilotName" text NOT NULL,
	"nation" text NOT NULL,
	CONSTRAINT "CompetitionResult_competitionRowId_civlId_pk" PRIMARY KEY("competitionRowId","civlId")
);
--> statement-breakpoint
ALTER TABLE "CompetitionResult" ADD CONSTRAINT "CompetitionResult_competitionRowId_Competition_id_fk" FOREIGN KEY ("competitionRowId") REFERENCES "public"."Competition"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "Competition_competitionId_sourceUrl_idx" ON "Competition" USING btree ("competitionId","sourceUrl");--> statement-breakpoint
CREATE INDEX "CompetitionResult_civlId_idx" ON "CompetitionResult" USING btree ("civlId");