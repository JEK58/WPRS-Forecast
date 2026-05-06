import { describe, it, expect } from "bun:test";
import { getForecast } from "@/utils/get-forecast";
import { getCivlcompsComp } from "@/utils/get-civl-comp";

describe("Get data for CIVL comps", () => {
  it("should find the correct amount of registered pilots", async () => {
    const expectedNumOfPilots = 193;

    const url = "https://civlcomps.org/event/german-open-2026/participants";
    const res = await getCivlcompsComp(url);
    expect(res).toBeDefined();
    if (!res) throw new Error("Expected CIVL competition response");

    expect(res.pilots.length).toBe(expectedNumOfPilots);
  }, 30000);

  it("should forecast an upcoming comp", async () => {
    const url = "https://civlcomps.org/event/german-open-2026";
    const res = await getForecast(url);

    expect(res).not.toHaveProperty("error");
  }, 20000);
});
