/* eslint-disable drizzle/enforce-delete-with-where */
import MiniSearch from "minisearch";
import { algoliasearch } from "algoliasearch";
import { env } from "@/env.js";
import { db } from "@/server/db";
import { ranking } from "@/server/db/schema";
import { type InferSelectModel, inArray, or, sql } from "drizzle-orm";
import * as Sentry from "@sentry/nextjs";
import { redis } from "@/server/cache/redis";
import { normalizeName } from "@/utils/normalize-name";

export const CIVL_PLACEHOLDER_ID = 99999;
const REDIS_EXP_TIME = 60 * 60 * 24 * 10; // 10 days
type Ranking = InferSelectModel<typeof ranking>;
type SearchIndexEntry = Pick<Ranking, "id" | "name"> & {
  normalizedName: string;
};

/**
 * Looks up the CIVL ID for each pilot in the list.
 * As some names will not have exact matches due to special
 * characters like "é", typos, reversed order of firstname/lastname, or optional middlenames there are
 * multiple steps involved:
 *
 * Check if...
 * 1. the pilot is already in the cache
 * 2. the pilot can be found in the DB
 * 3. the pilot can be found fuzzysearch
 * 4. the pilot can be found with algolia
 *
 * If a pilot still can't be found, a placeholder value is used for the CIVL ID.
 */
