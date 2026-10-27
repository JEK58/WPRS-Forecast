import { describe, expect, it } from "bun:test";
import {
  getCompetitionDateError,
  getCompetitionMonthStart,
  isValidCompetitionDateRange,
} from "@/utils/competition-dates";

const now = new Date("2026-10-27T12:00:00.000Z");

describe("competition date eligibility", () => {
  it("rejects missing dates after a failed date extraction", () => {
    expect(getCompetitionDateError(undefined, now)).toBe(
      "COMPETITION_DATES_UNAVAILABLE",
    );
    expect(getCompetitionDateError({}, now)).toBe(
      "COMPETITION_DATES_UNAVAILABLE",
    );
    expect(
      getCompetitionDateError({ startDate: new Date("2027-01-01") }, now),
    ).toBe("COMPETITION_DATES_UNAVAILABLE");
  });

  it("rejects invalid, partial and reversed date ranges", () => {
    expect(
      isValidCompetitionDateRange({
        startDate: new Date("invalid"),
        endDate: new Date("2027-01-01"),
      }),
    ).toBe(false);
    expect(
      isValidCompetitionDateRange({ endDate: new Date("2027-01-01") }),
    ).toBe(false);
    expect(
      getCompetitionDateError(
        {
          startDate: new Date("2027-01-10"),
          endDate: new Date("2027-01-01"),
        },
        now,
      ),
    ).toBe("COMPETITION_DATES_UNAVAILABLE");
  });

  it("rejects old competitions even when requested today", () => {
    for (const year of [2015, 2021, 2023, 2025]) {
      expect(
        getCompetitionDateError(
          {
            startDate: new Date(`${year}-06-01`),
            endDate: new Date(`${year}-06-07`),
          },
          now,
        ),
      ).toBe("PAST_EVENT");
    }
  });

  it("preserves the current-month cutoff and accepts upcoming events", () => {
    for (const date of ["2026-10-01", "2026-10-27", "2027-01-01"]) {
      expect(
        getCompetitionDateError(
          { startDate: new Date(date), endDate: new Date(date) },
          now,
        ),
      ).toBeUndefined();
    }
    expect(
      getCompetitionDateError(
        {
          startDate: new Date("2026-09-28"),
          endDate: new Date("2026-09-30T23:59:59.999Z"),
        },
        now,
      ),
    ).toBe("PAST_EVENT");
  });

  it("uses UTC month boundaries across time zones and year changes", () => {
    expect(
      getCompetitionMonthStart(new Date("2027-01-01T00:30:00+01:00")),
    ).toEqual(new Date("2026-12-01T00:00:00.000Z"));
    expect(getCompetitionMonthStart(now)).toEqual(
      new Date("2026-10-01T00:00:00.000Z"),
    );
  });
});
