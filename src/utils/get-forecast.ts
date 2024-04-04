import { getAirtribuneComp } from "@/utils/get-airtribune-comp";
import { getCivlcompsComp } from "@/utils/get-civl-comp";
import { getPwcComp } from "./get-pwc-comp";
import { getSwissleagueComp } from "@/utils/get-swissleague-comp";
import { type Pilot, type CompDetails, type Forecast } from "@/types/common";
import { type Ranking, calculateWPRS } from "./calculate-wprs";
import { db } from "@/server/db";
import { ranking } from "@/server/db/schema";
import { inArray } from "drizzle-orm";
import * as Sentry from "@sentry/nextjs";

const MIN_PILOTS = 25; // Minimum required confirmed pilots in a comp

type Error =
  | "NOT_ENOUGH_PILOTS"
  | "PAST_EVENT"
  | "UNSUPPORTED_PLATFORM"
  | "NO_URL";
export type GetForecastError = {
  error: Error;
};
type Platform = "AIRTRIBUNE" | "CIVLCOMPS" | "PWCA" | "SWISSLEAGUE" | undefined;

export async function getForecast(
  url: string,
): Promise<Forecast | GetForecastError> {
  let comp: CompDetails | undefined;

  const platform = identifyCompHost(url);

  console.log("🧐 Request URL: ", url);

  // Airtribune
  if (platform === "AIRTRIBUNE") comp = await getAirtribuneComp(url);

  // CIVL
  if (platform === "CIVLCOMPS") comp = await getCivlcompsComp(url);

  // PWC
  if (platform === "PWCA") comp = await getPwcComp(url);

  // Swissleague
  if (platform === "SWISSLEAGUE") comp = await getSwissleagueComp(url);

  if (!comp || !platform) return { error: "UNSUPPORTED_PLATFORM" };
  if (comp?.pilots.length < MIN_PILOTS) return { error: "NOT_ENOUGH_PILOTS" };

  // Check if the comp date is in the past
  if (
    comp.compDate?.endDate &&
    isDateFromPreviousMonthOrOlder(comp.compDate.endDate)
  )
    return { error: "PAST_EVENT" };

  const confirmed = comp.pilots.filter((p) => p.confirmed);
  const numberOfConfirmed = confirmed.length;

  const pilots = await getPilotRankings(comp.pilots);
  const confirmedPilots = await getPilotRankings(confirmed);

  return {
    maxPilots: comp.maxPilots,
    compTitle: comp.compTitle,
    all: await calculateWPRS(pilots, comp.maxPilots),
    confirmed: await calculateWPRS(confirmedPilots, numberOfConfirmed),
    compUrl: url,
    pilotsUrl: comp.pilotsUrl,
    meta: comp.statistics,
    compDate: comp.compDate,
    nationalities: calculateNationalities(confirmedPilots),
    genders: calculateGender(confirmedPilots),
  };
}

function calculateNationalities(pilots: Ranking[]) {
  if (pilots.length === 0) return;
  const nationalitiesCount: Record<string, number> = {};
  pilots.forEach((pilot) => {
    if (!pilot.nation) return;
    if (nationalitiesCount[pilot.nation]) {
      nationalitiesCount[pilot.nation]++;
    } else {
      nationalitiesCount[pilot.nation] = 1;
    }
  });

  const totalPilots = pilots.length;

  const nationalitiesPercentage: Record<string, string> = {};
  for (const nationality in nationalitiesCount) {
    nationalitiesPercentage[nationality] =
      ((nationalitiesCount[nationality] ?? 0 / totalPilots) * 100).toFixed(2) +
      "%";
  }

  return { count: nationalitiesCount, percentage: nationalitiesPercentage };
}

function calculateGender(pilots: Ranking[]) {
  if (pilots.length === 0) return;
  let female = 0;
  let male = 0;

  pilots.forEach((pilot) => {
    if (pilot.gender.toLowerCase() == "f") female++;
    if (pilot.gender.toLowerCase() == "m") male++;
  });
  return { male, female };
}

async function getPilotRankings(pilots: Pilot[]) {
  if (pilots.length === 0) return [];
  const civlIds = pilots
    .map((pilot) => pilot.civlID)
    .filter((item): item is number => typeof item === "number" && !isNaN(item));

  try {
    const res = await db
      .select()
      .from(ranking)
      .where(inArray(ranking.id, civlIds))
      .execute();

    return res;
  } catch (error) {
    Sentry.captureException(error);
    console.log("Error fetching pilot rankings:");
    console.log(error);
    return [];
  }
}

function identifyCompHost(_url: string): Platform {
  const url = new URL(_url);

  if (url.hostname.endsWith("airtribune.com")) return "AIRTRIBUNE";
  if (url.hostname.endsWith("civlcomps.org")) return "CIVLCOMPS";
  if (url.hostname.endsWith("swissleague.ch")) return "SWISSLEAGUE";
  if (url.hostname.endsWith("pwca.org") || url.hostname.endsWith("pwca.events"))
    return "PWCA";
}

function isDateFromPreviousMonthOrOlder(dateToCompare: Date): boolean {
  const currentDate = new Date();

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const targetMonth = dateToCompare.getMonth();
  const targetYear = dateToCompare.getFullYear();

  const condition =
    currentYear > targetYear ||
    (currentYear === targetYear && currentMonth > targetMonth);

  return condition ? true : false;
}
