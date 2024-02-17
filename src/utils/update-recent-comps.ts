import { prisma } from "@/server/db";

export async function updateRecentComps() {
  const comps = await scrapeRecentCivlComps();

  // Update DB
  const deleted = await prisma.compRanking.deleteMany({});
  console.log("🗑️ ~ Deleted comp ranking entries:", deleted.count);

  const entries = await prisma.compRanking.createMany({ data: comps });
  console.log("🧪 ~ New comp ranking entries:", entries.count);
}

import { load } from "cheerio";

const CIVL_URL = "https://civlcomps.org/ranking/paragliding-xc/competitions";

export async function scrapeRecentCivlComps() {
  const res = await fetch(CIVL_URL);
  const body = await res.text();

  const $ = load(body, { xmlMode: true });

  const table = $("#tableMain");
  const tbody = table.find("tbody");

  const comps = tbody
    .children()
    .map((_, element) => {
      const row = $(element);

      const resultsUpdated = row.find("td").eq(14).text();

      if (!resultsUpdated) return;

      const comp = {
        period: row.find("td").eq(0).text(),
        name: row.find("td").eq(1).text(),
        link: row.find("td").eq(1).find("a").attr("href"),
        discipline: row.find("td").eq(2).text(),
        ta: parseFloat(row.find("td").eq(3).text()),
        pn: parseFloat(row.find("td").eq(4).text()),
        pq: parseFloat(row.find("td").eq(5).text()),
        td: parseFloat(row.find("td").eq(6).text()),
        tasks: parseInt(row.find("td").eq(7).text()),
        pilots: parseInt(row.find("td").eq(8).text()),
        pilotsLast12Months: parseInt(row.find("td").eq(9).text()),
        compsLast12Months: parseInt(row.find("td").eq(10).text()),
        daysSinceCompEnd: parseInt(row.find("td").eq(11).text()),
        lastScore: parseFloat(row.find("td").eq(12).text()),
        winnerScore: parseFloat(row.find("td").eq(13).text()),
        resultsUpdated: new Date(resultsUpdated),
      };

      if (
        !comp.tasks ||
        comp.winnerScore === Number.NaN ||
        !comp.resultsUpdated
      )
        return;
      return comp;
    })
    .get();

  return comps;
}
