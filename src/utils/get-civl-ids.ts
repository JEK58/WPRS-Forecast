import axios from "axios";
import Redis from "ioredis";
import { env } from "@/env.mjs";
import { CookieJar } from "tough-cookie";
import { load } from "cheerio";
import { _findPilot, findPilot } from "./find-ranking";
import { prisma } from "@/server/db";
import Fuse from "fuse.js";
import { Ranking } from "@prisma/client";

const redis = new Redis({ host: env.REDIS_URL });

export const CIVL_PLACEHOLDER_ID = 99999;

interface CivlPilotLookup {
  id: number;
  text: string;
}
interface Cookies {
  cookieString: string;
  embeddedCsrfToken: string;
}

export async function getCivlIds(listOfPilots: { name: string }[]) {
  // Get CIVL session cookie
  const cookies = await getCivlCookies();
  if (!cookies) throw new Error("No cookies found");
  const map = new Map<string, number>();

  // New method
  // Perfomance timer
  // const startTime = performance.now();
  // console.log("⏱️ ~ ", "Timer started");

  // const names = listOfPilots.map((p) => p.name.toLocaleLowerCase());
  // console.log("🚀 ~ names:", names.length);

  // const pilots = await prisma.ranking.findMany({
  //   where: {
  //     name: { in: names, mode: "insensitive" },
  //   },
  // });

  // const missing = names.filter(
  //   (name) => !pilots.find((p) => p.name.toLocaleLowerCase() === name),
  // );
  // console.log("🚀 ~ missing:", missing.length);
  // console.log("🚀 ~ pilots:", pilots.length);

  // // for (const pilot of missing) {
  // //   const res = fuse.search(
  // //     {
  // //       $and: [{ name: pilot }, { name: reverseFirstAndLast(pilot) }],
  // //     },
  // //     { limit: 1 },
  // //   );

  // //   const foo = res[0]?.item;
  // //   if (foo) {
  // //     map.set(pilot, foo.id);
  // //     // console.log(foo.name);
  // //   } else console.log("⛔️", pilot);
  // // }

  // for (const pilot of missing) {
  //   const res = await _findPilot(pilot);
  //   if (res) {
  //     map.set(pilot, res.id);
  //   } else console.log("⛔️", pilot);
  // }

  // console.log("🚀 ~ map:", map.size);
  // // Performance Timer
  // const endTime = performance.now();
  // const elapsedTime = endTime - startTime;
  // console.log("⏱️ ~ ", (elapsedTime / 1000).toFixed(2), "seconds");

  await Promise.all(
    listOfPilots.map(async (pilot) => {
      const name = pilot.name;
      // const redisKey = `name:${name.toLowerCase()}`;

      try {
        // // Check cache
        // const cachedId = await redis.get(redisKey);
        // if (cachedId) return map.set(name, +cachedId);

        // No cache hit => query CIVL
        const res = await lookUpCivlId(pilot.name, cookies);

        const civlId = res ?? CIVL_PLACEHOLDER_ID;

        // Cache result
        // if (civlId != CIVL_PLACEHOLDER_ID) await redis.set(redisKey, civlId);

        return map.set(name, civlId);
      } catch (error) {
        console.log(error);
        return map.set(name, CIVL_PLACEHOLDER_ID);
      }
    }),
  );

  // Check the number of entries that have the CIVL placeholder value
  // Log a warning if there are more than 5% missing
  // TODO: Send an email

  let placeHolderCount = 0;

  map.forEach((item) => {
    if (item === CIVL_PLACEHOLDER_ID) placeHolderCount++;
  });
  if (placeHolderCount > listOfPilots.length / 20)
    console.log("⚠️ ~ More than 5% with no CIVL ID!", placeHolderCount);

  return map;
}

