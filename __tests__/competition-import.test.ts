import { describe, expect, it } from "bun:test";

import {
  mapCompetitionImport,
  parseCompetitionPeriod,
} from "@/server/db/competition-import";

describe("competition import mapping", () => {
  it("parses the two-line competition period into ISO dates", () => {
    expect(parseCompetitionPeriod("Feb 23, 2026\nFeb 28, 2026")).toEqual({
      startDate: "2026-02-23",
      endDate: "2026-02-28",
    });
  });

  it("maps explicit source fields and keeps period unchanged", () => {
    const mapped = mapCompetitionImport({
      schema_version: 5,
      competition_id: 8552,
      source_url:
        "https://civlcomps.org/ranking/paragliding-xc/competition?rankingDate=2026-03-01&id=8552",
      competition_name: "Open Trujillo 2026 Copa Q Tanque",
      summary: {
        period: "Feb 23, 2026\nFeb 28, 2026",
        discipline: "PG XC",
        ta: 1,
        pn: 0.751,
        pq: 0.362,
        td: 0.999,
        tasks: 4,
        pq_srp: 1127.2,
        pq_srtp: 5581.9,
        number_of_pilots: 31,
        pq_rank_date: null,
        pilots_last_12_months: 11211,
        competitions_last_12_months: 163,
        days_since_end: 23,
        last_score: 0.2,
        winner_score: 26,
        results_updated: "",
      },
      competitors: [
        {
          rank: 1,
          point_factor: 1,
          points: 27.2,
          time_devaluated_points: 27.2,
          competition_score: 2482,
          pilot_name: "Alexander Popow",
          nation: "VEN",
          civl_id: 12168,
        },
        {
          rank: 2,
          point_factor: 0.956,
          points: 26.003,
          time_devaluated_points: 26,
          competition_score: 2366,
          pilot_name: "Allly Palencia",
          nation: "VEN",
          civl_id: 12161,
        },
      ],
    });

    expect(mapped.competition).toEqual({
      competitionId: 8552,
      schemaVersion: 5,
      sourceUrl:
        "https://civlcomps.org/ranking/paragliding-xc/competition?rankingDate=2026-03-01&id=8552",
      competitionName: "Open Trujillo 2026 Copa Q Tanque",
      period: "Feb 23, 2026\nFeb 28, 2026",
      startDate: "2026-02-23",
      endDate: "2026-02-28",
      discipline: "PG XC",
      ta: 1,
      pn: 0.751,
      pq: 0.362,
      td: 0.999,
      tasks: 4,
      pqSrp: 1127.2,
      pqSrtp: 5581.9,
      numberOfPilots: 31,
      pqRankDate: null,
      pilotsLast12Months: 11211,
      competitionsLast12Months: 163,
      daysSinceEnd: 23,
      lastScore: 0.2,
      winnerScore: 26,
      resultsUpdated: "",
    });

    expect(mapped.competitors).toEqual([
      {
        civlId: 12168,
        rank: 1,
        pointFactor: 1,
        points: 27.2,
        timeDevaluatedPoints: 27.2,
        competitionScore: 2482,
        pilotName: "Alexander Popow",
        nation: "VEN",
      },
      {
        civlId: 12161,
        rank: 2,
        pointFactor: 0.956,
        points: 26.003,
        timeDevaluatedPoints: 26,
        competitionScore: 2366,
        pilotName: "Allly Palencia",
        nation: "VEN",
      },
    ]);
  });
});
