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
  const searchQueue = new Set(pilots.map((p) => p.toLowerCase()));
  const civlIds = new Map<string, number>();
  const normalizedSearchQueue = new Map<string, string[]>();

  for (const pilot of searchQueue) {
    const normalized = normalizeName(pilot).toLowerCase();
    const existing = normalizedSearchQueue.get(normalized) ?? [];
    existing.push(pilot);
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
      civlIds.set(name, Number(id));
      searchQueue.delete(name);
    }
  });

  const missingInCache = searchQueue.size;

  /**
   * Lookup pilots in DB
   */
  if (searchQueue.size > 0) {
    try {
      const normalizedSearchTerms = [...new Set([...searchQueue].map((name) => normalizeName(name).toLowerCase()))];
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
        const normalizedDbName = normalizeName(
          pilot.normalizedName ?? pilot.name,
        ).toLowerCase();
        const matchedQueries = new Set<string>();

        if (searchQueue.has(directName)) {
          matchedQueries.add(directName);
        }

        const normalizedMatches = normalizedSearchQueue.get(normalizedDbName);
        normalizedMatches?.forEach((query) => {
          if (searchQueue.has(query)) matchedQueries.add(query);
        });

        for (const matchedQuery of matchedQueries) {
          civlIds.set(matchedQuery, pilot.id);
          searchQueue.delete(matchedQuery);
          await addToCache(matchedQuery, pilot.id);
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
   * TODO: Only load and index if there are pilots left to search
   */

  const worldRanking = await db.select().from(ranking);

  const miniSearch = new MiniSearch({
    fields: ["name"],
    storeFields: ["id", "name"],
    searchOptions: { fuzzy: 0.2 },
  });

  // Create index
  miniSearch.addAll(worldRanking);

  type Ranking = InferSelectModel<typeof ranking>;

  for (const pilot of [...searchQueue]) {
    const res = miniSearch.search(pilot, {
      combineWith: "AND",
    })[0] as unknown as Pick<Ranking, "id" | "name">;

    if (res) {
      civlIds.set(pilot, res.id);
      searchQueue.delete(pilot);
      await addToCache(pilot, res.id);
    }
  }

  const missingInMinisearch = searchQueue.size;

  /**
   * Find using algolia
   */
  if (!disableAlgolia) {
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
    const algoliaResults = await Promise.all(promises);

    for (const [index, res] of algoliaResults.entries()) {
      const query = pilotsToSearch[index];
      if (!query) continue;
      const civl = res.hits[0]?.id;

      if (civl) {
        civlIds.set(query, civl);
        searchQueue.delete(query);
        await addToCache(query, civl);
      }
    }
  }

  const missingInAlgolia = searchQueue.size;

  /**
   * Add pilots still not found to cache with placeholder civl id
   */

  for (const pilot of [...searchQueue]) {
    await addToCache(pilot, CIVL_PLACEHOLDER_ID);
    civlIds.set(pilot, CIVL_PLACEHOLDER_ID);
  }

  // Perfomance Timer
  const duration = Math.round(performance.now() - startTime);

  // Statistics
  const percentageNotFound = +(
    (searchQueue.size / numberOfPilots) *
    100
  ).toFixed(2);

  const statistics = {
    numberOfPilots,
    missingInCache,
    missingInDB,
    missingInMinisearch,
    missingInAlgolia,
    percentageNotFound,
    civlSearchDurationInMs: duration,
    pilotsNotfound: [...searchQueue],
  };

  return { civlIds, statistics };
}

async function addToCache(name: string, civl: number) {
  if (!redis) return;
  const redisKey = `name:${name.toLowerCase()}`;
  await redis.set(redisKey, civl, "EX", REDIS_EXP_TIME).catch((err) => {
    console.log(err);
  });
}
