// https://www.fai.org/sites/default/files/civl/documents/sporting_code_s7_e_-_wprs_2022.pdf

import { prisma } from "@/server/db";
import { getAirtribuneComp } from "@/utils/get-airtribune-comp";
import { getCivlcompsComp } from "@/utils/get-civl-comp";
import { getPwcComp } from "./get-pwc-comp";
import { getSwissleagueComp } from "./get-swissleague-comp";
import Redis from "ioredis";
import { type Ranking } from "@prisma/client";
import { env } from "@/env.mjs";
import { load } from "cheerio";

const redis = new Redis({ host: env.REDIS_URL });

const REDIS_EXP_TIME = 60 * 60; // 1 h
const MIN_PILOTS = 25; // Minimum required confirmed pilots in a comp
const AVG_NUM_PARTICIPANTS = 76; // June 2022-June 2023

export interface Pilot {
  name?: string;
  nationality?: string;
  civlID?: number;
  wing?: string;
  status?: string;
  confirmed?: boolean;
}

export interface CompForecast {
  worldRankingDate: Date;
  numPilots: number;
  Pq: number;
  Pq_srp: number;
  Pq_srtp: number;
  Pn: number;
  compRanking: number;
  WPRS: { Ta1: number; Ta2: number; Ta3: number }[];
}

type Error = "NOT_ENOUGH_PILOTS" | "PAST_EVENT" | "UNSUPPORTED_PLATFORM";

export type Forecast = {
  maxPilots: number;
  compTitle?: string;
  all?: CompForecast;
  confirmed?: CompForecast;
  compUrl: string;
};

type GetForecastError = {
  error: Error;
};

export async function getWprs(
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
    };
  }
  return { error: "UNSUPPORTED_PLATFORM" };
}

export function isAirtibuneLink(url: string) {
  return url.includes("airtribune.com/");
}

export function isCivlLink(url: string) {
  return url.includes("civlcomps.org/");
}

export function isPwcLink(url: string) {
  return url.includes("pwca.org/") || url.includes("pwca.events");
}
export function isSwissleagueLink(url: string) {
  return url.includes("swissleague.ch/");
}

async function calculateWPRS(
  pilots: Pilot[],
  maxPilots?: number,
): Promise<CompForecast | undefined> {
  if (pilots.length < 2) return undefined;
  let worldRankingDate = new Date();

  const baseNumPilots = maxPilots || pilots.length;
  const numPilots = Math.min(pilots.length, baseNumPilots);
  let Pq_srtp = 0;

  const topPilots = await prisma.ranking.findMany({
    orderBy: [{ rank: "asc" }],
    take: numPilots + 10,
  });
  // sum ranking-points if they had been the top-ranked pilots of the world
  for (let i = 0; i < numPilots / 2; i++) {
    if (topPilots.length) Pq_srtp += topPilots[i]?.points ?? 0;
  }

  const compPilotsWprs: number[] = [];

  // sum ranking-points of the top 1/2 ranked participants
  for (let i = 0; i < numPilots; i++) {
    const element = pilots[i];
    if (!element) continue;
    const civl = element.civlID;
    if (!civl || isNaN(civl) || civl > 99999) continue;

    let pilot: Ranking | null;
    const cachedPilot = await redis.get(`civl:${civl}`);

    if (cachedPilot) pilot = JSON.parse(cachedPilot) as Ranking;
    else {
      pilot = await prisma.ranking.findUnique({ where: { id: civl } });
      await redis.set(
        `civl:${civl}`,
        JSON.stringify(pilot),
        "EX",
        REDIS_EXP_TIME,
      );
    }

    if (pilot) {
      compPilotsWprs.push(pilot.points);
      worldRankingDate = pilot.date;
    }
  }
  const Pq_srp = compPilotsWprs
    .sort((a, b) => b - a)
    .slice(0, baseNumPilots / 2)
    .reduce((a, b) => a + b);

  const Pq_min = 0.2;
  const Pq = (Pq_srp / Pq_srtp) * (1 - Pq_min) + Pq_min;

  const Pn_max = 1.2;

  const Pn_tmp = Math.sqrt(baseNumPilots / AVG_NUM_PARTICIPANTS);
  const Pn = Pn_tmp > Pn_max ? Pn_max : Pn_tmp;

  const compRanking = Pq * Pn;

  const factors = calcPilotPointFactors(baseNumPilots, Pq);

  const WPRS = factors.map((factor) => calcWPR(factor, Pq, Pn));

  return {
    worldRankingDate,
    numPilots: baseNumPilots,
    Pq: +Pq.toFixed(3),
    Pq_srp: +Pq_srp.toFixed(3),
    Pq_srtp: +Pq_srtp.toFixed(3),
    Pn: +Pn.toFixed(3),
    compRanking: +compRanking.toFixed(3),
    WPRS,
  };
}

function calcPilotPointFactors(numOfPilots: number, Pq: number) {
  const data: number[] = [];
  for (let i = 1; i <= numOfPilots; i++) {
    const pp = (numOfPilots - i + 1) / numOfPilots;
    data.push(+Math.max(pp ** (1 + Pq), pp ** 2).toFixed(3));
  }
  return data;
}

function calcWPR(factor: number, Pq: number, Pn: number) {
  // 1 task: 0.5, 2 tasks: 0.8, 3 tasks: 1.0
  const success = [0.5, 0.8, 1] as const;

  const formula = (success: number, factor: number) =>
    +(100 * factor * Pq * Pn * success).toFixed(1);

  return {
    Ta1: +formula(success[0], factor),
    Ta2: +formula(success[1], factor),
    Ta3: +formula(success[2], factor),
  };
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
    .toLocaleLowerCase()
    .replaceAll(" ", "-")
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
  } else {
    return false;
  }
}
