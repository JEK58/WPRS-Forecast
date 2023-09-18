import { getWprs } from "@/utils/calculate-wprs";

describe("Get WPRS for Airtribune comp", () => {
  it("should reject a comp that lies in the past", async () => {
    const url = "https://airtribune.com/palz-alsace-open-2023/results";
    const res = await getWprs(url);

    expect(res).toBe(2);
  });

  it("should calculate find the correct amount of max pilots", async () => {
    const expectedNumberOfMaxPilots = 80;
    const url = "https://airtribune.com/pre-world-cup-reunion-island-2023/info";
    const res = await getWprs(url);
    if (res == 0 || res == 2) throw new Error("Unexpected result");

    expect(res.maxPilots).toBe(expectedNumberOfMaxPilots);
  });
});
