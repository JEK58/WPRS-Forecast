import { load } from "cheerio";
import { getCivlIds, CIVL_PLACEHOLDER_ID } from "@/utils/get-civl-ids";
import { evalMaxPilots } from "./eval-max-pilots";
import { getStartAndEndDateFromRange } from "./get-start-and-end-date-from-range";

export async function getCivlcompsComp(url: string) {
  const response = await fetch(url);
  const body = await response.text();

  const $ = load(body, { xmlMode: true });

  // Find max num of pilots
  const maxPilotsString = $(".wrapper-info").find(".count").eq(2).text();
  const num = parseInt(maxPilotsString);
  const maxPilots = evalMaxPilots(isNaN(num) ? 0 : num);

  // Comp details
  const compTitle = $("h1").text();
  const compDateString = $(".date-event").text();
  const content = $(".participants-item");
  const rows = content.find("tr");

  const compDate = await getStartAndEndDateFromRange(compDateString);

  interface RowData {
    [key: string]: string;
  }

  const data: RowData[] = [];
  // Loop through table rows and find pilots
  rows.each((_, row) => {
    const columns = $(row).find("td");
    const rowData: RowData = {};

    columns.each((j, column) => {
      const columnName = content.find("th").eq(j).text().trim().toLowerCase();
      rowData[columnName] = $(column).text().trim();
    });
    data.push(rowData);
  });

  // Create list of pilots
  const listOfPilots = data
    .filter((el) => typeof el.name == "string")
    .map((el) => {
      const input = el.name;
      const name = input?.split(" (")[0] ?? "";

      return {
        name,
        nationality: el.country,
        civlID: CIVL_PLACEHOLDER_ID,
        wing: el.glider,
        status: el.status,
        confirmed: isConfirmed(el.status),
      };
    });

  // Add CIVL IDs
  const civlIds = await getCivlIds(listOfPilots);

  const pilotsWithCivlId = listOfPilots.map((pilot) => {
    pilot.civlID = civlIds.get(pilot.name) ?? CIVL_PLACEHOLDER_ID;
    return pilot;
  });

  return {
    compTitle,
    maxPilots,
    pilots: pilotsWithCivlId,
    compDate,
  };
}

function isConfirmed(status?: string) {
  return (
    status?.toLowerCase() == "confirmed" || status?.toLowerCase() == "wildcard"
  );
}
