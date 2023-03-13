// https://www.fai.org/sites/default/files/civl/documents/sporting_code_s7_e_-_wprs_2022.pdf

import axios from "axios";
import { prisma } from "@/server/db";
import { load } from "cheerio";

interface Pilot {
  name?: string;
  nationality?: string;
  civlID?: number;
  wing?: string;
  status?: string;
}

interface AirtribunePilot
  extends Omit<Pilot, "civlID" | "wing" | "nationality"> {
  country: { ioc_code: string };
  glider_model: string;
  civl_id: string;
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
}
export function isAirtibuneLink(url: string) {
  return url.includes("airtribune.com");
}

export function isCivlLink(url: string) {
  return url.includes("civlcomps.org");
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
    if (!civl || isNaN(civl)) continue;

    const pilot = await prisma.ranking.findUnique({ where: { id: civl } });

    if (pilot) compPilotsWprs.push(pilot.points);
  }
  const Pq_srp = compPilotsWprs
    .sort((a, b) => b - a)
    .slice(0, numPilots / 2)
    .reduce((a, b) => a + b);

  const Pq_min = 0;
  const Pq = (Pq_srp / Pq_srtp) * (1 - Pq_min) + Pq_min;

  const avgNumParticipants = 69;
  const Pn_max = 1.2;

  const Pn_tmp = Math.sqrt(numPilots / avgNumParticipants);
  const Pn = Pn_tmp > Pn_max ? Pn_max : Pn_tmp;

  // 1 task: 0.5, 2 tasks: 0.8, 3 tasks: 1.0
  const Ta = 1.0;
  const compRanking = Pq * Pn * Ta;
  const Pplacing = (numPilots - 1 + 1) / numPilots;
  const Pp = Math.max(Pplacing ** (1 + Pq), Pplacing ** 2);
  const WPR = +(100 * Pp * Pq * Pn * Ta).toFixed(2); // *Td

  return {
    numPilots,
    Pq: Pq.toFixed(3),
    Pq_srp,
    Pq_srtp,
    Pn,
    compRanking: compRanking.toFixed(3),
    Pp,
    WPR,
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

async function getAirtribunePilots(url: string) {
  const response = await fetch(url);
  const body = await response.text();

  const jsonRegex = /window\.ATDATA\.pilots\s*=\s*({[\s\S]*?});/;
  const match = body.match(jsonRegex);

  if (match && typeof match[1] == "string") {
    const jsonData = JSON.parse(match[1]) as { pilots: AirtribunePilot[] };

    const confirmedPilots = jsonData.pilots.filter((el) => {
      return el.status == "confirmed" || el.status == "wildcard";
    });

    const pilots = confirmedPilots.map((el) => {
      return {
        name: el.name,
        nationality: el.country.ioc_code,
        civlID: parseInt(el.civl_id ?? "99999", 10),
        wing: el.glider_model,
        status: el.status,
      };
    });
    return pilots;
  } else {
    console.log("No JSON data found in the mixed text.");
    return [];
  }
}

async function getCivlcompPilots(url: string) {
  const response = await fetch(url);
  const body = await response.text();

  const $ = load(body, { xmlMode: true });

  const content = $(".participants-item");

  const rows = content.find("tr");

  interface RowData {
    [key: string]: string;
  }

  const data: RowData[] = [];

  rows.each((i, row) => {
    const columns = $(row).find("td");
    const rowData: RowData = {};

    columns.each((j, column) => {
      const columnName = content.find("th").eq(j).text().trim().toLowerCase();
      rowData[columnName] = $(column).text().trim();
    });

    data.push(rowData);
  });

  const confirmedPilots = data.filter((el) => {
    return el.status == "Confirmed" || el.status == "Wildcard";
  });

  const pilots = await Promise.all(
    confirmedPilots.map(async (el) => {
      const input = el.name ?? "";
      const name = input.split(" (")[0] ?? "";
      const civlID = await lookupCivlId(name);

      return {
        name,
        nationality: el.country,
        civlID,
        wing: el.glider,
        status: el.status,
      };
    })
  );

  return pilots;
}

interface CivlPilotLookup {
  id: number;
  text: string;
}
async function lookupCivlId(name: string) {
  const headersList = {
    Accept: "*/*",
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const bodyContent = `term=${name}`;
  const reqOptions = {
    url: "https://civlcomps.org/meta/search-profile/",
    method: "GET",
    headers: headersList,
    data: bodyContent,
  };

  try {
    const res = await axios.request<CivlPilotLookup[]>(reqOptions);
    // TODO: Handle multiple results for a name
    if (!res.data || !res.data.length) throw new Error(`No data for ${name}`);

    const data = res.data;
    if (data[0]) return data[0].id;
    else return 99999;
  } catch (error) {
    console.log(error);
    return 99999;
  }
}
