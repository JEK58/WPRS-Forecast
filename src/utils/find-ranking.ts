import { prisma } from "@/server/db";
import { type Ranking } from "@prisma/client";
import MiniSearch from "minisearch";
import algoliasearch from "algoliasearch";
import Redis from "ioredis";
import { env } from "@/env.mjs";
import { normalizeName } from "./normalize-name";

export const CIVL_PLACEHOLDER_ID = 99999;

const redis = new Redis({ host: env.REDIS_URL });

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
export async function getCivlIds(pilots: string[]) {
  const numberOfPilots = pilots.length;
  const searchQueue = new Set(pilots.map((p) => p.toLowerCase()));
  const civlIds = new Map<string, number>();

  /**
   * Lookup pilots in cache
   */

  const search = [...searchQueue];
  const redisPromises = search.map((pilot) => redis.get(`name:${pilot}`));
  const cachedCivlIds = await Promise.all(redisPromises);

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

  const pilotsFoundDb = await prisma.ranking.findMany({
    where: {
      name: {
        in: [...searchQueue],
        mode: "insensitive",
      },
    },
    // take: searchQueue.size,
    // distinct: ["name"],
  });

  for (const pilot of pilotsFoundDb) {
    const name = pilot.name.toLowerCase();
    civlIds.set(name, pilot.id);
    searchQueue.delete(name);

    await addToCache(name, pilot.id);
  }

  const missingInDB = searchQueue.size;

  /**
   * Find locally with fuzzysearch
   */
  // TODO: Only load and index if there are pilots left to search
  const worldRanking = await prisma.ranking.findMany();

  const miniSearch = new MiniSearch({
    fields: ["name"],
    storeFields: ["id", "name"],
    searchOptions: { fuzzy: 0.2 },
  });

  // Index all documents
  miniSearch.addAll(worldRanking);

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

  //   const client = algoliasearch(env.ALGOLIA_API_KEY, env.ALGOLIA_API_KEY);

  //   const index = client.initIndex("civl_ranking");
  //   const promises = [...searchQueue].map((pilot) =>
  //     index.search<Ranking>(pilot),
  //   );
  //   const algoliaResults = await Promise.all(promises);

  //   for (const res of algoliaResults) {
  //     const civl = res.hits[0]?.id;

  //     if (civl) {
  //       civlIds.set(res.query, civl);
  //       searchQueue.delete(res.query);
  //       await addToCache(res.query, civl);
  //     }
  //   }

  const missingInAlgolia = searchQueue.size;

  //   Statistics
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
  };

  /**
   * Add pilots still not found to cache with placeholder civl id
   */

  for (const pilot of [...searchQueue]) {
    await addToCache(pilot, CIVL_PLACEHOLDER_ID);
    civlIds.set(pilot, CIVL_PLACEHOLDER_ID);
  }

  return { civlIds, statistics };
}

async function addToCache(name: string, civl: number) {
  const redisKey = `name:${name.toLowerCase()}`;
  await redis.set(redisKey, civl).catch((err) => {
    console.log(err);
  });
}
