import { getForecast } from "@/utils/get-forecast";
import { getAirtribuneComp } from "@/utils/get-airtribune-comp";

describe("Get WPRS for Airtribune comp", () => {
  it("should reject a comp that lies in the past", async () => {
    const url = "https://airtribune.com/palz-alsace-open-2023/results";
    const res = await getForecast(url);

    expect(res).toHaveProperty("error");
    if ("error" in res) {
      expect(res.error).toBe("PAST_EVENT");
    }
  });

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
