import XLSX from "xlsx";
import playwright from "playwright";
import { prisma } from "@/server/db";
import { normalizeName } from "./lookup-civl-id";
import { z } from "zod";

const civlURL = "https://civlcomps.org/ranking/paragliding-xc/pilots";

export async function updateWorldRanking() {
  await downloadExcel();

  interface CivlXlsEntry {
    Rank: number;
    "CIVL ID": number;
    Name: string;
    Gender: string;
    Nation: string;
    Points: number;
    r1: number;
    p1: number;
    e1: string;
    r2: number;
    p2: number;
    e2: string;
    r3: number;
    p3: number;
    e3: string;
    r4: number;
    p4: number;
    e4: string;
  }

  const workbook = XLSX.readFile("input.xlsx");
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName ?? ""];

  if (!worksheet) throw new Error("No data found in excel");

  // Get the range of cells in the worksheet
  const range = XLSX.utils.decode_range(worksheet["!ref"] ?? "");

  // Remove the first three rows by updating the range
  range.s.r = 4;

  // Update the range in the worksheet
  worksheet["!ref"] = XLSX.utils.encode_range(range);

  const worldRanking: CivlXlsEntry[] = XLSX.utils.sheet_to_json(worksheet);

  const newEntry = z.object({
    id: z.number(),
    name: z.string(),
    gender: z.string(),
    points: z.number(),
    rank: z.number(),
    nation: z.string(),
  });

  const data = worldRanking
    .filter((el) => el.Name && el["CIVL ID"] && el.Rank)
    .map((el) => {
      return newEntry.parse({
        id: el["CIVL ID"],
        name: el.Name,
        gender: el.Gender,
        points: el.Points,
        rank: el.Rank,
        nation: el.Nation,
      });
    });

  // console.log("🚀 ~ data:", data.at(-1));

  for (const el of data) {
    const res = await prisma.ranking.create({ data: el });
    console.log("🚀 ~ res:", res);
  }

  // const res = await prisma.ranking.createMany({ data });
  // console.log(res);
}
async function downloadExcel() {
  const browser = await playwright["chromium"].launch();
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  await page.goto(civlURL);
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.click(".icon-exel"),
  ]);
  await download.saveAs("./input.xlsx");
  await browser.close();
}
