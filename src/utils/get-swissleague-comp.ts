import { load } from "cheerio";
import { getCivlId } from "@/utils/get-civl-id";
import { getMaxPilotsFromDescription } from "@/utils/get-max-pilots-from-description";
import { evalMaxPilots } from "./eval-max-pilots";

// Gets the description of the comp and asks GPT to analyze it as this information
// is never found at the same spot like on airtribune or civlcomps
async function getMaxPilots(url: string) {
  const response = await fetch(url);
  const body = await response.text();

  const $ = load(body, { xmlMode: true });

  const description = $(".bordered-section").text();
  const maxPilots = await getMaxPilotsFromDescription(description);
  return evalMaxPilots(maxPilots);
}

export async function getSwissleagueComp(url: string, detailsUrl: string) {
  const response = await fetch(url);
  const body = await response.text();

  const $ = load(body, { xmlMode: true });
  const compTitle = $("h1").text();

  const content = $(".mwc-datatable");
  const rows = content.find("tr");

  const maxPilots = await getMaxPilots(detailsUrl);

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

  const pilots = await Promise.all(
    data.map(async (el) => {
      const name = el.pilot ?? "";
      const civlID = await getCivlId(name);

      return {
        name,
        nationality: el.country,
        civlID,
        wing: el.glider,
        status: el.status,
        confirmed: isConfirmed(el.status),
      };
    })
  );

  return { pilots, compTitle, maxPilots };
}

function isConfirmed(status?: string) {
  return (
    status?.toLowerCase() == "paid" || status?.toLowerCase() == "free entry"
  );
}
