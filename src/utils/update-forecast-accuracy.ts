import { prisma } from "@/server/db";
import { load } from "cheerio";

const CIVL_URL = "https://civlcomps.org/ranking/paragliding-xc/competitions";

export async function updateForecastAccuracy() {
  const res = await fetch(CIVL_URL);
  const body = await res.text();

  const $ = load(body, { xmlMode: true });

  const comps: { name: string; wpr: number; validity: number }[] = [];

  $("#tableMain tr").each((_, row) => {
    const columns = $(row).find("td"); // Find all columns in the row

    if (columns.length >= 2) {
      const name = $(columns[1]).text().trim();
      const validity = $(columns[3]).text().trim();
      const wpr = $(columns[13]).text().trim();

      comps.push({ name: name, wpr: +wpr, validity: +validity });
    }
  });

  // Only use comps that are fully valid according to CIVL
  const validComps = comps.filter((comp) => comp.validity == 1);

  // Only use forecasts of the recent 12 months
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const usage = await prisma.usage.findMany({
    select: { compTitle: true, wprs: true, createdAt: true },
    where: {
      compTitle: { not: null },
      wprs: { not: null },
      createdAt: {
        gt: oneYearAgo,
      },
    },
    orderBy: { compTitle: "asc" },
  });

  const filteredArray = usage
    .filter((u) => u.compTitle != "")
    .reduce((acc, curr) => {
      const existingEntry = acc.find(
        (entry) => entry.compTitle === curr.compTitle,
      );
      if (!existingEntry) {
        acc.push(curr);
      } else if (curr.createdAt > existingEntry.createdAt) {
        existingEntry.createdAt = curr.createdAt;
        existingEntry.wprs = curr.wprs;
      }
      return acc;
    }, []);

  const acc = validComps
    .map((comp) => {
      const existingEntry = filteredArray.find(
        (entry) => entry.compTitle === comp.name,
      );
      if (existingEntry) {
        console.log(
          "🚀 ~ existingEntry:",
          existingEntry.wprs - comp.wpr,
          existingEntry,
          comp,
        );
        return Math.abs(existingEntry.wprs - comp.wpr);
      }
    })
    .filter(Boolean);

  const mean = (acc.reduce((a, b) => a + b, 0) / acc.length).toFixed(2);
  console.log("🚀 ~ mean: ±", mean, "for", acc.length, "comps");
}
