import axios from "axios";
import { load } from "cheerio";

export async function getCivlcompPilots(url: string) {
  const response = await fetch(url);
  const body = await response.text();

  const $ = load(body, { xmlMode: true });

  const content = $(".participants-item");

  const rows = content.find("tr");

  interface RowData {
    [key: string]: string;
  }

  const data: RowData[] = [];

  rows.each((i, row) => {
    const columns = $(row).find("td");
    const rowData: RowData = {};

    columns.each((j, column) => {
      const columnName = content.find("th").eq(j).text().trim().toLowerCase();
      rowData[columnName] = $(column).text().trim();
    });

    data.push(rowData);
  });

  const confirmedPilots = data.filter((el) => {
    return el.status == "Confirmed" || el.status == "Wildcard";
  });

  const pilots = await Promise.all(
    confirmedPilots.map(async (el) => {
      const input = el.name ?? "";
      const name = input.split(" (")[0] ?? "";
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

interface CivlPilotLookup {
  id: number;
  text: string;
}
async function lookupCivlId(name: string) {
  const headersList = {
    Accept: "*/*",
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const bodyContent = `term=${name}`;
  const reqOptions = {
    url: "https://civlcomps.org/meta/search-profile/",
    method: "GET",
    headers: headersList,
    data: bodyContent,
  };

  try {
    const res = await axios.request<CivlPilotLookup[]>(reqOptions);
    // TODO: Handle multiple results for a name
    if (!res.data || !res.data.length) throw new Error(`No data for ${name}`);

    const data = res.data;
    if (data[0]) return data[0].id;
    else return 99999;
  } catch (error) {
    console.log(error);
    return 99999;
  }
}
