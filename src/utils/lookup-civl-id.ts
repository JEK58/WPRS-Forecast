import axios from "axios";

const CIVL_PLACEHOLDER_ID = 99999;

interface CivlPilotLookup {
  id: number;
  text: string;
}
export async function lookupCivlId(name: string) {
  const searchString = name.replaceAll(" ", "+");
  const headersList = {
    Accept: "*/*",
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const reqOptions = {
    url: "https://civlcomps.org/meta/search-profile/",
    method: "GET",
    headers: headersList,
    data: `term=${searchString}`,
  };

  try {
    let res = await axios.request<CivlPilotLookup[]>(reqOptions);
    if (!res.data || !res.data.length) {
      /**
       * Try again with less information.
       * Sometimes the CIVL search does not find pilots if they have a middle name
       */

      const splitName = searchString.split("+");
      splitName.splice(1, 1);
      const newSearchString = splitName.join("+");

      reqOptions.data = `term=${newSearchString}`;
      res = await axios.request<CivlPilotLookup[]>(reqOptions);
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
        `☑️ ~ Multiple results for ${name}. Picked: ${bestMatch.text}`
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
