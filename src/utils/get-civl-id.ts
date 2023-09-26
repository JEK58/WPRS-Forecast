import axios from "axios";
import Redis from "ioredis";
import { env } from "@/env.mjs";
import { CookieJar } from "tough-cookie";
import { load } from "cheerio";

const redis = new Redis({ host: env.REDIS_URL });

const CIVL_PLACEHOLDER_ID = 99999;
const REDIS_ID_EXPIRE_TIME = 30 * 24 * 60 * 60; // 30 days

interface CivlPilotLookup {
  id: number;
  text: string;
}

export async function getCivlId(name: string) {
  const redisKey = `name:${name.toLowerCase()}`;

  try {
    const cachedId = await redis.get(redisKey);
    if (cachedId) return +cachedId;

    const id = await lookUpCivlId(name);

    // If a placeholder id is returned the CIVL ID may change in the future
    // and therefore gets an expiry of 30 days
    if (id != CIVL_PLACEHOLDER_ID) await redis.set(redisKey, id);
    else await redis.set(redisKey, id, "EX", REDIS_ID_EXPIRE_TIME);
    return id;
  } catch (error) {
    console.log(error);
    return CIVL_PLACEHOLDER_ID;
  }
}

export async function lookUpCivlId(name: string) {
  const searchString = name.replaceAll(" ", "+");

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
    const cookies = cookieResponse.headers.getSetCookie();

    cookies.forEach((cookieStr) => {
      cookieJar.setCookieSync(cookieStr, "https://civlcomps.org"); // Store the cookie
    });

    const searchUrl = "https://civlcomps.org/meta/search-profile";

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Cookie: cookieJar.getCookieStringSync("https://civlcomps.org"),
      Pragma: "no-cache",
      Accept: "application/json, text/javascript, */*; q=0.01",
      "Sec-Fetch-Site": "same-origin",
    };

    const formData = `term=${searchString}&meta=true&_csrf=${embeddedCsrfToken}`;

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
      const newFormData = `term=${newSearchString}&meta=true&_csrf=${embeddedCsrfToken}`;
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
      console.log(
        `☑️ ~ Multiple results for ${name}. Picked: ${bestMatch.text}`,
      );
      return bestMatch.id;
    }
    if (data[0]) return data[0].id;
    else return CIVL_PLACEHOLDER_ID;
  } catch (error) {
    console.log(error);
    return CIVL_PLACEHOLDER_ID;
  }
}

export function normalizeName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
