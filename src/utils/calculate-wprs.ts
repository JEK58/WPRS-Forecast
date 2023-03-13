// https://www.fai.org/sites/default/files/civl/documents/sporting_code_s7_e_-_wprs_2022.pdf

import playwright from "playwright";
import axios from "axios";
import { prisma } from "@/server/db";

interface Pilot {
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
}

const LOCAL_CHROME_EXECUTABLE =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

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
  console.log("🚀 ~ topPilots:", topPilots.length);
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
  // Edge executable will return an empty string locally.

  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  await page.goto(url);
  // await page.goto(
  //   "file:///Users/sschoepe/Documents/GitHub/wprs-calculator/flory-cup.html"
  // );

  await page.waitForSelector(".table-pilot");

  const data = await page.evaluate(() => {
    const rows = document.querySelectorAll(".table-pilot tr");
    return Array.from(rows, (row) => {
      const columns = row.querySelectorAll("td");
      return Array.from(columns, (column) => column.innerText);
    });
  });
  const confirmedPilots = data.filter((el) => {
    return el[6] == "Confirmed" || el[6] == "Wildcard";
  });
  const pilots = confirmedPilots.map((el) => {
    return {
      name: el[1],
      nationality: el[2],
      civlID: parseInt(el[3]?.split(":")[1] ?? "99999", 10),
      wing: el[5],
      status: el[6],
    };
  });

  await browser.close();
  return pilots;
}

async function getCivlcompPilots(url: string) {
  // Edge executable will return an empty string locally.
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();

  await page.goto(url);

  await page.waitForSelector(".participants-item");

  const data = await page.evaluate(() => {
    const rows = document.querySelectorAll(".participants-item tr");
    return Array.from(rows, (row) => {
      const columns = row.querySelectorAll("td");
      return Array.from(columns, (column) => column.innerText);
    });
  });

  const confirmedPilots = data.filter((el) => {
    return el[5] == "Confirmed" || el[5] == "Wildcard";
  });

  const pilots = await Promise.all(
    confirmedPilots.map(async (el) => {
      const input = el[1] ?? "";
      const name = input.split(" (")[0] ?? "";
      const civlID = await lookupCivlId(name);

      return {
        name,
        nationality: el[2],
        civlID,
        wing: el[3],
        status: el[5],
      };
    })
  );

  await browser.close();
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
