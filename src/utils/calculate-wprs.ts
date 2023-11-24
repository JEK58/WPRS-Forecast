import { prisma } from "@/server/db";
import { type Ranking } from "@prisma/client";
import { type Pilot, type CompForecast } from "@/types/common";
import Redis from "ioredis";
import { env } from "@/env.mjs";

const REDIS_EXP_TIME = 60 * 60; // 1 hour
const AVG_NUM_PARTICIPANTS = 76; // June 2022-June 2023

export async function calculateWPRS(
  pilots: Pilot[],
  maxPilots?: number,
): Promise<CompForecast | undefined> {
  // Variable names according to the CIVL document
  // https://www.fai.org/sites/default/files/civl/documents/sporting_code_s7_e_-_wprs_2022.pdf

  if (pilots.length < 2) return;

  const worldRankingDate = (await prisma.ranking.findFirst())?.date;
  if (!worldRankingDate) throw new Error("No world ranking date found");

  const numberOfPilots = Math.min(pilots.length, maxPilots || pilots.length);

  /**
   * Quality of participants (Pq)
   * To find Pq we use the last ranking prior to the competition and find
   * the sum of ranking-points for the top 1/2 ranked pilots that are entered
   * in the competition (Pq_srp). Then we find the sum of ranking-points as
   * if those pilots would have been the top ranked pilots of the world (Pq_srtp).
   * This gives us 1.0 if the top ranked pilots had actually entered and
   * 0.0 if no ranked pilots are entered.
   * To avoid Pq = 0 for comps with no ranked pilots set a lower limit of 0.2.
   */

  const Pq_srp = await getPq_srp(pilots, numberOfPilots);
  const Pq_srtp = await getPq_srtp(numberOfPilots);
  const Pq_min = 0.2;

  const Pq = (Pq_srp / Pq_srtp) * (1 - Pq_min) + Pq_min;

  // 1.2, saying that a competition with slightly more than average number of participants is a good benchmark.
  const Pn_max = 1.2;

  // The number of participants compared to other competitions in same ranking (Pn).
  const Pn_tmp = Math.sqrt(numberOfPilots / AVG_NUM_PARTICIPANTS);
  const Pn = Pn_tmp > Pn_max ? Pn_max : Pn_tmp;

  const compRanking = Pq * Pn;

  const factors = calcPilotPointFactors(numberOfPilots, Pq);

  const WPRS = factors.map((factor) => calcWPR(factor, Pq, Pn));

  return {
    worldRankingDate,
    numPilots: numberOfPilots,
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

async function getPq_srtp(numberOfPilots: number) {
  const topPilots = await prisma.ranking.findMany({
    orderBy: [{ rank: "asc" }],
    take: numberOfPilots / 2,
  });

  return topPilots.reduce((a, b) => a + b.points, 0);
}

async function getPq_srp(pilots: Pilot[], numberOfPilots: number) {
  const redis = new Redis({ host: env.REDIS_URL });
  const compPilotsWprs: number[] = [];

  for (const pilot of pilots) {
    const civl = pilot.civlID;

    if (!civl || isNaN(civl) || civl > 99999) {
      compPilotsWprs.push(0);
      continue;
    }

    let pilotRanking: Ranking | null;
    const cachedRanking = await redis.get(`civl:${civl}`);

    if (cachedRanking) pilotRanking = JSON.parse(cachedRanking) as Ranking;
    else {
      pilotRanking = await prisma.ranking.findUnique({ where: { id: civl } });
      await redis.set(
        `civl:${civl}`,
        JSON.stringify(pilotRanking),
        "EX",
        REDIS_EXP_TIME,
      );
    }

    compPilotsWprs.push(pilotRanking?.points ?? 0);
  }
  return compPilotsWprs
    .sort((a, b) => b - a)
    .slice(0, numberOfPilots / 2)
    .reduce((a, b) => a + b);
}

function calcWPR(factor: number, Pq: number, Pn: number) {
  // Competition success (Ta) 1 task: 0.5, 2 tasks: 0.8, 3 tasks: 1.0
  const success = [0.5, 0.8, 1] as const;

  const formula = (success: number, factor: number) =>
    +(100 * factor * Pq * Pn * success).toFixed(1);

  return {
    Ta1: +formula(success[0], factor),
    Ta2: +formula(success[1], factor),
    Ta3: +formula(success[2], factor),
  };
}
