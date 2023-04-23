import { load } from "cheerio";
import { lookupCivlId } from "@/utils/lookup-civl-id";

export async function getSwissleaguePilots(url: string) {
  const response = await fetch(url);
  const body = await response.text();

  const $ = load(body, { xmlMode: true });

  const content = $(".mwc-datatable");

  const rows = content.find("tr");

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

  const confirmedPilots = data.filter((el) => {
    return el.status == "Paid" || el.status == "Free Entry";
  });

  const pilots = await Promise.all(
    confirmedPilots.map(async (el) => {
      const name = el.pilot ?? "";
      const civlID = await lookupCivlId(name);

      return {
        name,
        nationality: el.country,
        civlID,
        wing: el.glider,
        status: el.status,
      };
    })
  );

  return pilots;
}
