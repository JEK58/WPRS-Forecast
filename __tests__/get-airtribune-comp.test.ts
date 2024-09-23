import { describe, it, expect } from "bun:test";
import { getForecast } from "@/utils/get-forecast";
import { getAirtribuneComp } from "@/utils/get-airtribune-comp";

describe("Airtribune", () => {
  it("finds the correct comp date", async () => {
    const expectedStartDate = "2023-10-15T00:00:00.000Z";
    const expectedEndDate = "2023-10-21T00:00:00.000Z";

    const url = "https://airtribune.com/pre-world-cup-reunion-island-2023/info";
    const res = await getAirtribuneComp(url);

    expect(res?.compDate?.startDate?.toISOString()).toBe(expectedStartDate);
    expect(res?.compDate?.endDate?.toISOString()).toBe(expectedEndDate);
  });

  it("finds the correct comp date for comp dates spanning over two different months", async () => {
    const expectedStartDate = "2023-08-26T00:00:00.000Z";
    const expectedEndDate = "2023-09-02T00:00:00.000Z";

    const url = "https://airtribune.com/tennessee-paragliding-open-2023/";
    const res = await getAirtribuneComp(url);

    expect(res?.compDate?.startDate?.toISOString()).toBe(expectedStartDate);
    expect(res?.compDate?.endDate?.toISOString()).toBe(expectedEndDate);
  });

  it("should reject a comp that lies in the past", async () => {
    const url = "https://airtribune.com/palz-alsace-open-2023/results";
    const res = await getForecast(url);

    expect(res).toHaveProperty("error");
    if ("error" in res) {
      expect(res.error).toBe("PAST_EVENT");
    }
  }, 20000);

  it("should find the correct amount of max pilots", async () => {
    const expectedNumberOfMaxPilots = 80;
    const url = "https://airtribune.com/pre-world-cup-reunion-island-2023/info";
    const res = await getAirtribuneComp(url);

    if (!res) throw new Error("Unexpected result");
    if ("maxPilots" in res)
      expect(res.maxPilots).toBe(expectedNumberOfMaxPilots);
    else throw new Error("Unexpected result");
  });
});
