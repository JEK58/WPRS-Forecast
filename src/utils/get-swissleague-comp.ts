import { load } from "cheerio";
import { getCivlIds, CIVL_PLACEHOLDER_ID } from "@/utils/get-civl-ids";
import { getMaxPilotsFromDescription } from "@/utils/get-max-pilots-from-description";
import { evalMaxPilots } from "./eval-max-pilots";
import { getStartAndEndDateFromRange } from "./get-start-and-end-date-from-range";
import { getPosition } from "@/utils/utils";

// Gets the description of the comp and asks GPT to analyze it as this information
// is never found at the same spot like on airtribune or civlcomps
async function getCompDetails(url: string) {
  const response = await fetch(url);
  const body = await response.text();

  const $ = load(body);

  const compDate = $("h2").text();
  const dates = await getStartAndEndDateFromRange(compDate);

  const startDate = dates?.startDate;
  const endDate = dates?.endDate;

  const description = $(".fixed-section")
    .find(".dashboard")
    .remove()
    .end()
    .text();

  const maxPilots = await getMaxPilotsFromDescription(description);
  return {
    maxPilots: evalMaxPilots(maxPilots),
    compDate: { startDate, endDate },
  };
}

export async function getSwissleagueComp(url: string) {
  const compUrl = generateSwissleagueCompUrl(url);
  const detailsUrl = generateSwissleagueDetailsUrl(url);

  const response = await fetch(compUrl);
  const body = await response.text();
  const $ = load(body, { xmlMode: true });
  const compTitle = $("h1").text();

  const content = $(".mwc-datatable");
  const rows = content.find("tr");

  const compDetails = await getCompDetails(detailsUrl);

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

  const listOfPilots = data.map((el) => {
    const name = el.pilot ?? "";

    return {
      name: name.trim().toLowerCase(),
      nationality: el.country,
      civlID: CIVL_PLACEHOLDER_ID,
      wing: el.glider,
      status: el.status,
      confirmed: isConfirmed(el.status),
    };
  });

  const res = await getCivlIds(listOfPilots.map((p) => p.name));

  const pilotsWithCivlId = listOfPilots.map((pilot) => {
    pilot.civlID = res.civlIds.get(pilot.name) ?? CIVL_PLACEHOLDER_ID;
    return pilot;
  });

  return {
    pilots: pilotsWithCivlId,
    compTitle,
    pilotsUrl: compUrl,
    maxPilots: compDetails.maxPilots,
    compDate: {
      startDate: compDetails.compDate.startDate,
      endDate: compDetails.compDate.endDate,
    },
    statistics: res.statistics,
  };
}

function isConfirmed(status?: string) {
  return (
    status?.toLowerCase() == "paid" || status?.toLowerCase() == "free entry"
  );
}
function generateSwissleagueCompUrl(url: string) {
  return url.slice(0, getPosition(url, "/", 7)) + "/pilots";
}
function generateSwissleagueDetailsUrl(url: string) {
  return url.slice(0, getPosition(url, "/", 7)) + "/";
}
