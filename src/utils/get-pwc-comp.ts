import { getCivlIds, CIVL_PLACEHOLDER_ID } from "@/utils/get-civl-ids";
import { load } from "cheerio";
import { getStartAndEndDateFromRange } from "./get-start-and-end-date-from-range";
import { getPosition } from "@/utils/utils";

interface PWCApiResponse {
  subscriptions?: PilotDetails[];
  isSelectionStarted: boolean;
  subscriptionStatusesOrder?: string[];
}

type SubscriptionStatusKeys =
  | "confirmed"
  | "wildcard_confirmed"
  | "guest_card_confirmed"
  | "payment_in_progress"
  | "waiting_for_payment"
  | "wildcard"
  | "guest_card"
  | "waiting_list"
  | "cancelled"
  | "late_cancelled";

interface PilotDetails {
  season_number?: number | string;
  pilot?: string;
  country?: string;
  country_flag?: string;
  glider?: string;
  harness?: string;
  sponsor?: string;
  status?: string;
  status_key?: SubscriptionStatusKeys;
  is_late?: boolean;
  qualification_letters?: string;
}

// https://pwca.org/storage/3539/PWCA-Competition-Rules-2023.pdf
const MAX_PILOTS = 125;

export async function getPwcComp(url: string) {
  const compUrl = await generatePwcCompUrl(url);
  if (!compUrl) return;

  const response = await fetch(compUrl, { cache: "no-store" });
  const body = await response.text();

  const $ = load(body, { xmlMode: true });
  const compTitle = $("h2.elementor-heading-title")
    .first()
    .text()
    .replace("Paragliding World Cup", "PWC")
    .replaceAll(",", " ")
    .trim();

  const compDate = $(
    "div.elementor-icon-list--layout-traditional .elementor-icon-list-text",
  )
    .first()
    .text();

  const dates = await getStartAndEndDateFromRange(compDate);

  const startDate = dates?.startDate;
  const endDate = dates?.endDate;

  const apiUrl = getApiUrl(compUrl);
  if (!apiUrl) return;

  const femaleApiUrl = apiUrl + "?gender=female";

  const [maleRes, femaleRes] = await Promise.all([
    await fetch(apiUrl, { cache: "no-store" }),
    await fetch(femaleApiUrl, { cache: "no-store" }),
  ]);

  if (maleRes.status == 404 || femaleRes.status == 404) return;

  const male = (await maleRes.json()) as PWCApiResponse;
  const female = (await femaleRes.json()) as PWCApiResponse;

  const mergedData = [
    ...(male.subscriptions ?? []),
    ...(female.subscriptions ?? []),
  ];

  if (!mergedData.length) return;

  const listOfPilots = mergedData.map((el) => {
    const input = el.pilot ?? "";
    const name = input.split(" (")[0] ?? "";

    return {
      name: name.trim().toLowerCase(),
      nationality: el.country,
      civlID: CIVL_PLACEHOLDER_ID,
      wing: el.glider,
      status: el.status,
      confirmed: isConfirmed(el.status_key),
    };
  });
  console.log("Getting CIVL IDs");

  const res = await getCivlIds(listOfPilots.map((p) => p.name));

  const pilotsWithCivlId = listOfPilots.map((pilot) => {
    pilot.civlID = res.civlIds.get(pilot.name) ?? CIVL_PLACEHOLDER_ID;
    return pilot;
  });

  return {
    compTitle,
    maxPilots: MAX_PILOTS,
    pilots: pilotsWithCivlId,
    compDate: { startDate, endDate },
    pilotsUrl: compUrl,
    statistics: res.statistics,
  };
}

function isConfirmed(status?: string) {
  return (
    status?.toLowerCase() == "confirmed" ||
    status?.toLowerCase() == "wildcard" ||
    status?.toLowerCase() == "guest_card_confirmed"
  );
}

async function generatePwcCompUrl(url: string) {
  if (url.includes("pwca.org"))
    return url.slice(0, getPosition(url, "/", 5)) + "/selection";

  return url.slice(0, getPosition(url, "/", 4));
}

// Upcoming 2024 PWCs
// Hardcoded because the PWC website constantly gets updated and refactored which makes it hard to scrape
function getApiUrl(url: string) {
  if (url.includes("world-cup-yelmo-spain-2024"))
    return "https://pwca.org/api/events/2024-paragliding-world-cup-spain-yelmo-2024/selection";
  if (url.includes("world-cup-cameli-turkey-2024"))
    return "https://pwca.org/api/events/2024-paragliding-world-cup-turkey-cameli-2024/selection";
  if (url.includes("world-cup-gourdon-france-2024"))
    return "https://pwca.org/api/events/2024-paragliding-world-cup-france-gourdon-2024/selection";
  if (url.includes("world-cup-monroe-usa-2024"))
    return "https://pwca.org/api/events/2024-paragliding-world-cup-usa-monroe-2024/selection";
}
