import { describe, expect, it } from "bun:test";
import {
  baseUrlFromScoringUrl,
  getScoringBaseUrl,
  mergeSelectionWithLiveStarters,
  parseScoringPilotsFromHtml,
  type LivePilot,
} from "@/utils/get-pwc-comp";

// Fixtures modeled on the real scoring.pwca.org markup: pilots.html uses a
// single table with plain-text nationality cells, ranking0.html has a task
// summary table first and <img> + <span> nationality cells second.
const PILOTS_HTML = `
<table class="result">
  <thead><tr class="result_row">
    <th class="result">#</th><th class="result">Id</th><th class="result">Name</th>
    <th class="result"></th><th class="result">Nat</th><th class="result">Glider</th>
  </tr></thead>
  <tr class="result_row">
    <td class="result" align="right">1</td><td class="result">901</td>
    <td class="result">Adem Berk Aksoy</td><td class="result">M</td>
    <td class="result">TUR</td><td class="result">Ozone Enzo 3</td>
  </tr>
  <tr class="result_row">
    <td class="result" align="right">2</td><td class="result">321</td>
    <td class="result">Adrian Orlowski</td><td class="result">M</td>
    <td class="result">POL</td><td class="result">Ozone Enzo 3</td>
  </tr>
</table>`;

const RANKING_HTML = `
<table class="result">
  <thead><tr class="result_row">
    <th class="result">Task</th><th class="result">Date</th><th class="result">Distance</th>
    <th class="result">Status</th><th class="result">FTV Validity</th><th class="result">Description</th>
  </tr></thead>
  <tr class="result_row">
    <td class="result">Task1</td><td class="result">2026-09-07</td>
    <td class="result" align="right"><span>106.58</span> km</td>
    <td class="result">OFFICIAL</td><td class="result" align="right"><span>100.0%</span></td>
    <td class="result">Race to Goal with 1 startgate</td>
  </tr>
</table>
<table class="result">
  <thead><tr class="result_row">
    <th class="result">#</th><th class="result">Id</th><th class="result">Name</th>
    <th class="result"></th><th class="result">Nationality</th><th class="result">Glider</th>
  </tr></thead>
  <tr class="result_row">
    <td class="result" align="right">1</td><td class="result">39</td>
    <td class="result">Stanislav Klikar</td><td class="result">M</td>
    <td class="result"><img src="/flag/cz.svg" alt="Flag" height="16"><span>CZE</span></td>
    <td class="result">Sky Harpy</td>
  </tr>
</table>`;

function selectionPilot(
  overrides: Partial<LivePilot> & { name: string },
): LivePilot {
  return {
    nationality: "SUI",
    civlID: 99999,
    confirmed: true,
    status: "Confirmed",
    ...overrides,
  };
}

describe("PWC scoring portal parsing", () => {
  it("parses the pilots.html starter list with plain-text nationalities", () => {
    const pilots = parseScoringPilotsFromHtml(PILOTS_HTML);

    expect(pilots.length).toBe(2);
    expect(pilots[0]?.name).toBe("adem berk aksoy");
    expect(pilots[0]?.nationality).toBe("TUR");
    expect(pilots.every((p) => p.confirmed)).toBe(true);
  });

  it("skips the ranking0 summary table and reads img+span nationalities", () => {
    const pilots = parseScoringPilotsFromHtml(RANKING_HTML);

    expect(pilots.length).toBe(1);
    expect(pilots[0]?.name).toBe("stanislav klikar");
    expect(pilots[0]?.nationality).toBe("CZE");
  });

  it("resolves the scoring base URL from the event page", () => {
    expect(
      getScoringBaseUrl(
        '<a href="https://scoring.pwca.org/sopot-2026/ranking0.html">Scoring</a>',
      ),
    ).toBe("https://scoring.pwca.org/sopot-2026/");
    expect(getScoringBaseUrl("<p>No scoring link here</p>")).toBeUndefined();
    expect(
      baseUrlFromScoringUrl("https://scoring.pwca.org/sopot-2026/ranking0.html"),
    ).toBe("https://scoring.pwca.org/sopot-2026/");
    expect(baseUrlFromScoringUrl(undefined)).toBeUndefined();
  });
});

describe("mergeSelectionWithLiveStarters", () => {
  const live = parseScoringPilotsFromHtml(PILOTS_HTML);

  it("puts starters first and flags confirmed no-shows separately", () => {
    const selection = [
      selectionPilot({ name: "adem berk aksoy" }),
      selectionPilot({ name: "missing pilot" }),
      selectionPilot({
        name: "waiting pilot",
        confirmed: false,
        status: "Waiting List",
      }),
    ];

    const merged = mergeSelectionWithLiveStarters(selection, live);
    const byName = new Map(merged.map((p) => [p.name, p]));

    expect(merged.slice(0, 2).every((p) => p.confirmed)).toBe(true);

    const noShow = byName.get("missing pilot");
    expect(noShow?.confirmed).toBe(false);
    expect(noShow?.noShow).toBe(true);

    const waiting = byName.get("waiting pilot");
    expect(waiting?.confirmed).toBe(false);
    expect(waiting?.noShow ?? false).toBe(false);
    expect(waiting?.status).toBe("Waiting List");
  });
});
