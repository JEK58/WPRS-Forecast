import { getWprs } from "@/utils/calculate-wprs";

describe("Get WPRS for CIVL comps", () => {
  it("should reject a comp that lies in the past", async () => {
    const url = "https://civlcomps.org/event/german-open-2023";
    const res = await getWprs(url);

    expect(res).toBe(2);
  }, 10000);
});
