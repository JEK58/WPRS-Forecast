// https://www.fai.org/sites/default/files/civl/documents/sporting_code_s7_e_-_wprs_2022.pdf

import { prisma } from "@/server/db";
import { getAirtribuneComp } from "@/utils/get-airtribune-comp";
import { getCivlcompsComp } from "@/utils/get-civl-comp";
import { getPwcComp } from "./get-pwc-comp";
import { getSwissleagueComp } from "./get-swissleague-comp";
import Redis from "ioredis";
import { type Ranking } from "@prisma/client";
import { env } from "@/env.mjs";

const redis = new Redis({ host: env.REDIS_URL });

const EXP_TIME = 60 * 60; // 1 h
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
type PromiseReturnType<T> = T extends Promise<infer R> ? R : never;
export type GetWPRS = PromiseReturnType<ReturnType<typeof getWprs>>;

export async function getWprs(url: string) {
  if (isAirtibuneLink(url)) {
    const compUrl = generateAirtribuneCompUrl(url);
    const comp = await getAirtribuneComp(compUrl);
    if (!comp || comp?.pilots.length < MIN_PILOTS) return 0;

    if (
      comp.compDate.endDate &&
      isDateFromPreviousMonthOrOlder(comp.compDate.endDate)
    )
      return 2;

    return {
      maxPilots: comp.maxPilots,
      compTitle: comp.compTitle,
      all: await calculateWPRS(comp.pilots, comp.maxPilots),
      confirmed: await calculateWPRS(comp.pilots.filter((p) => p.confirmed)),
      compUrl: url,
    };
  }
  if (isCivlLink(url)) {
    const compUrl = generateCivlCompUrl(url);
    const detailsUrl = generateCivlDetailsUrl(url);
    const comp = await getCivlcompsComp(compUrl, detailsUrl);
    if (!comp || comp.pilots?.length < MIN_PILOTS) return 0;

    if (
      comp.compDate.endDate &&
      isDateFromPreviousMonthOrOlder(comp.compDate.endDate)
    )
      return 2;

    return {
      maxPilots: comp.maxPilots,
      compTitle: comp.compTitle,
      all: await calculateWPRS(comp.pilots, comp.maxPilots),
      confirmed: await calculateWPRS(comp.pilots.filter((p) => p.confirmed)),
      compUrl: url,
    };
  }
  if (isPwcLink(url)) {
    const compUrl = generatePwcCompUrl(url);
    const comp = await getPwcComp(compUrl);
    if (!comp || comp.pilots?.length < MIN_PILOTS) return 0;

    if (
      comp.compDate.endDate &&
      isDateFromPreviousMonthOrOlder(comp.compDate.endDate)
    )
      return 2;

    return {
      maxPilots: comp.maxPilots,
      compTitle: comp.compTitle,
      all: await calculateWPRS(comp.pilots, comp.maxPilots),
      confirmed: await calculateWPRS(comp.pilots.filter((p) => p.confirmed)),
      compUrl: url,
    };
  }
  if (isSwissleagueLink(url)) {
    const compUrl = generateSwissleagueCompUrl(url);
    const detailsUrl = generateSwissleagueDetailsUrl(url);
    const comp = await getSwissleagueComp(compUrl, detailsUrl);
    if (!comp || comp?.pilots?.length < MIN_PILOTS) return 0;

    if (
      comp.compDate.endDate &&
      isDateFromPreviousMonthOrOlder(comp.compDate.endDate)
    )
      return 2;
    return {
      maxPilots: comp.maxPilots,
      compTitle: comp.compTitle,
      all: await calculateWPRS(comp.pilots, comp.maxPilots),
      confirmed: await calculateWPRS(comp.pilots.filter((p) => p.confirmed)),
      compUrl: url,
    };
  }
  return 0;
}
export function isAirtibuneLink(url: string) {
  return url.includes("airtribune.com/");
}

export function isCivlLink(url: string) {
  return url.includes("civlcomps.org/");
}

export function isPwcLink(url: string) {
  return url.includes("pwca.org/");
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
  const numPilots =
    maxPilots === 0 || maxPilots === undefined ? pilots.length : maxPilots;

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
      await redis.set(`civl:${civl}`, JSON.stringify(pilot), "EX", EXP_TIME);
    }

    if (pilot) {
      compPilotsWprs.push(pilot.points);
      worldRankingDate = pilot.date;
    }
  }
  const Pq_srp = compPilotsWprs
    .sort((a, b) => b - a)
    .slice(0, numPilots / 2)
    .reduce((a, b) => a + b);

  const Pq_min = 0.2;
  const Pq = (Pq_srp / Pq_srtp) * (1 - Pq_min) + Pq_min;

  const Pn_max = 1.2;

  const Pn_tmp = Math.sqrt(numPilots / AVG_NUM_PARTICIPANTS);
  const Pn = Pn_tmp > Pn_max ? Pn_max : Pn_tmp;

  const compRanking = Pq * Pn;

  const factors = calcPilotPointFactors(numPilots, Pq);

  const WPRS = factors.map((factor) => calcWPR(factor, Pq, Pn));

  return {
    worldRankingDate,
    numPilots,
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
function generateCivlDetailsUrl(url: string) {
  return url.slice(0, getPosition(url, "/", 5));
}

function generateAirtribuneCompUrl(url: string) {
  return url.slice(0, getPosition(url, "/", 4)) + "/pilots";
}

function generatePwcCompUrl(url: string) {
  return url.slice(0, getPosition(url, "/", 5)) + "/selection";
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
