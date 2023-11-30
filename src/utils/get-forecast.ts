import { getAirtribuneComp } from "@/utils/get-airtribune-comp";
import { getCivlcompsComp } from "@/utils/get-civl-comp";
import { getPwcComp } from "./get-pwc-comp";
import { getSwissleagueComp } from "@/utils/get-swissleague-comp";
import { load } from "cheerio";
import { type Forecast } from "@/types/common";
import { calculateWPRS } from "./calculate-wprs";

const MIN_PILOTS = 25; // Minimum required confirmed pilots in a comp

type Error = "NOT_ENOUGH_PILOTS" | "PAST_EVENT" | "UNSUPPORTED_PLATFORM";

type GetForecastError = {
  error: Error;
};

export async function getForecast(
  url: string,
): Promise<Forecast | GetForecastError> {
  // Airtribune
  if (isAirtibuneLink(url)) {
    const compUrl = generateAirtribuneCompUrl(url);
    const comp = await getAirtribuneComp(compUrl);

    if (!comp || comp?.pilots.length < MIN_PILOTS)
      return { error: "NOT_ENOUGH_PILOTS" };

    if (
      comp.compDate.endDate &&
      isDateFromPreviousMonthOrOlder(comp.compDate.endDate)
    )
      return { error: "PAST_EVENT" };

    return {
      maxPilots: comp.maxPilots,
      compTitle: comp.compTitle,
      all: await calculateWPRS(comp.pilots, comp.maxPilots),
      confirmed: await calculateWPRS(comp.pilots.filter((p) => p.confirmed)),
      compUrl: url,
    };
  }

  // CIVL
  if (isCivlLink(url)) {
    const compUrl = generateCivlCompUrl(url);
    const comp = await getCivlcompsComp(compUrl);
    if (!comp || comp.pilots?.length < MIN_PILOTS)
      return { error: "NOT_ENOUGH_PILOTS" };

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
    };
  }

  // PWC
  if (isPwcLink(url)) {
    const compUrl = await generatePwcCompUrl(url);

    const comp = await getPwcComp(compUrl);
    if (!comp || comp.pilots?.length < MIN_PILOTS)
      return { error: "NOT_ENOUGH_PILOTS" };

    if (
      comp.compDate.endDate &&
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

  // Swissleague
  if (isSwissleagueLink(url)) {
    const compUrl = generateSwissleagueCompUrl(url);
    const detailsUrl = generateSwissleagueDetailsUrl(url);
    const comp = await getSwissleagueComp(compUrl, detailsUrl);
    if (!comp || comp?.pilots?.length < MIN_PILOTS)
      return { error: "NOT_ENOUGH_PILOTS" };

    if (
      comp.compDate.endDate &&
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
  return { error: "UNSUPPORTED_PLATFORM" };
}

function isAirtibuneLink(url: string) {
  return url.includes("airtribune.com/");
}

function isCivlLink(url: string) {
  return url.includes("civlcomps.org/");
}

function isPwcLink(url: string) {
  return url.includes("pwca.org/") || url.includes("pwca.events");
}
function isSwissleagueLink(url: string) {
  return url.includes("swissleague.ch/");
}

function getPosition(string: string, subString: string, index: number) {
  return string.split(subString, index).join(subString).length;
}

function generateCivlCompUrl(url: string) {
  return url.slice(0, getPosition(url, "/", 5)) + "/participants";
}

function generateAirtribuneCompUrl(url: string) {
  return url.slice(0, getPosition(url, "/", 4)) + "/pilots";
}

async function generatePwcCompUrl(url: string) {
  if (url.includes("pwca.org"))
    return url.slice(0, getPosition(url, "/", 5)) + "/selection";

  // If it's a running event using the new .events page: Create the legacy url from an h2
  const response = await fetch(url);
  const body = await response.text();

  const $ = load(body, { xmlMode: true });

  const h2 = $("h2")
    .eq(0)
    .text()
    .trim()
    .toLocaleLowerCase()
    .replaceAll(" ", "-")
    .replaceAll("-–-", "-") // - vs –
    .replaceAll(",", "");

  const year = new Date().getFullYear();
  return "https://pwca.org/events/" + year + "-" + h2 + "/selection";
}
function generateSwissleagueCompUrl(url: string) {
  return url.slice(0, getPosition(url, "/", 7)) + "/pilots";
}
function generateSwissleagueDetailsUrl(url: string) {
  return url.slice(0, getPosition(url, "/", 7)) + "/";
}

function isDateFromPreviousMonthOrOlder(dateToCompare: Date): boolean {
  const currentDate = new Date();

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const targetMonth = dateToCompare.getMonth();
  const targetYear = dateToCompare.getFullYear();

  if (
    currentYear > targetYear ||
    (currentYear === targetYear && currentMonth > targetMonth)
  ) {
    return true;
  }
  return false;
}
