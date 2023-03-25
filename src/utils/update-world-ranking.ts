import XLSX from "xlsx";
import { prisma } from "@/server/db";
import { z } from "zod";
import axios from "axios";
import { load } from "cheerio";
import fs from "fs";

const CIVL_URL = "https://civlcomps.org/ranking/paragliding-xc/pilots";
const DOWNLOAD_URL =
  "https://civlcomps.org/ranking/export-new?rankingId=1557&type=export_pilots_ranking&format=xlsx&async=1";
const FILE_PATH = "./tmp/input.xlsx";

export async function updateWorldRanking() {
  // Download world ranking excel and get date of world ranking
  const worldRankingDate = await downloadExcel();

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

  const workbook = XLSX.readFile(FILE_PATH);
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
    date: z.date(),
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
        date: worldRankingDate,
      });
    });

  // Update DB
  const deleted = await prisma.ranking.deleteMany({});
  console.log("🗑️ ~ Deleted entries:", deleted.count);

  const entries = await prisma.ranking.createMany({ data });
  console.log("🧪 ~ New entries:", entries.count);
}

/**
 * 1. Gets cookie and csrf-token from the CIVL page
 * 2. Requests the hash of the excel download
 * 3. Waits for the download link to be generated
 * 4. Downloads the excel file
 * 5. Return the date of the latest CIVL DB update
 */
async function downloadExcel() {
  const res = await fetch(CIVL_URL);
  const body = await res.text();

  const $ = load(body, { xmlMode: true });

  const csrfToken = $('meta[name="csrf-token"]').attr("content");
  const dateEl = $(".search-pilots .text-muted").text();

  if (!dateEl) throw new Error("World ranking date not found");
  const date = new Date(dateEl.trim());

  const cookies = res.headers
    .get("set-cookie")
    ?.split(",")
    .map((el) => el.split(";")[0])
    .join("; ");

  const reqOptions = {
    url: DOWNLOAD_URL,
    method: "POST",
    headers: {
      "x-csrf-token": csrfToken,
      cookie: cookies,
    },
  };
  interface HashResponse {
    status?: string;
    hash?: string;
    url?: boolean | string;
  }

  const resHash = await axios.request<HashResponse>(reqOptions);

  if (!resHash.data.hash)
    throw new Error("Error while generating download file hash");

  const hash = resHash?.data.hash;
  const fileUrl = DOWNLOAD_URL + "&hash=" + hash;

  let fileReady = false;
  let link = "";
  while (!fileReady) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const res = await fetch(fileUrl);
    const dl = (await res.json()) as HashResponse;

    if (typeof dl.url === "string") {
      link = dl.url;
      fileReady = true;
    }
  }

  const download = await axios<fs.WriteStream>({
    url: link,
    method: "GET",
    responseType: "stream",
  });

  download.data.pipe(fs.createWriteStream(FILE_PATH));
  await new Promise((resolve, reject) => {
    download.data.on("end", resolve);
    download.data.on("error", reject);
  });

  return date;
}
