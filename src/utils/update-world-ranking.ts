import XLSX from "xlsx";
import playwright from "playwright";

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

  const worldRanking = XLSX.utils.sheet_to_json(worksheet);
  console.log("🚀 ~ worldRanking:", worldRanking);
}

async function downloadExcel() {
  const browser = await playwright["chromium"].launch();
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  await page.goto(civlURL);
  const [download] = await Promise.all([
    page.waitForEvent("download"), // wait for download to start
    page.click(".icon-exel"),
  ]);
  // wait for download to complete
  await download.saveAs("./input.xlsx");
  await browser.close();
}
