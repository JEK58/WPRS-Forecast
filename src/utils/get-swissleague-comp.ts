import { load } from "cheerio";
import { getCivlId, getCookie } from "@/utils/get-civl-id";
import { getMaxPilotsFromDescription } from "@/utils/get-max-pilots-from-description";
import { evalMaxPilots } from "./eval-max-pilots";
import { getStartAndEndDateFromRange } from "./get-start-and-end-date-from-range";

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

export async function getSwissleagueComp(url: string, detailsUrl: string) {
  const response = await fetch(url);
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
  // Get CIVL cookies
  const cookies = await getCookie();
  if (!cookies) throw new Error("No cookies found");

  const pilots = await Promise.all(
    data.map(async (el) => {
      const name = el.pilot ?? "";
      const civlID = await getCivlId(name, cookies);

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

  return {
    pilots,
    compTitle,
    maxPilots: compDetails.maxPilots,
    compDate: {
      startDate: compDetails.compDate.startDate,
      endDate: compDetails.compDate.endDate,
    },
  };
}

function isConfirmed(status?: string) {
  return (
    status?.toLowerCase() == "paid" || status?.toLowerCase() == "free entry"
  );
}
