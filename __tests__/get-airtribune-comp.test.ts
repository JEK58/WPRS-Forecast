import { describe, it, expect } from "bun:test";
import { getForecast } from "@/utils/get-forecast";
import { getAirtribuneComp } from "@/utils/get-airtribune-comp";

describe("Airtribune", () => {
  it("finds the correct comp date", async () => {
    const expectedStartDate = "2026-04-01T00:00:00.000Z";
    const expectedEndDate = "2026-04-06T00:00:00.000Z";

    const url = "https://airtribune.com/mtg2026";
    const res = await getAirtribuneComp(url);
    if (!res?.compDate?.startDate || !res.compDate.endDate) {
      throw new Error("Expected valid competition dates from Airtribune");
    }

    expect(res.compDate.startDate.toISOString()).toBe(expectedStartDate);
    expect(res.compDate.endDate.toISOString()).toBe(expectedEndDate);
  }, 20000);

  it("finds the correct comp date for another event", async () => {
    const expectedStartDate = "2026-07-08T00:00:00.000Z";
    const expectedEndDate = "2026-07-12T00:00:00.000Z";

    const url = "https://airtribune.com/pao2026";
    const res = await getAirtribuneComp(url);
    if (!res?.compDate?.startDate || !res.compDate.endDate) {
      throw new Error("Expected valid competition dates from Airtribune");
    }

    expect(res.compDate.startDate.toISOString()).toBe(expectedStartDate);
    expect(res.compDate.endDate.toISOString()).toBe(expectedEndDate);
  }, 20000);

  it("should forecast an upcoming comp", async () => {
    const url = "https://airtribune.com/pao2026";
    const res = await getForecast(url);

    expect(res).not.toHaveProperty("error");
  }, 20000);

  it("should find the correct amount of max pilots", async () => {
    const expectedNumberOfMaxPilots = 130;
    const url = "https://airtribune.com/mtg2026";
    const res = await getAirtribuneComp(url);

    if (!res) throw new Error("Unexpected result");
    if ("maxPilots" in res)
      expect(res.maxPilots).toBe(expectedNumberOfMaxPilots);
    else throw new Error("Unexpected result");
  }, 20000);
});
