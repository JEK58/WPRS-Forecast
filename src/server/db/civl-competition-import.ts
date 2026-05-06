import { inArray, sql } from "drizzle-orm";
import { load, type CheerioAPI } from "cheerio";

import { db } from "@/server/db";
import { competition, competitionResult } from "@/server/db/schema";
import { competitionImportSchema } from "@/server/db/competition-import";
import { importCompetitionRecords } from "@/server/db/import-competitions";

const BASE_URL = "https://civlcomps.org";
const COMPETITIONS_URL = `${BASE_URL}/ranking/paragliding-xc/competitions`;
const RECENT_DAYS = 62;
const DETAIL_CONCURRENCY = 4;

const LIST_COLUMNS = [
  "period",
  "name",
  "discipline",
  "ta",
  "pn",
  "pq",
  "td",
  "tasks",
  "pilots",
  "pilots_last_12_months",
  "competitions_last_12_months",
  "days_since_end",
  "last_score",
  "winner_score",
  "results_updated",
] as const;

const SUMMARY_COLUMNS = [
  "period",
  "discipline",
  "ta",
  "pn",
  "pq",
  "td",
  "tasks",
  "pq_srp",
  "pq_srtp",
  "number_of_pilots",
  "pq_rank_date",
  "pilots_last_12_months",
  "competitions_last_12_months",
  "days_since_end",
  "last_score",
  "winner_score",
  "results_updated",
] as const;

type CivlCompetitionCandidate = {
  competitionId: number;
  name: string;
  sourceUrl: string;
  daysSinceEnd: number;
  resultsUpdated: string;
};

type CandidateImportReason = "missing" | "changed";

type CivlCompetitionCandidateToImport = CivlCompetitionCandidate & {
  importReason: CandidateImportReason;
};

type ImportFailure = {
  competitionId: number;
  sourceUrl: string;
  message: string;
};

export type RecentCompetitionImportSummary = {
  candidates: number;
  imported: number;
  skipped: number;
  failed: number;
  failures: ImportFailure[];
};

type ExistingCompetition = {
  competitionId: number;
  sourceUrl: string;
  resultsUpdated: string;
};

