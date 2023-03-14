import axios from "axios";
import { load } from "cheerio";

const CIVL_PLACEHOLDER_ID = 99999;
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

  const reqOptions = {
    url: "https://civlcomps.org/meta/search-profile/",
    method: "GET",
    headers: headersList,
    data: `term=${name}`,
  };

  try {
    const res = await axios.request<CivlPilotLookup[]>(reqOptions);
    if (!res.data || !res.data.length) {
      console.log(`❗️ ~ No data for ${name}`);
      return CIVL_PLACEHOLDER_ID;
    }

    const data = res.data;

    if (data.length > 1) {
      const filtered = data.filter((el) => el.text.includes(name));
      if (!filtered[0]) {
        console.log(`❗️ ~ No data for ${name}`);
        return CIVL_PLACEHOLDER_ID;
      }
      console.log(
        `❗️ ~ Multiple results for ${name}. Picked: ${filtered[0].text}`
      );
      return filtered[0].id;
    }
    if (data[0]) return data[0].id;
    else return CIVL_PLACEHOLDER_ID;
  } catch (error) {
    console.log(error);
    return CIVL_PLACEHOLDER_ID;
  }
}
