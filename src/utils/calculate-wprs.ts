// https://www.fai.org/sites/default/files/civl/documents/sporting_code_s7_e_-_wprs_2022.pdf

import { prisma } from "@/server/db";
import { getAirtribunePilots } from "@/utils/get-airtribune-pilots";
import { getCivlcompPilots } from "@/utils/get-civl-pilots";
import { getPwcPilots } from "./get-pwc-pilots";

export interface Pilot {
  name?: string;
  nationality?: string;
  civlID?: number;
  wing?: string;
  status?: string;
}

export interface CompForecast {
  numPilots: number;
  Pq: number;
  Pq_srp: number;
  Pq_srtp: number;
  Pn: number;
  compRanking: number;
  Pp: number;
  WPR: number;
  wprDeval0_8: number;
  wprDeval0_5: number;
}

export async function getWprs(url: string) {
  console.log("🚀 ~ url:", url);
  if (isAirtibuneLink(url)) {
    const compUrl = generateAirtribuneCompUrl(url);
    const pilots = await getAirtribunePilots(compUrl);
    if (!pilots.length) return 0;

    return await calculateWPRS(pilots);
  }
  if (isCivlLink(url)) {
    const compUrl = generateCivlCompUrl(url);
    const pilots = await getCivlcompPilots(compUrl);
    if (!pilots.length) return 0;
    return await calculateWPRS(pilots);
  }
  if (isPwcLink(url)) {
    const compUrl = generatePwcCompUrl(url);
    const pilots = await getPwcPilots(compUrl);
    if (!pilots.length) return 0;
    return await calculateWPRS(pilots);
  }
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

async function calculateWPRS(pilots: Pilot[]) {
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

    const pilot = await prisma.ranking.findUnique({ where: { id: civl } });

    if (pilot) compPilotsWprs.push(pilot.points);
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

  // 1 task: 0.5, 2 tasks: 0.8, 3 tasks: 1.0
  const Ta3 = 1.0;
  const Ta2 = 0.8;
  const Ta1 = 0.5;
  const compRanking = Pq * Pn * Ta3;
  const Pplacing = (numPilots - 1 + 1) / numPilots;
  const Pp = Math.max(Pplacing ** (1 + Pq), Pplacing ** 2);
  const WPR = +(100 * Pp * Pq * Pn * Ta3).toFixed(2); // *Td
  const wprDeval0_8 = +(100 * Pp * Pq * Pn * Ta2).toFixed(2); // *Td
  const wprDeval0_5 = +(100 * Pp * Pq * Pn * Ta1).toFixed(2); // *Td

  return {
    numPilots,
    Pq: Pq.toFixed(3),
    Pq_srp,
    Pq_srtp,
    Pn,
    compRanking: compRanking.toFixed(3),
    Pp,
    WPR,
    wprDeval0_8,
    wprDeval0_5,
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
