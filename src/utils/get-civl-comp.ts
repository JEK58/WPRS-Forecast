import { load } from "cheerio";
import { getCivlId } from "@/utils/get-civl-id";
import { evalMaxPilots } from "./eval-max-pilots";
import { getStartAndEndDateFromRange } from "./get-start-and-end-date-from-range";

async function getMaxPilots(url: string) {
  const response = await fetch(url);
  const body = await response.text();

  const $ = load(body, { xmlMode: true });

  const description = $(".wrapper-info").find(".count").eq(1).text();

  if (!description) return 0;

  const num = parseInt(description);
  return evalMaxPilots(isNaN(num) ? 0 : num);
}

export async function getCivlcompsComp(url: string, detailsUrl: string) {
  console.log("Fetching websites");

  const [maxPilots, response] = await Promise.all([
    getMaxPilots(detailsUrl),
    fetch(url),
  ]);
  const body = await response.text();

  console.log("Starting cheerio");

  const $ = load(body, { xmlMode: true });
  const compTitle = $("h1").text();
  const compDate = $(".date-event").text();
  const content = $(".participants-item");
  const rows = content.find("tr");

  const dates = await getStartAndEndDateFromRange(compDate);

  const startDate = dates?.startDate;
  const endDate = dates?.endDate;

  interface RowData {
    [key: string]: string;
  }

  const data: RowData[] = [];

  rows.each((_, row) => {
    const columns = $(row).find("td");
    const rowData: RowData = {};

    columns.each((j, column) => {
      const columnName = content.find("th").eq(j).text().trim().toLowerCase();
      rowData[columnName] = $(column).text().trim();
    });

    data.push(rowData);
  });
  console.log("Fetching CIVL IDs");

  const pilots = await Promise.all(
    data.map(async (el) => {
      const input = el.name ?? "";
      const name = input.split(" (")[0] ?? "";
      const civlID = await getCivlId(name);

      return {
        name,
        nationality: el.country,
        civlID,
        wing: el.glider,
        status: el.status,
        confirmed: isConfirmed(el.status),
      };
    }),
  );

  return { compTitle, maxPilots, pilots, compDate: { startDate, endDate } };
}

function isConfirmed(status?: string) {
  return (
    status?.toLowerCase() == "confirmed" || status?.toLowerCase() == "wildcard"
  );
}