export async function importRecentCivlCompetitions() {
  const listHtml = await fetchText(COMPETITIONS_URL);
  const recentCandidates = parseCivlCompetitionCandidates(listHtml).filter(
    (candidate) => candidate.daysSinceEnd <= RECENT_DAYS,
  );
  const candidatesToImport =
    await filterMissingOrChangedCompetitions(recentCandidates);
  const failures: ImportFailure[] = [];
  let imported = 0;

  await mapWithConcurrency(
    candidatesToImport,
    DETAIL_CONCURRENCY,
    async (candidate) => {
      try {
        const detailHtml = await fetchText(candidate.sourceUrl);
        const record = parseCivlCompetitionDetail(
          detailHtml,
          candidate.sourceUrl,
          candidate.name,
        );
        const result = await importCompetitionRecords([record]);
        imported += result.imported;
        logImportedCompetition(candidate, result.results);
      } catch (error) {
        failures.push({
          competitionId: candidate.competitionId,
          sourceUrl: candidate.sourceUrl,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );
  await logDbImportTarget();

  return {
    candidates: recentCandidates.length,
    imported,
    skipped: recentCandidates.length - candidatesToImport.length,
    failed: failures.length,
    failures,
  } satisfies RecentCompetitionImportSummary;
}

export function parseCivlCompetitionCandidates(html: string) {
  const $ = load(html);
  const table =
    findTableByRequiredHeaders($, ["Period", "Name", "Results Updated"]) ??
    $("#tableMain").first();
  const rows = table.find("tr").slice(1);

  return rows
    .map((_, row) => {
      const cells = $(row).find("td");
      if (cells.length < LIST_COLUMNS.length) return null;

      const href = cells.eq(1).find("a[href]").attr("href");
      if (!href) return null;

      const sourceUrl = new URL(href, BASE_URL).toString();
      const competitionId = extractCompetitionId(sourceUrl);
      const daysSinceEnd = toNumber(cellText($, cells, 11));
      const resultsUpdated = cellText($, cells, 14);

      if (competitionId === null || daysSinceEnd === null || !resultsUpdated) {
        return null;
      }

      return {
        competitionId,
        name: cellText($, cells, 1),
        sourceUrl,
        daysSinceEnd,
        resultsUpdated,
      } satisfies CivlCompetitionCandidate;
    })
    .get()
    .filter((candidate) => candidate !== null);
}

export function parseCivlCompetitionDetail(
  html: string,
  sourceUrl: string,
  fallbackName = "",
) {
  const $ = load(html);
  const summary = parseSummaryTable($);
  const competitors = parseCompetitorRows($);
  const competitionId = extractCompetitionId(sourceUrl);

  if (summary.number_of_pilots > 0 && competitors.length === 0) {
    throw new Error(
      `Could not parse CIVL competition competitors from ${sourceUrl}`,
    );
  }

  if (competitionId === null) {
    throw new Error(`CIVL competition id not found in URL: ${sourceUrl}`);
  }

  const record = {
    schema_version: 5,
    competition_id: competitionId,
    source_url: sourceUrl,
    competition_name: parseCompetitionName($) || fallbackName,
    summary,
    competitors,
  };

  return competitionImportSchema.parse(record);
}

export function selectMissingOrChangedCompetitionCandidates(
  candidates: CivlCompetitionCandidate[],
  existingCompetitions: ExistingCompetition[],
): CivlCompetitionCandidateToImport[] {
  const existingByKey = new Map(
    existingCompetitions.map((existing) => [
      getCompetitionKey(existing.competitionId, existing.sourceUrl),
      existing,
    ]),
  );
  const candidatesToImport: CivlCompetitionCandidateToImport[] = [];

  for (const candidate of candidates) {
    const existing = existingByKey.get(
      getCompetitionKey(candidate.competitionId, candidate.sourceUrl),
    );

    if (!existing) {
      candidatesToImport.push({ ...candidate, importReason: "missing" });
      continue;
    }

    if (existing.resultsUpdated !== candidate.resultsUpdated) {
      candidatesToImport.push({ ...candidate, importReason: "changed" });
    }
  }

  return candidatesToImport;
}

async function filterMissingOrChangedCompetitions(
  candidates: CivlCompetitionCandidate[],
) {
  if (candidates.length === 0) return [];

  const sourceUrls = candidates.map((candidate) => candidate.sourceUrl);
  const existingCompetitions = await db
    .select({
      competitionId: competition.competitionId,
      sourceUrl: competition.sourceUrl,
      resultsUpdated: competition.resultsUpdated,
    })
    .from(competition)
    .where(inArray(competition.sourceUrl, sourceUrls));

  return selectMissingOrChangedCompetitionCandidates(
    candidates,
    existingCompetitions,
  );
}

function parseSummaryTable($: CheerioAPI) {
  const table = findTableByRequiredHeaders($, ["Period", "Results Updated"]);
  const cells = table?.find("tr").eq(1).find("td");

  if (!cells || cells.length < SUMMARY_COLUMNS.length) {
    throw new Error("Could not find CIVL competition summary table");
  }

  return {
    period: cellText($, cells, 0, true),
    discipline: cellText($, cells, 1),
    ta: requiredNumber(cellText($, cells, 2), "ta"),
    pn: requiredNumber(cellText($, cells, 3), "pn"),
    pq: requiredNumber(cellText($, cells, 4), "pq"),
    td: requiredNumber(cellText($, cells, 5), "td"),
    tasks: requiredInteger(cellText($, cells, 6), "tasks"),
    pq_srp: requiredNumber(cellText($, cells, 7), "pq_srp"),
    pq_srtp: requiredNumber(cellText($, cells, 8), "pq_srtp"),
    number_of_pilots: requiredInteger(
      cellText($, cells, 9),
      "number_of_pilots",
    ),
    pq_rank_date: nullableInteger(cellText($, cells, 10)),
    pilots_last_12_months: requiredInteger(
      cellText($, cells, 11),
      "pilots_last_12_months",
    ),
    competitions_last_12_months: requiredInteger(
      cellText($, cells, 12),
      "competitions_last_12_months",
    ),
    days_since_end: requiredInteger(cellText($, cells, 13), "days_since_end"),
    last_score: requiredNumber(cellText($, cells, 14), "last_score"),
    winner_score: requiredNumber(cellText($, cells, 15), "winner_score"),
    results_updated: cellText($, cells, 16),
  };
}

function parseCompetitorRows($: CheerioAPI) {
  const competitorTables = $("table")
    .filter((_, table) => {
      const headers = new Set(tableHeaders($, $(table)));
      return headers.has("rank") && headers.has("civl id");
    })
    .toArray();

  for (const table of competitorTables) {
    const competitors = $(table)
      .find("tr")
      .slice(1)
      .map((_, row) => {
        const cells = $(row).find("td");
        if (cells.length < 8) return null;

        const rank = toNumber(cellText($, cells, 0));
        const pointFactor = toNumber(cellText($, cells, 1));
        const points = toNumber(cellText($, cells, 2));
        const timeDevaluatedPoints = toNumber(cellText($, cells, 3));
        const competitionScore = toNumber(cellText($, cells, 4));
        const pilotName = cellText($, cells, 5);
        const nation = cellText($, cells, 6);
        const civlId = toNumber(cellText($, cells, 7));

        if (
          rank === null ||
          pointFactor === null ||
          points === null ||
          timeDevaluatedPoints === null ||
          competitionScore === null ||
          civlId === null ||
          !pilotName ||
          !/^[A-Z]{3}$/.test(nation)
        ) {
          return null;
        }

        return {
          rank,
          point_factor: pointFactor,
          points,
          time_devaluated_points: timeDevaluatedPoints,
          competition_score: competitionScore,
          pilot_name: pilotName,
          nation,
          civl_id: civlId,
        };
      })
      .get()
      .filter((competitor) => competitor !== null);

    if (competitors.length > 0) return competitors;
  }

  return [];
}

function parseCompetitionName($: CheerioAPI) {
  const headings = $("h1, h2, h3")
    .map((_, heading) => cleanText($(heading).text()))
    .get();
  const heading = headings.find(
    (text) => text && text.toLowerCase() !== "detail competition ranking",
  );

  if (heading) return heading;

  return cleanText(
    $("title")
      .text()
      .replace(/detail competition ranking/i, ""),
  );
}

function findTableByRequiredHeaders($: CheerioAPI, requiredHeaders: string[]) {
  const required = new Set(requiredHeaders.map(cleanHeader));

  const table = $("table")
    .filter((_, table) => {
      const headers = new Set(tableHeaders($, $(table)));
      return [...required].every((header) => headers.has(header));
    })
    .first();

  return table.length > 0 ? table : undefined;
}

function tableHeaders($: CheerioAPI, table: ReturnType<CheerioAPI>) {
  return table
    .find("tr")
    .first()
    .find("th, td")
    .map((_, header) => cleanHeader($(header).text()))
    .get();
}

function cellText(
  $: CheerioAPI,
  cells: ReturnType<CheerioAPI>,
  index: number,
  preserveBreaks = false,
) {
  const separator = preserveBreaks ? "\n" : " ";
  const text = cells
    .eq(index)
    .contents()
    .map((_, content) => {
      if (content.type === "tag" && content.name === "br") return "\n";
      return $(content).text();
    })
    .get()
    .join(separator);

  return preserveBreaks ? cleanMultilineText(text) : cleanText(text);
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function cleanMultilineText(value: string) {
  return value
    .replace(/[ \t]+/g, " ")
    .replace(/\n+/g, "\n")
    .trim();
}

function cleanHeader(value: string) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[()/]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function toNumber(value: string) {
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) return null;

  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? null : parsed;
}

function requiredNumber(value: string, field: string) {
  const parsed = toNumber(value);
  if (parsed === null) throw new Error(`Missing numeric CIVL field: ${field}`);
  return parsed;
}

function requiredInteger(value: string, field: string) {
  return Math.trunc(requiredNumber(value, field));
}

function nullableInteger(value: string) {
  const parsed = toNumber(value);
  return parsed === null ? null : Math.trunc(parsed);
}

function extractCompetitionId(sourceUrl: string) {
  const id = new URL(sourceUrl).searchParams.get("id");
  if (!id) return null;

  const parsed = Number(id);
  return Number.isInteger(parsed) ? parsed : null;
}

function getCompetitionKey(competitionId: number, sourceUrl: string) {
  return `${competitionId}:${sourceUrl}`;
}

function logImportedCompetition(
  candidate: CivlCompetitionCandidateToImport,
  resultCount: number,
) {
  const action =
    candidate.importReason === "missing"
      ? "Added new CIVL competition"
      : "Updated CIVL competition";

  console.info(action, {
    competitionId: candidate.competitionId,
    name: candidate.name,
    sourceUrl: candidate.sourceUrl,
    resultsUpdated: candidate.resultsUpdated,
    resultCount,
  });
}

async function logDbImportTarget() {
  const [target] = await db
    .select({
      database: sql<string>`current_database()`,
      schema: sql<string>`current_schema()`,
      address: sql<string>`inet_server_addr()::text`,
      port: sql<number>`inet_server_port()`,
      competitions: sql<number>`count(distinct ${competition.id})::int`,
      results: sql<number>`count(${competitionResult.civlId})::int`,
    })
    .from(competition)
    .leftJoin(
      competitionResult,
      sql`${competitionResult.competitionRowId} = ${competition.id}`,
    );

  console.info("CIVL competition import DB target", target);
}

async function fetchText(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
  return res.text();
}

async function mapWithConcurrency<T>(
  items: T[],
  concurrency: number,
  callback: (item: T) => Promise<void>,
) {
  const queue = [...items];
  const workers = Array.from(
    { length: Math.min(concurrency, queue.length) },
    async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (item) await callback(item);
      }
    },
  );

  await Promise.all(workers);
}
