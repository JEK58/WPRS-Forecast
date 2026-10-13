import { afterEach, describe, it, expect, setSystemTime } from "bun:test";
import { getForecast } from "@/utils/get-forecast";
import { getCivlcompsComp } from "@/utils/get-civl-comp";

afterEach(() => {
  setSystemTime();
});

describe("Get data for CIVL comps", () => {
  it("should parse registered pilots from the participants page", async () => {
    const url = "https://civlcomps.org/event/german-open-2026/participants";
    const res = await getCivlcompsComp(url);
    expect(res).toBeDefined();
    if (!res) throw new Error("Expected CIVL competition response");

    expect(res.pilots.length).toBeGreaterThanOrEqual(190);
    expect(
      res.pilots.every(
        (pilot) => pilot.name !== undefined && pilot.name.length > 0,
      ),
    ).toBe(true);
    expect(
      res.pilots.every(
        (pilot) => pilot.status !== undefined && pilot.status.length > 0,
      ),
    ).toBe(true);
  }, 30000);

  it("should forecast an upcoming comp", async () => {
    // Keep the 2026 fixture upcoming regardless of when the suite runs.
    setSystemTime(new Date("2026-01-01T12:00:00.000Z"));
    const url = "https://civlcomps.org/event/german-open-2026";
    const res = await getForecast(url);

    expect(res).not.toHaveProperty("error");
  }, 20000);
});
