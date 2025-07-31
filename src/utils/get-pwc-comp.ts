import { getCivlIds, CIVL_PLACEHOLDER_ID } from "@/utils/get-civl-ids";
import { load } from "cheerio";

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

async function getPwcApiDetails(compUrl: string) {
  try {
    // Fetch the main page and grab the iframe src
    const res = await fetch(compUrl, { cache: "no-store" });
    if (!res.ok) {
      console.error(`Failed to fetch ${compUrl}: ${res.statusText}`);
      return null;
    }

    const $ = load(await res.text());
    const iframeSrc = $("#advanced_iframe").attr("src");
    if (!iframeSrc) {
      console.error("Iframe URL not found in the page");
      return null;
    }

    const name = $("h2.elementor-heading-title").first().text().trim();

    // find the clock‐icon list item and grab its text
    const dateText = $("i.u-icon-clock")
      .closest("li")
      .find(".elementor-icon-list-text")
      .text()
      .trim();

    // match “DD.MM.YYYY - DD.MM.YYYY”
    const match = dateText.match(
      /(\d{2}\.\d{2}\.\d{4})\s*-\s*(\d{2}\.\d{2}\.\d{4})/,
    );

    if (!match) {
      console.error("Date range not found in the page");
      return null;
    }

    const [, startDate, endDate] = match;

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
  const startDate = new Date(details?.startDate ?? "");
  const endDate = new Date(details?.endDate ?? "");

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
  const RE =
    /^(?:https?:\/\/)?(?:www\.)?(?:pwca\.events|pwca\.org\/events)\/([^\/#?]+)(?:[\/#?].*)?$/i;
  const m = input.trim().match(RE);
  return m ? `https://pwca.events/${m[1]}` : null;
}
