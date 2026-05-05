import { getCivlIds, CIVL_PLACEHOLDER_ID } from "@/utils/get-civl-ids";
import { load } from "cheerio";

interface PWCApiResponse {
  subscriptions?: PilotDetails[];
  isSelectionStarted: boolean;
  subscriptionStatusesOrder?: string[];
}

type PWCApiDetails = {
  apiUrl?: string;
  startDate: string;
  endDate: string;
  name: string;
};

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

async function getPwcApiDetails(compUrl: string): Promise<PWCApiDetails | null> {
  try {
    // Fetch the main page and grab the iframe src
    const res = await fetch(compUrl, { cache: "no-store" });
    if (!res.ok) {
      console.error(`Failed to fetch ${compUrl}: ${res.statusText}`);
      return null;
    }

    const $ = load(await res.text());
    const iframeSrc = $("#advanced_iframe").attr("src");
    if (!iframeSrc) return getPwcEventDetails($);

    const name = $("h2.elementor-heading-title").first().text().trim();
    const dateText = $("i.u-icon-clock")
      .closest("li")
      .find(".elementor-icon-list-text")
      .text()
      .trim();
    const dateRange = parsePwcDateRange(dateText);

    if (!dateRange) {
      console.error("Date range not found in the page");
      return null;
    }

    const { startDate, endDate } = dateRange;

    // Fetch the iframe and pull out the api-url
    const frameRes = await fetch(iframeSrc, { cache: "no-store" });
    if (!frameRes.ok) {
      console.error(`Failed to fetch ${iframeSrc}: ${frameRes.statusText}`);
      return null;
    }

    const apiUrl = load(await frameRes.text())("selection[api-url]").attr(
      "api-url",
    );
    if (!apiUrl) {
      console.error("API URL not found in the page");
      return null;
    }

    return { apiUrl, startDate, endDate, name };
  } catch (error) {
    console.error("Error fetching or parsing page:", error);
    return null;
  }
}

function getPwcEventDetails($: ReturnType<typeof load>): PWCApiDetails | null {
  const event = $("[data-event]").first();
  const name = event.find("[data-flux-heading]").first().text().trim();
  const dateText = event.find("[data-date] span").first().text().trim();
  const dateRange = parsePwcDateRange(dateText);

  if (!name || !dateRange) {
    console.error("PWC event details not found in the page");
    return null;
  }

  return { name, ...dateRange };
}

function parsePwcDateRange(dateText: string) {
  const match = dateText.match(
    /(\d{2}\.\d{2}\.\d{4})\s*-\s*(\d{2}\.\d{2}\.\d{4})/,
  );

  if (!match) return null;

  const [, startDate, endDate] = match;

  if (!startDate || !endDate) return null;

  return { startDate, endDate };
}

function parseGermanDate(dateString: string): Date {
  const parts = dateString.split(".");
  if (parts.length !== 3) {
    throw new Error(`Invalid date format: ${dateString}`);
  }

  const [dayStr, monthStr, yearStr] = parts;
  const day = Number(dayStr);
  const month = Number(monthStr) - 1; // JS months are 0-indexed
  const year = Number(yearStr);

  // Basic validation
  if (
    Number.isNaN(day) ||
    Number.isNaN(month) ||
    Number.isNaN(year) ||
    day < 1 ||
    month < 0 ||
    month > 11 ||
    year < 0
  ) {
    throw new Error(`Invalid date components: ${dateString}`);
  }

  return new Date(year, month, day);
}

export async function getPwcComp(url: string) {
  const compUrl = normalizePwcUrl(url);

  if (!compUrl) {
    console.error("Invalid PWC URL provided");
    return;
  }
  const details = await getPwcApiDetails(compUrl);
  if (!details) {
    console.error("Failed to retrieve competition details");
    return;
  }

  const compTitle = details?.name;
  const startDate = parseGermanDate(details?.startDate ?? "");
  const endDate = parseGermanDate(details?.endDate ?? "");

  if (!details.apiUrl) {
    return {
      compTitle,
      maxPilots: MAX_PILOTS,
      pilots: [],
      compDate: { startDate, endDate },
      pilotsUrl: compUrl,
    };
  }

  const femaleApiUrl = details.apiUrl + "?gender=female";
  const maleApiUrl = details.apiUrl + "?gender=male";

  const [maleRes, femaleRes] = await Promise.all([
    await fetch(maleApiUrl, { cache: "no-store" }),
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

function normalizePwcUrl(input: string) {
  const pwcaEventsRe =
    /^(?:https?:\/\/)?(?:www\.)?pwca\.events\/([^\/#?]+)(?:[\/#?].*)?$/i;
  const pwcaOrgEventsRe =
    /^(?:https?:\/\/)?(?:www\.)?pwca\.org\/events\/([^\/#?]+)(?:[\/#?].*)?$/i;

  const trimmedInput = input.trim();
  const pwcaEventsMatch = trimmedInput.match(pwcaEventsRe);
  if (pwcaEventsMatch?.[1]) return `https://pwca.events/${pwcaEventsMatch[1]}`;

  const pwcaOrgEventsMatch = trimmedInput.match(pwcaOrgEventsRe);
  if (pwcaOrgEventsMatch?.[1])
    return `https://pwca.org/events/${pwcaOrgEventsMatch[1]}`;

  return null;
}
