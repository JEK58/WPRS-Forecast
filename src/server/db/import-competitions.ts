import { readFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { competition, competitionResult } from "@/server/db/schema";
import {
  mapCompetitionImport,
  competitionImportSchema,
} from "./competition-import";

const DEFAULT_INPUT_PATH = path.join(process.cwd(), "tmp", "competitions.json");

async function importCompetitions(filePath = DEFAULT_INPUT_PATH) {
  const fileContents = await readFile(filePath, "utf8");
  const parsedFile = JSON.parse(fileContents) as unknown;
  const parsedCompetitions = competitionImportSchema.array().parse(parsedFile);

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

      await tx.insert(competitionResult).values(
        mapped.competitors.map((competitor) => ({
          competitionRowId: competitionRow.id,
          ...competitor,
        })),
      );
    }
  });

  console.log(
    `Imported ${parsedCompetitions.length} competitions from ${filePath}`,
  );
}

const filePath = process.argv[2] ?? DEFAULT_INPUT_PATH;

importCompetitions(filePath).catch((error) => {
  console.error("Competition import failed");
  console.error(error);
  process.exit(1);
});
