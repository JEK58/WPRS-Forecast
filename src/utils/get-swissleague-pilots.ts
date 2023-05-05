import { load } from "cheerio";
import { getCivlId } from "@/utils/get-civl-id";

export async function getSwissleaguePilots(url: string) {
  const response = await fetch(url);
  const body = await response.text();

  const $ = load(body, { xmlMode: true });
  const compTitle = $("h1").text();

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

  const pilots = await Promise.all(
    data.map(async (el) => {
      const name = el.pilot ?? "";
      const civlID = await getCivlId(name);

      return {
        compTitle,
        name,
        nationality: el.country,
        civlID,
        wing: el.glider,
        status: el.status,
        confirmed: isConfirmed(el.status),
      };
    })
  );

  return pilots;
}

function isConfirmed(status?: string) {
  return (
    status?.toLowerCase() == "paid" || status?.toLowerCase() == "free entry"
  );
}
