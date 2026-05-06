import { readFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";

import { closeDbConnection, db } from "@/server/db";
import { competition, competitionResult } from "@/server/db/schema";
import {
  mapCompetitionImport,
  competitionImportSchema,
} from "./competition-import";

const DEFAULT_INPUT_PATH = path.join(process.cwd(), "tmp", "competitions.json");

export async function importCompetitionRecords(records: unknown) {
  const parsedCompetitions = competitionImportSchema.array().parse(records);
  let insertedResults = 0;

  await db.transaction(async (tx) => {
    for (const record of parsedCompetitions) {
      const mapped = mapCompetitionImport(record);

      const [competitionRow] = await tx
        .insert(competition)
        .values(mapped.competition)
        .onConflictDoUpdate({
          target: [competition.competitionId, competition.sourceUrl],
          set: mapped.competition,
        })
        .returning({ id: competition.id });

      if (!competitionRow) {
        throw new Error(
          `Failed to upsert competition ${record.competition_id} from ${record.source_url}`,
        );
      }

      await tx
        .delete(competitionResult)
        .where(eq(competitionResult.competitionRowId, competitionRow.id));

      if (mapped.competitors.length === 0) continue;

      insertedResults += mapped.competitors.length;
      await tx.insert(competitionResult).values(
        mapped.competitors.map((competitor) => ({
          competitionRowId: competitionRow.id,
          ...competitor,
        })),
      );
    }
  });

  return {
    imported: parsedCompetitions.length,
    results: insertedResults,
  };
}

async function importCompetitions(filePath = DEFAULT_INPUT_PATH) {
  const fileContents = await readFile(filePath, "utf8");
  const parsedFile = JSON.parse(fileContents) as unknown;
  const result = await importCompetitionRecords(parsedFile);

  console.log(
    `Imported ${result.imported} competitions and ${result.results} competition results from ${filePath}`,
  );
}

const filePath = process.argv[2] ?? DEFAULT_INPUT_PATH;

if (process.argv[1]?.endsWith("import-competitions.ts")) {
  importCompetitions(filePath)
    .then(() => closeDbConnection())
    .catch(async (error) => {
      console.error("Competition import failed");
      console.error(error);
      await closeDbConnection();
      process.exit(1);
    });
}
