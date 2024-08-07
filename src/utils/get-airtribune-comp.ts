import type { CompDetails, Pilot } from "@/types/common";
import { load } from "cheerio";
import { evalMaxPilots } from "./eval-max-pilots";
import { getStartAndEndDateFromRange } from "./get-start-and-end-date-from-range";
import { getPosition } from "@/utils/utils";

interface AirtribunePilot
  extends Omit<Pilot, "civlID" | "wing" | "nationality"> {
  country: { ioc_code: string };
  glider_model: string;
  civl_id: string;
}

const CIVL_PLACEHOLDER_ID = 99999;

export async function getAirtribuneComp(
  url: string,
): Promise<CompDetails | undefined> {
  const compUrl = generateAirtribuneCompUrl(url);

  const response = await fetch(compUrl, { cache: "no-store" });
  const body = await response.text();
  // Find competition name
  const $ = load(body, { xmlMode: true });
  const compTitle = $('meta[property="og:title"]')
    .attr("content")
    ?.replace("Pilots | ", "");

  const jsonRegex = /window\.ATDATA\.pilots\s*=\s*({[\s\S]*?});/;
  const match = body.match(jsonRegex);
  const dateRegex = /window\.ATDATA\.meta\s*=\s*({[^;]+});/;

  const dateMatch = body.match(dateRegex);

  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (dateMatch && typeof dateMatch[1] == "string") {
    const jsonData = JSON.parse(dateMatch[1]) as {
      info: { description: string };
    };
    const info = jsonData.info.description;

    const dates = await getStartAndEndDateFromRange(info);

    startDate = dates?.startDate;
    endDate = dates?.endDate;
  }
  if (match && typeof match[1] == "string") {
    const jsonData = JSON.parse(match[1]) as {
      pilots: AirtribunePilot[];
      allowed2: string;
    };

    // Convert number of max pilots to int
    const num = parseInt(jsonData.allowed2);
    const maxPilots = evalMaxPilots(isNaN(num) ? 0 : num);

    const pilots = jsonData.pilots.map((el) => {
      // Make sure that the CIVL ID is a number and not greater than 99999
      const civlID = Math.min(
        CIVL_PLACEHOLDER_ID,
        parseInt(el.civl_id ?? CIVL_PLACEHOLDER_ID.toString(), 10),
      );
      return {
        name: el.name,
        nationality: el.country.ioc_code,
        civlID,
        wing: el.glider_model,
        status: el.status,
        confirmed: isConfirmed(el.status),
      };
    });

    return {
      pilots,
      compTitle,
      pilotsUrl: compUrl,
      maxPilots,
      compDate: { startDate, endDate },
    };
  } else {
    console.log("No JSON data found");
    return;
  }
}

function isConfirmed(status?: string) {
  return (
    status?.toLowerCase() == "confirmed" ||
    status?.toLowerCase() == "wildcard" ||
    status?.toLowerCase() == "team_pilot"
  );
}

function generateAirtribuneCompUrl(url: string) {
  return url.slice(0, getPosition(url, "/", 4)) + "/pilots";
}