export async function lookUpCivlId(name: string, cookies: Cookies) {
  const searchString = name
    .replaceAll(" ", "+")
    .replaceAll("'", " ")
    .replaceAll("-", " ");

  try {
    const searchUrl = "https://civlcomps.org/meta/search-profile";

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Cookie: cookies.cookieString,
      Pragma: "no-cache",
      Accept: "application/json, text/javascript, */*; q=0.01",
      "Sec-Fetch-Site": "same-origin",
    };

    const formData = `term=${searchString}&meta=true&_csrf=${cookies.embeddedCsrfToken}`;

    let res = await axios.post<CivlPilotLookup[]>(searchUrl, formData, {
      headers,
    });
    if (!res.data || !res.data.length) {
      /**
       * Try again with less information.
       * Sometimes the CIVL search does not find pilots if they have a middle name
       */
      console.log(
        `🤷 ~ CIVL lookup failed for ${name} => trying with less information`,
      );
      const splitName = searchString.split("+");
      splitName.splice(1, 1);
      const newSearchString = splitName.join("+");
      const newFormData = `term=${newSearchString}&meta=true&_csrf=${cookies.embeddedCsrfToken}`;
      res = await axios.post<CivlPilotLookup[]>(searchUrl, newFormData, {
        headers,
      });

      if (!res.data || !res.data.length) {
        console.log(`❗️ ~ No data for ${name}`);
        return CIVL_PLACEHOLDER_ID;
      }
    }
    const data = res.data;

    if (data.length > 1) {
      // Find the best match if the search returns multiple results

      const namePartsRegex = /(\S+)\s*(\S+)?\s*(\S+)?/;
      const nameParts =
        normalizeName(name).match(namePartsRegex)?.slice(1).sort() ?? [];

      let bestMatch: CivlPilotLookup | undefined;
      let bestMatchScore = 0;
      for (const pilot of data) {
        const currentNameParts =
          normalizeName(pilot.text).match(namePartsRegex)?.slice(1).sort() ??
          [];

        let matchScore = 0;
        for (const part of nameParts) {
          if (currentNameParts.includes(part)) matchScore++;
        }

        if (matchScore >= 2 && matchScore > bestMatchScore) {
          bestMatch = pilot;
          bestMatchScore = matchScore;
        }
      }

      if (!bestMatch) {
        console.log(`❗️ ~ No data for ${name}`);
        return CIVL_PLACEHOLDER_ID;
      }
      // If the name of the best match does not match exactly log it for easier debugging
      if (!bestMatch.text.includes(name))
        console.log(
          `☑️ ~ Multiple results for ${name}. Picked: ${bestMatch.text}`,
        );
      return bestMatch.id;
    }
    console.log(name, data[0]?.text);

    if (data[0]) return data[0].id;
    else return CIVL_PLACEHOLDER_ID;
  } catch (error) {
    console.log("Error for name:", name);

    if (axios.isAxiosError(error)) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.config.data);
        console.log(error.response.status);
        // console.log(error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.log(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
      }
    } else {
      console.log(error);
    }

    return CIVL_PLACEHOLDER_ID;
  }
}

export function normalizeName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export async function getCivlCookies() {
  try {
    // Create a new cookie jar
    const cookieJar = new CookieJar();
    const cookieUrl = "https://civlcomps.org/ranking/paragliding-xc/pilots";
    const cookieResponse = await fetch(cookieUrl);

    const body = await cookieResponse.text();

    // Get embedded csrf-token
    const $ = load(body, { xmlMode: true });
    const embeddedCsrfToken = $('meta[name="csrf-token"]').attr("content");

    // Get cookies
    const cookies = cookieResponse.headers.get("set-cookie");
    if (!cookies || !embeddedCsrfToken) throw new Error("No cookies found");

    const cookiesArray = cookies.split(",");

    cookiesArray.forEach((cookieStr) => {
      cookieJar.setCookieSync(cookieStr, "https://civlcomps.org");
    });

    const cookieString = cookieJar.getCookieStringSync("https://civlcomps.org");

    return { cookieString, embeddedCsrfToken };
  } catch (error) {
    console.log(error);
  }
}

function reverseFirstAndLast(inputString: string): string {
  const words: string[] = inputString.split(" ");

  if (words.length >= 2) {
    const temp = words[0];

    if (temp) {
      const last = words[words.length - 1];
      if (last) words[0] = last;

      words[words.length - 1] = temp;
    }
  }

  return words.join(" ");
}
