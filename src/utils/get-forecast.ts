import { getAirtribuneComp } from "@/utils/get-airtribune-comp";
import { getCivlcompsComp } from "@/utils/get-civl-comp";
import { getPwcComp } from "./get-pwc-comp";
import { getSwissleagueComp } from "@/utils/get-swissleague-comp";
import { type CompDetails, type Forecast } from "@/types/common";
import { calculateWPRS } from "./calculate-wprs";

const MIN_PILOTS = 25; // Minimum required confirmed pilots in a comp

type Error = "NOT_ENOUGH_PILOTS" | "PAST_EVENT" | "UNSUPPORTED_PLATFORM";
type GetForecastError = {
  error: Error;
};
type Platform = "AIRTRIBUNE" | "CIVLCOMPS" | "PWCA" | "SWISSLEAGUE" | undefined;

export async function getForecast(
  url: string,
): Promise<Forecast | GetForecastError> {
  let comp: CompDetails | undefined;

  const platform = identifyCompHost(url);

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

  if (
    comp.compDate?.endDate &&
    isDateFromPreviousMonthOrOlder(comp.compDate.endDate)
  )
    return { error: "PAST_EVENT" };

  return {
    maxPilots: comp.maxPilots,
    compTitle: comp.compTitle,
    all: await calculateWPRS(comp.pilots, comp.maxPilots),
    confirmed: await calculateWPRS(comp.pilots.filter((p) => p.confirmed)),
    compUrl: url,
    pilotsUrl: comp.pilotsUrl,
    meta: comp.statistics,
    compDate: comp.compDate,
  };
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
