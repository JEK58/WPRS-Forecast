import { getCivlIds, CIVL_PLACEHOLDER_ID } from "@/utils/get-civl-ids";
import { load } from "cheerio";

interface PWCApiResponse {
  subscriptions?: PilotDetails[];
  isSelectionStarted: boolean;
  subscriptionStatusesOrder?: string[];
}

type PWCApiDetails = {
  apiUrl?: string;
  scoringUrl?: string;
  scoringBaseUrl?: string;
  selectionTable?: PwcSelectionTableDetails;
  startDate: string;
  endDate: string;
  name: string;
};

type PwcSelectionTableDetails = {
  csrf: string;
  updateUri: string;
  snapshot: string;
  lazyPayload: string;
  cookie: string;
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

async function getPwcApiDetails(
  compUrl: string,
): Promise<PWCApiDetails | null> {
  try {
    // Fetch the main page and grab the iframe src
    const res = await fetch(compUrl, { cache: "no-store" });
    if (!res.ok) {
      console.error(`Failed to fetch ${compUrl}: ${res.statusText}`);
      return null;
    }

    const cookie = getCookieHeader(res);
    const $ = load(await res.text());
    const iframeSrc = $("#advanced_iframe").attr("src");
    if (!iframeSrc) return getPwcEventDetails($, cookie);

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

function getPwcEventDetails(
  $: ReturnType<typeof load>,
  cookie: string,
): PWCApiDetails | null {
  const event = $("[data-event]").first();
  const name = event.find("[data-flux-heading]").first().text().trim();
  const dateText = event.find("[data-date] span").first().text().trim();
  const dateRange = parsePwcDateRange(dateText);
  const scoringUrl = $('a[href*="scoring.pwca.org"][href$="ranking0.html"]')
    .first()
    .attr("href");
  const scoringBaseUrl =
    getScoringBaseUrl($.html() ?? "") ?? baseUrlFromScoringUrl(scoringUrl);
  const selectionTable = getPwcSelectionTableDetails($, cookie);

  if (!name || !dateRange) {
    console.error("PWC event details not found in the page");
    return null;
  }

  return { name, scoringUrl, scoringBaseUrl, selectionTable, ...dateRange };
}

// The event page links the official scoring portal (scoring.pwca.org). Once
// tasks are published, the portal reflects who actually started, while the
// pre-event selection list goes stale (no-shows, late additions).
export function getScoringBaseUrl(eventHtml: string): string | undefined {
  const matches = eventHtml.match(
    /https?:\/\/scoring\.pwca\.org\/[a-zA-Z0-9_-]+\/?/g,
  );
  if (!matches?.[0]) return;
  const base = matches[0];
  return base.endsWith("/") ? base : `${base}/`;
}

export function baseUrlFromScoringUrl(scoringUrl?: string): string | undefined {
  if (!scoringUrl || !scoringUrl.includes("scoring.pwca.org")) return;
  const base = scoringUrl.split("/").slice(0, -1).join("/") + "/";
  return base;
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

  if (!details.apiUrl && (details.selectionTable || details.scoringBaseUrl)) {
    const [selectionPilots, livePilots] = await Promise.all([
      details.selectionTable
        ? getPwcSelectionPilots(details.selectionTable)
        : Promise.resolve([]),
      details.scoringBaseUrl
        ? getPwcLivePilots(details.scoringBaseUrl)
        : Promise.resolve({ pilots: [], sourceUrl: undefined }),
    ]);
    // Once tasks are published the scoring portal is ground truth: confirmed
    // pre-event entries that never showed up (no-shows) must not inflate Pq,
    // and late additions missing from the selection table must be included.
    const pilots =
      livePilots.pilots.length > 0
        ? mergeSelectionWithLiveStarters(selectionPilots, livePilots.pilots)
        : selectionPilots;

    if (pilots.length > 0) {
      console.log("Getting CIVL IDs");
      const res = await getCivlIds(pilots.map((p) => p.name ?? ""));

      const pilotsWithCivlId = pilots.map((pilot) => {
        const name = pilot.name ?? "";
        pilot.civlID = res.civlIds.get(name) ?? CIVL_PLACEHOLDER_ID;
        return pilot;
      });

      const usingLiveList = livePilots.pilots.length > 0;
      if (usingLiveList) {
        const noShows = selectionPilots.filter(
          (p) => p.confirmed && !livePilots.pilots.some((live) => live.name === p.name),
        ).length;
        console.log(
          `[PWC live] ${livePilots.sourceUrl}: ${livePilots.pilots.length} starters, ${noShows} confirmed no-shows excluded`,
        );
      }

      return {
        compTitle,
        maxPilots: MAX_PILOTS,
        pilots: pilotsWithCivlId,
        compDate: { startDate, endDate },
        pilotsUrl: usingLiveList
          ? (livePilots.sourceUrl ?? details.scoringUrl)
          : details.selectionTable
            ? `${compUrl}#pilot-information`
            : details.scoringUrl,
        statistics: res.statistics,
      };
    }
  }

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

function getPwcSelectionTableDetails(
  $: ReturnType<typeof load>,
  cookie: string,
): PwcSelectionTableDetails | undefined {
  const csrf = $("script[data-csrf]").attr("data-csrf");
  const updateUri = $("script[data-update-uri]").attr("data-update-uri");
  const selectionTable = $("[data-selection-table]").first();
  const snapshot = selectionTable.attr("wire:snapshot");
  const lazyPayload = selectionTable
    .attr("x-intersect")
    ?.match(/__lazyLoad\('([^']+)'/)?.[1];

  if (!csrf || !updateUri || !snapshot || !lazyPayload) return;

  return { csrf, updateUri, snapshot, lazyPayload, cookie };
}

function getCookieHeader(res: Response) {
  const headers = res.headers as Headers & {
    getSetCookie?: () => string[];
  };
  const setCookies = headers.getSetCookie?.() ?? splitSetCookieHeader(headers);

  return setCookies.map((cookie) => cookie.split(";")[0]).join("; ");
}

function splitSetCookieHeader(headers: Headers) {
  const setCookie = headers.get("set-cookie");
  if (!setCookie) return [];

  return setCookie.split(/,(?=\s*[^;=]+=[^;]+)/);
}

async function getPwcSelectionPilots(details: PwcSelectionTableDetails) {
  try {
    const res = await fetch(details.updateUri, {
      method: "POST",
      cache: "no-store",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        cookie: details.cookie,
        "x-livewire": "",
      },
      body: JSON.stringify({
        _token: details.csrf,
        components: [
          {
            snapshot: details.snapshot,
            updates: {},
            calls: [
              {
                path: "",
                method: "__lazyLoad",
                params: [details.lazyPayload],
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      console.error(`Failed to fetch PWCA selection table: ${res.statusText}`);
      return [];
    }

    const data = (await res.json()) as {
      components?: Array<{ effects?: { html?: string } }>;
    };
    const html = data.components?.[0]?.effects?.html;
    if (!html) return [];

    const $ = load(html);
    const rows = $("tr");
    const headerCells = rows
      .first()
      .find("th,td")
      .map((_, cell) => normalizeSelectionCell($(cell).text()))
      .get();
    const columns = getPwcSelectionColumns(headerCells);
    const inferredStatus = getPwcSelectionInferredStatus($);

    return rows
      .slice(1)
      .map((rowIndex, row) => {
        if (
          columns.status === undefined &&
          inferredStatus &&
          rowIndex >= inferredStatus.count
        ) {
          return null;
        }

        const cells = $(row)
          .find("td")
          .map((_, cell) => normalizeSelectionCell($(cell).text()))
          .get();
        const status =
          columns.status === undefined
            ? inferredStatus?.status
            : cells[columns.status];
        const name = cells[columns.pilot]?.toLowerCase();
        const confirmed = isConfirmed(status);

        if (!name || !isRegistered(status)) return null;

        return {
          name,
          nationality: cells[columns.country],
          civlID: CIVL_PLACEHOLDER_ID,
          wing:
            columns.glider === undefined ? undefined : cells[columns.glider],
          status,
          confirmed,
        };
      })
      .get()
      .filter((pilot) => pilot !== null);
  } catch (error) {
    console.error("Error fetching or parsing PWC selection table:", error);
    return [];
  }
}

function normalizeSelectionCell(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function getPwcSelectionColumns(headers: string[]) {
  const normalizedHeaders = headers.map((header) => header.toLowerCase());
  const getIndex = (name: string, fallback: number): number | undefined => {
    const index = normalizedHeaders.indexOf(name);
    if (index >= 0) return index;
    return headers.length > fallback ? fallback : undefined;
  };

  return {
    pilot: getIndex("pilot", 1) ?? 1,
    country: getIndex("country", 2) ?? 2,
    glider: getIndex("glider", 3),
    status: getIndex("status", 6),
  };
}

function getPwcSelectionInferredStatus($: ReturnType<typeof load>) {
  const statusCounts = parsePwcSelectionStatusCounts(
    $("[data-status]").first().text(),
  );
  const registeredStatuses = Object.entries(statusCounts).filter(([status]) =>
    isRegistered(status),
  );

  if (registeredStatuses.length !== 1) return;

  const registeredStatus = registeredStatuses[0];
  if (!registeredStatus) return;

  const [status, count] = registeredStatus;
  if (!status || !count) return;

  return { status, count };
}

function parsePwcSelectionStatusCounts(statusText: string) {
  const counts: Record<string, number> = {};
  const normalizedStatusText = normalizeSelectionCell(statusText);
  const matches = normalizedStatusText.matchAll(/([A-Za-z ]+):\s*(\d+)/g);

  for (const match of matches) {
    const [, status, count] = match;
    if (!status || !count) continue;
    counts[status.trim()] = Number(count);
  }

  return counts;
}

export type LivePilot = {
  name: string;
  nationality?: string;
  civlID: number;
  wing?: string;
  status?: string;
  confirmed: boolean;
  // True when the pilot was confirmed on the pre-event selection list but is
  // missing from the scoring portal starter list (never started the comp).
  noShow?: boolean;
};

export async function getPwcLivePilots(scoringBaseUrl: string): Promise<{
  pilots: LivePilot[];
  sourceUrl?: string;
}> {
  // Prefer the dedicated starter list (pilots.html), then the cumulative
  // standings (ranking0.html), then the union of all per-task pages
  // (covers stopped/cancelled-task edge cases where a ranking page is
  // missing or a pilot only appears in some tasks).
  const candidates = [
    `${scoringBaseUrl}pilots.html`,
    `${scoringBaseUrl}ranking0.html`,
  ];
  for (const url of candidates) {
    const pilots = await getPwcScoringPilots(url);
    if (pilots.length > 0) return { pilots, sourceUrl: url };
  }

  const taskUrls = await discoverScoringTaskUrls(scoringBaseUrl);
  const seen = new Map<string, LivePilot>();
  let sourceUrl: string | undefined;
  for (const url of taskUrls) {
    const pilots = await getPwcScoringPilots(url);
    if (pilots.length > 0 && !sourceUrl) sourceUrl = url;
    for (const pilot of pilots) {
      if (!seen.has(pilot.name)) seen.set(pilot.name, pilot);
    }
  }
  return { pilots: [...seen.values()], sourceUrl };
}

// Sort task page filenames by numeric task index so task10.html comes after
// task2.html (plain lexicographic sort would order it before).
export function sortScoringTaskFiles(files: string[]): string[] {
  return [...files].sort((a, b) => {
    const numA = Number(a.match(/^task(\d+)\.html$/)?.[1] ?? 0);
    const numB = Number(b.match(/^task(\d+)\.html$/)?.[1] ?? 0);
    return numA - numB || (a < b ? -1 : a > b ? 1 : 0);
  });
}

async function discoverScoringTaskUrls(
  scoringBaseUrl: string,
): Promise<string[]> {
  try {
    const res = await fetch(scoringBaseUrl, { cache: "no-store" });
    if (!res.ok) return [`${scoringBaseUrl}task1.html`];
    const html = await res.text();
    const matches = html.matchAll(/href=["'](task\d+[a-z]*\.html)["']/gi);
    const files = sortScoringTaskFiles(
      [...new Set([...matches].map((m) => m[1]).filter((f): f is string => !!f))].filter(
        (f) => /^task\d+\.html$/.test(f),
      ),
    );
    if (files.length === 0) return [`${scoringBaseUrl}task1.html`];
    return files.map((f) => `${scoringBaseUrl}${f}`);
  } catch {
    return [`${scoringBaseUrl}task1.html`];
  }
}

type ScoringCells = {
  eq: (index: number) => {
    text: () => string;
  };
};

function isPilotRow(cells: ScoringCells): boolean {
  // Pilot rows: rank (numeric) + Id (numeric). Summary rows in ranking0.html
  // look like "Task1 | 2026-09-07 | 106.58 km | ..." and must be skipped.
  const rank = cells.eq(0).text().trim();
  const id = cells.eq(1).text().trim();
  return rank !== "" && id !== "" && Number.isInteger(Number(rank)) && Number.isInteger(Number(id));
}

function normalizeScoringName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function parseScoringPilotRow(cells: ScoringCells): LivePilot | null {
  // Scoring table layout (pilots.html, ranking0.html, taskN.html):
  // # | Id | Name | gender | Nat | Glider | ... The Nat column holds the
  // plain IOC code (ranking0.html additionally wraps it in <img> + <span>,
  // which contributes no text, so plain cell text suffices everywhere).
  // Note: nationality is informational only — the forecast's nationality and
  // gender breakdowns come from the CIVL world-ranking database, not from
  // this scraped field.
  // Names are whitespace-normalized (like the selection table) so multi-space
  // or nbsp variants still match during de-dupe and live/selection merging.
  const name = normalizeScoringName(cells.eq(2).text());
  if (!name) return null;
  const nationality = cells.eq(4).text().trim();
  const wing = cells.eq(5).text().trim() || undefined;

  return {
    name,
    nationality,
    civlID: CIVL_PLACEHOLDER_ID,
    wing,
    status: "starter",
    confirmed: true,
  };
}

async function getPwcScoringPilots(scoringUrl: string) {
  try {
    const res = await fetch(scoringUrl, { cache: "no-store" });
    if (!res.ok) {
      return [];
    }

    return parseScoringPilotsFromHtml(await res.text());
  } catch (error) {
    console.error("Error fetching or parsing PWC scoring page:", error);
    return [];
  }
}

// Pure HTML parser (no network): pilots.html has a single table;
// ranking/task pages have a metadata table first and the pilot table second —
// scan all tables and keep rows shaped like pilot rows instead of relying on
// a fixed table index.
export function parseScoringPilotsFromHtml(html: string): LivePilot[] {
  const $ = load(html);
  const tables = $("table.result");
  const pilots: LivePilot[] = [];
  tables.each((_, table) => {
    $(table)
      .find("tr.result_row")
      .each((_, row) => {
        const cells = $(row).find("td.result");
        if (cells.length < 6) return;
        // Skip header/summary rows (th cells or non-pilot content):
        // pilot rows start with numeric rank + numeric Id, while the
        // ranking0.html summary table starts with "Task1"/date cells.
        if ($(row).find("th.result").length > 0) return;
        if (!isPilotRow(cells as never)) return;
        const pilot = parseScoringPilotRow(cells as never);
        if (pilot) pilots.push(pilot);
      });
  });

  // De-dupe by name (ranking pages repeat pilots across collapsible cols)
  return [...new Map(pilots.map((p) => [p.name, p])).values()];
}

export function mergeSelectionWithLiveStarters(
  selection: LivePilot[],
  live: LivePilot[],
) {
  const liveNames = new Set(live.map((p) => p.name));
  // Starters first (all confirmed). Selection-only pilots stay in the list so
  // the "Potential WPRS" forecast and the pilot-impact toggles keep working:
  // pilots that were confirmed but never started are flagged as no-shows,
  // the rest remain registered-but-not-confirmed (waiting list, payment...).
  const selectionOnly = selection
    .filter((p) => !liveNames.has(p.name ?? ""))
    .map((p) => ({
      ...p,
      confirmed: false,
      status: p.status ?? "no-show",
      noShow: p.confirmed,
    }));
  return [...live, ...selectionOnly];
}

function isConfirmed(status?: string) {
  const normalizedStatus = normalizePwcStatus(status);

  return (
    normalizedStatus == "confirmed" ||
    normalizedStatus == "wildcard_confirmed" ||
    normalizedStatus == "guest_card_confirmed"
  );
}

function isRegistered(status?: string) {
  const normalizedStatus = normalizePwcStatus(status);

  return (
    isConfirmed(status) ||
    normalizedStatus == "payment_in_progress" ||
    normalizedStatus == "waiting_for_payment" ||
    normalizedStatus == "waiting_list"
  );
}

function normalizePwcStatus(status?: string) {
  return status?.toLowerCase().replace(/[\s-]+/g, "_");
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
