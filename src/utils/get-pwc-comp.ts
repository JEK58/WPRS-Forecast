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

  const response = await fetch(compUrl);
  const body = await response.text();

  const $ = load(body, { xmlMode: true });
  const compTitle = $('h2[class="title"]').text();
  const compDate = $(".information").text().trim();

  const dates = await getStartAndEndDateFromRange(compDate);

  const startDate = dates?.startDate;
  const endDate = dates?.endDate;

  const apiUrl = compUrl.replace("pwca.org", "pwca.org/api");
  const femaleApiUrl = apiUrl + "?gender=female";

  const [maleRes, femaleRes] = await Promise.all([
    await fetch(apiUrl),
    await fetch(femaleApiUrl),
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
  console.log("Gettting CIVL IDs");

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

  // If it's a running event using the new .events page: Create the legacy url from an h2
  const response = await fetch(url);
  const body = await response.text();

  const $ = load(body, { xmlMode: true });

  const h2 = $("h2")
    .eq(0)
    .text()
    .trim()
    .toLocaleLowerCase()
    .replaceAll(" ", "-")
    .replaceAll("-–-", "-") // - vs –
    .replaceAll(",", "");

  // The superfinal api url starts with its season year number even if it's held in the current year
  // We therefore need to find the year in the h2 otherwise with just take the current one and hope for the best.

  const year = findYearInString(h2) ?? new Date().getFullYear();

  return "https://pwca.org/events/" + year + "-" + h2 + "/selection";
}

function findYearInString(str: string): string | null {
  const match = str.match(/\b(20)\d{2}\b/);
  return match ? match[0] : null;
}
