// https://www.fai.org/sites/default/files/civl/documents/sporting_code_s7_e_-_wprs_2022.pdf

import { prisma } from "@/server/db";
import { getAirtribunePilots } from "@/utils/get-airtribune-pilots";
import { getCivlcompPilots } from "@/utils/get-civl-pilots";
import { getPwcPilots } from "./get-pwc-pilots";
import { getSwissleaguePilots } from "./get-swissleague-pilots";
import Redis from "ioredis";
import { type Ranking } from "@prisma/client";
import { env } from "@/env.mjs";

const redis = new Redis({ host: env.REDIS_URL });
const EXP_TIME = 60 * 60; // 1 h

export interface Pilot {
  name?: string;
  nationality?: string;
  civlID?: number;
  wing?: string;
  status?: string;
  confirmed?: boolean;
  compTitle?: string;
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
  compTitle?: string;
}

export interface GetWPRS {
  all?: CompForecast;
  confirmed?: CompForecast;
}

// Minimum required confirmed pilots in a comp
const MIN_PILOTS = 25;

export async function getWprs(url: string) {
  console.log("🚀 ~ url:", url);
  if (isAirtibuneLink(url)) {
    const compUrl = generateAirtribuneCompUrl(url);
    const pilots = await getAirtribunePilots(compUrl);
    if (pilots.length < MIN_PILOTS) return 0;
    return {
      all: await calculateWPRS(pilots),
      confirmed: await calculateWPRS(pilots.filter((p) => p.confirmed)),
    };
  }
  if (isCivlLink(url)) {
    const compUrl = generateCivlCompUrl(url);
    const pilots = await getCivlcompPilots(compUrl);
    if (pilots.length < MIN_PILOTS) return 0;
    return {
      all: await calculateWPRS(pilots),
      confirmed: await calculateWPRS(pilots.filter((p) => p.confirmed)),
    };
  }
  if (isPwcLink(url)) {
    const compUrl = generatePwcCompUrl(url);
    const pilots = await getPwcPilots(compUrl);
    if (pilots.length < MIN_PILOTS) return 0;
    return {
      all: await calculateWPRS(pilots),
      confirmed: await calculateWPRS(pilots.filter((p) => p.confirmed)),
    };
  }
  if (isSwissleagueLink(url)) {
    const compUrl = generateSwissleagueCompUrl(url);
    const pilots = await getSwissleaguePilots(compUrl);
    if (pilots.length < MIN_PILOTS) return 0;
    return {
      all: await calculateWPRS(pilots),
      confirmed: await calculateWPRS(pilots.filter((p) => p.confirmed)),
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
  pilots: Pilot[]
): Promise<CompForecast | undefined> {
  if (pilots.length < 2) return undefined;
  let worldRankingDate = new Date();
  const numPilots = pilots.length;

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

  const avgNumParticipants = 69;
  const Pn_max = 1.2;

  const Pn_tmp = Math.sqrt(numPilots / avgNumParticipants);
  const Pn = Pn_tmp > Pn_max ? Pn_max : Pn_tmp;

  const compRanking = Pq * Pn;
  // const Pplacing = (numPilots - 1 + 1) / numPilots;
  // const Pp = Math.max(Pplacing ** (1 + Pq), Pplacing ** 2);
  const factors = calcPilotPointFactors(numPilots, Pq);

  const WPRS = factors.map((factor) => calcWPR(factor, Pq, Pn));

  // const WPR = +(100 * Pp * Pq * Pn * Ta3).toFixed(2); // *Td
  // const wprDeval0_8 = +(100 * Pp * Pq * Pn * Ta2).toFixed(2); // *Td
  // const wprDeval0_5 = +(100 * Pp * Pq * Pn * Ta1).toFixed(2); // *Td

  return {
    compTitle: pilots[0]?.compTitle,
    worldRankingDate: worldRankingDate,
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

function generateAirtribuneCompUrl(url: string) {
  return url.slice(0, getPosition(url, "/", 4)) + "/pilots";
}

function generatePwcCompUrl(url: string) {
  return url.slice(0, getPosition(url, "/", 5)) + "/selection";
}
function generateSwissleagueCompUrl(url: string) {
  return url.slice(0, getPosition(url, "/", 7)) + "/pilots";
}
