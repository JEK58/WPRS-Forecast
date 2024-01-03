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

export async function getForecast(
  url: string,
): Promise<Forecast | GetForecastError> {
  let comp: CompDetails | undefined;

  // Airtribune
  if (isAirtibuneLink(url)) comp = await getAirtribuneComp(url);

  // CIVL
  if (isCivlLink(url)) comp = await getCivlcompsComp(url);

  // PWC
  if (isPwcLink(url)) comp = await getPwcComp(url);

  // Swissleague
  if (isSwissleagueLink(url)) comp = await getSwissleagueComp(url);
  if (!comp) return { error: "UNSUPPORTED_PLATFORM" };
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
    meta: comp.statistics,
  };
}

const isAirtibuneLink = (url: string) => url.includes("airtribune.com/");

const isCivlLink = (url: string) => url.includes("civlcomps.org/");

const isSwissleagueLink = (url: string) => url.includes("swissleague.ch/");

const isPwcLink = (url: string) =>
  url.includes("pwca.org") || url.includes("pwca.events");

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
