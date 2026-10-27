import { readFile } from "node:fs/promises";
import path from "node:path";

import { closeDbConnection } from "@/server/db";
import { importCompetitionRecords } from "./import-competitions";

const filePath =
  process.argv[2] ?? path.join(process.cwd(), "tmp", "competitions.json");

try {
  const fileContents = await readFile(filePath, "utf8");
  const result = await importCompetitionRecords(JSON.parse(fileContents));

  console.log(
    `Imported ${result.imported} competitions and ${result.results} competition results from ${filePath}`,
  );
} catch (error) {
  console.error("Competition import failed", error);
  process.exitCode = 1;
} finally {
  await closeDbConnection();
}
