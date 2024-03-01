import { describe, it, expect } from "bun:test";
import { getForecast } from "@/utils/get-forecast";
import { getCivlcompsComp } from "@/utils/get-civl-comp";

describe("Get data for CIVL comps", () => {
  it("should find the correct amount of registered pilots", async () => {
    const expectedNumOfPilots = 295;

    const url = "https://civlcomps.org/event/german-open-2023/participants";
    const res = await getCivlcompsComp(url);

    expect(res?.pilots.length).toBe(expectedNumOfPilots);
  }, 30000);

  it("should reject a comp that lies in the past", async () => {
    const url = "https://civlcomps.org/event/german-open-2023";
    const res = await getForecast(url);

    expect(res).toHaveProperty("error");
    if ("error" in res) {
      expect(res.error).toBe("PAST_EVENT");
    }
  }, 20000);
});
