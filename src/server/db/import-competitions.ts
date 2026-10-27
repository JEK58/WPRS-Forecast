import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { competition, competitionResult } from "@/server/db/schema";
import {
  mapCompetitionImport,
  competitionImportSchema,
} from "./competition-import";

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