export async function getCivlIds(pilots: string[], disableAlgolia?: boolean) {

  const startTime = performance.now();
  const numberOfPilots = pilots.length;
  const preparedPilots = pilots.map((pilot) => pilot.trim().toLowerCase());
  const searchQueue = new Set(preparedPilots.filter((pilot) => pilot.length > 0));
  const civlIds = new Map<string, number>();
  const normalizedSearchQueue = new Map<string, Set<string>>();
  const cacheWrites: Promise<void>[] = [];

  const queueCacheWrite = (name: string, civl: number) => {
    cacheWrites.push(addToCache(name, civl));
  };

  const setCivlId = (name: string, civl: number) => {
    civlIds.set(name, civl);
    searchQueue.delete(name);
    queueCacheWrite(name, civl);
  };

  for (const pilot of searchQueue) {
    const normalized = getNormalizedLowercaseName(pilot);
    const existing = normalizedSearchQueue.get(normalized) ?? new Set<string>();
    existing.add(pilot);
    normalizedSearchQueue.set(normalized, existing);
  }

  /**
   * Lookup pilots in cache
   */

  const search = [...searchQueue];
  let cachedCivlIds: Array<string | null> = search.map(() => null);
  if (redis) {
    const redisClient = redis;
    cachedCivlIds = await Promise.all(
      search.map((pilot) => redisClient.get(`name:${pilot}`).catch(() => null)),
    );
  }

  cachedCivlIds.forEach((id, index) => {
    const name = search[index];
    if (id && name) {
      const cachedId = Number(id);
      if (Number.isFinite(cachedId)) {
        civlIds.set(name, cachedId);
        searchQueue.delete(name);
      }
    }
  });

  const missingInCache = searchQueue.size;

  /**
   * Lookup pilots in DB
   */
  if (searchQueue.size > 0) {
    try {
      const normalizedSearchTerms = [
        ...new Set([...searchQueue].map(getNormalizedLowercaseName)),
      ];
      const pilotsFoundDb = await db
        .select({
          id: ranking.id,
          name: ranking.name,
          normalizedName: ranking.normalizedName,
        })
        .from(ranking)
        .where(
          or(
            inArray(sql`lower(${ranking.name})`, [...searchQueue]),
            inArray(
              sql`lower(coalesce(${ranking.normalizedName}, ${ranking.name}))`,
              normalizedSearchTerms,
            ),
          ),
        );

      for (const pilot of pilotsFoundDb) {
        const directName = pilot.name.toLowerCase();
        const normalizedDbName = getNormalizedLowercaseName(
          pilot.normalizedName ?? pilot.name,
        );
        const matchedQueries = new Set<string>();

        if (searchQueue.has(directName)) {
          matchedQueries.add(directName);
        }

        const normalizedMatches = normalizedSearchQueue.get(normalizedDbName);
        normalizedMatches?.forEach((query) => {
          if (searchQueue.has(query)) matchedQueries.add(query);
        });

        for (const matchedQuery of matchedQueries) {
          setCivlId(matchedQuery, pilot.id);
        }
      }
    } catch (error) {
      console.error("Error fetching pilot rankings:");
      console.log(error);
      Sentry.captureException(error);
    }
  }

  const missingInDB = searchQueue.size;

  /**
   * Find locally with fuzzysearch
   */
  if (searchQueue.size > 0) {
    try {
      const worldRanking = await db
        .select({
          id: ranking.id,
          name: ranking.name,
          normalizedName: ranking.normalizedName,
        })
        .from(ranking);

      const miniSearch = new MiniSearch<SearchIndexEntry>({
        fields: ["name", "normalizedName"],
        storeFields: ["id"],
        searchOptions: { fuzzy: 0.2 },
      });

      miniSearch.addAll(
        worldRanking.map((pilot) => ({
          id: pilot.id,
          name: pilot.name,
          normalizedName: getNormalizedLowercaseName(
            pilot.normalizedName ?? pilot.name,
          ),
        })),
      );

      for (const pilot of [...searchQueue]) {
        const normalizedPilot = getNormalizedLowercaseName(pilot);
        const matchByName = miniSearch.search(pilot, {
          combineWith: "AND",
        })[0];
        const matchByNormalizedName = miniSearch.search(normalizedPilot, {
          combineWith: "AND",
          fields: ["normalizedName"],
        })[0];
        const result = matchByName ?? matchByNormalizedName;

        if (result) {
          const civl = Number(result.id);
          if (Number.isFinite(civl)) {
            setCivlId(pilot, civl);
          }
        }
      }
    } catch (error) {
      console.error("Error during local fuzzy lookup:");
      console.log(error);
      Sentry.captureException(error);
    }
  }

  const missingInMinisearch = searchQueue.size;

  /**
   * Find using algolia
   */
  if (!disableAlgolia && searchQueue.size > 0) {
    try {
      const client = algoliasearch(env.ALGOLIA_APP_ID, env.ALGOLIA_API_KEY);
      const pilotsToSearch = [...searchQueue];
      const promises = pilotsToSearch.map((pilot) =>
        client.searchSingleIndex<Ranking>({
          indexName: "civl_ranking",
          searchParams: {
            query: pilot,
          },
        }),
      );
      const algoliaResults = await Promise.allSettled(promises);

      for (const [index, result] of algoliaResults.entries()) {
        if (result.status !== "fulfilled") continue;
        const query = pilotsToSearch[index];
        if (!query) continue;
        const civl = Number(result.value.hits[0]?.id);

        if (Number.isFinite(civl)) {
          setCivlId(query, civl);
        }
      }
    } catch (error) {
      console.error("Error during Algolia lookup:");
      console.log(error);
      Sentry.captureException(error);
    }
  }

  const missingInAlgolia = searchQueue.size;

  /**
   * Add pilots still not found to cache with placeholder civl id
   */

  for (const pilot of [...searchQueue]) {
    queueCacheWrite(pilot, CIVL_PLACEHOLDER_ID);
    civlIds.set(pilot, CIVL_PLACEHOLDER_ID);
  }

  await Promise.allSettled(cacheWrites);

  // Perfomance Timer
  const duration = Math.round(performance.now() - startTime);

  // Statistics
  const toPercentage = (value: number) =>
    numberOfPilots === 0 ? 0 : +((value / numberOfPilots) * 100).toFixed(2);

  const foundInCache = numberOfPilots - missingInCache;
  const foundInDB = missingInCache - missingInDB;
  const foundInMinisearch = missingInDB - missingInMinisearch;
  const foundInAlgolia = missingInMinisearch - missingInAlgolia;
  const assignedPlaceholder = missingInAlgolia;

  const percentageNotFound = toPercentage(searchQueue.size);

  const stageBreakdown = {
    cache: {
      found: foundInCache,
      foundPercentage: toPercentage(foundInCache),
      missing: missingInCache,
      missingPercentage: toPercentage(missingInCache),
    },
    db: {
      found: foundInDB,
      foundPercentage: toPercentage(foundInDB),
      missing: missingInDB,
      missingPercentage: toPercentage(missingInDB),
    },
    miniSearch: {
      found: foundInMinisearch,
      foundPercentage: toPercentage(foundInMinisearch),
      missing: missingInMinisearch,
      missingPercentage: toPercentage(missingInMinisearch),
    },
    algolia: {
      found: foundInAlgolia,
      foundPercentage: toPercentage(foundInAlgolia),
      missing: missingInAlgolia,
      missingPercentage: toPercentage(missingInAlgolia),
    },
    placeholder: {
      assigned: assignedPlaceholder,
      assignedPercentage: toPercentage(assignedPlaceholder),
    },
  };

  const statistics = {
    numberOfPilots,
    missingInCache,
    missingInDB,
    missingInMinisearch,
    missingInAlgolia,
    percentageNotFound,
    civlSearchDurationInMs: duration,
    pilotsNotfound: [...searchQueue],
    stageBreakdown,
  };

  const formatStageLine = (
    stage: string,
    data: { found: number; foundPercentage: number; missing: number; missingPercentage: number },
  ) =>
    `  - ${stage.padEnd(10)} found ${String(data.found).padStart(4)} (${data.foundPercentage.toFixed(2)}%) | missing ${String(data.missing).padStart(4)} (${data.missingPercentage.toFixed(2)}%)`;

  const logLines = [
    "[getCivlIds] lookup summary",
    `  total pilots: ${numberOfPilots}`,
    `  duration: ${duration}ms`,
    `  not found: ${searchQueue.size} (${percentageNotFound.toFixed(2)}%)`,
    "  stage breakdown:",
    formatStageLine("cache", stageBreakdown.cache),
    formatStageLine("db", stageBreakdown.db),
    formatStageLine("miniSearch", stageBreakdown.miniSearch),
    formatStageLine("algolia", stageBreakdown.algolia),
    `  - ${"placeholder".padEnd(10)} assigned ${String(stageBreakdown.placeholder.assigned).padStart(4)} (${stageBreakdown.placeholder.assignedPercentage.toFixed(2)}%)`,
  ];

  if (statistics.pilotsNotfound.length > 0) {
    logLines.push(`  unresolved pilots: ${statistics.pilotsNotfound.join(", ")}`);
  }

  console.log(logLines.join("\n"));

  return { civlIds, statistics };
}

async function addToCache(name: string, civl: number) {
  if (!redis) return;
  const redisKey = `name:${name.toLowerCase()}`;
  await redis.set(redisKey, civl, "EX", REDIS_EXP_TIME).catch((err) => {
    console.log(err);
  });
}

function getNormalizedLowercaseName(name: string) {
  return normalizeName(name).toLowerCase();
}
