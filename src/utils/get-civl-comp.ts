import { load } from "cheerio";
import { CIVL_PLACEHOLDER_ID } from "@/utils/get-civl-ids";
import { evalMaxPilots } from "./eval-max-pilots";
import { getStartAndEndDateFromRange } from "./get-start-and-end-date-from-range";
import { type CompDetails, type Pilot } from "@/types/common";
import { getPosition } from "@/utils/utils";

export async function getCivlcompsComp(
  url: string,
): Promise<CompDetails | undefined> {
  const compUrl = generateCivlCompUrl(url);

  const response = await fetch(compUrl);
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

  // Loop through table rows and find pilots
  const pilots: Pilot[] = [];
  rows.each((_, row) => {
    const $row = $(row);

    const name = $row.find('td[data-col="name"]').text().trim();
    const nationality = $row.find('td[data-col="ioc"]').text().trim();
    const civlID = $row.attr("data-profile-id");
    const status = $row.find('td[data-col="status"]').text().trim();
    const wing = $row.find('td[data-col="wing_model"]').text().trim();

    if (name == "") return;

    const convertToNumber = (str: string | undefined) => {
      if (str == undefined) return undefined;
      const num = parseInt(str);
      if (isNaN(num)) return undefined;
      else return num;
    };

    pilots.push({
      name,
      nationality,
      civlID: convertToNumber(civlID) ?? CIVL_PLACEHOLDER_ID,
      wing,
      status,
      confirmed: isConfirmed(status),
    });
  });

  return {
    compTitle,
    maxPilots,
    pilots,
    compDate,
  };
}

function isConfirmed(status?: string) {
  return (
    status?.toLowerCase() == "confirmed" || status?.toLowerCase() == "wildcard"
  );
}

function generateCivlCompUrl(url: string) {
  return url.slice(0, getPosition(url, "/", 5)) + "/participants";
}
