import { getWprs } from "@/utils/calculate-wprs";
import { getCivlcompsComp } from "@/utils/get-civl-comp";

describe("Get WPRS for CIVL comps", () => {
  it("should find the correct amount of registered pilots", async () => {
    const expectedNumOfPilots = 291;
    const startTime = performance.now();
    console.log("⏱️ ~ ", "Timer started");

    const url = "https://civlcomps.org/event/german-open-2023/participants";
    const res = await getCivlcompsComp(url);

    const endTime = performance.now();
    const elapsedTime = endTime - startTime;
    console.log("⏱️ ~ ", (elapsedTime / 1000).toFixed(2), "seconds");

    expect(res.pilots.length).toBe(expectedNumOfPilots);
  }, 30000);
  it("should reject a comp that lies in the past", async () => {
    const url = "https://civlcomps.org/event/german-open-2023";
    const res = await getWprs(url);

    expect(res).toHaveProperty("error");
    if ("error" in res) {
      expect(res.error).toBe("PAST_EVENT");
    }
  }, 20000);
});
