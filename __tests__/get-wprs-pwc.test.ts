import { getWprs } from "@/utils/calculate-wprs";

describe("Get WPRS for PWC comps", () => {
  it("should reject a comp that lies in the past", async () => {
    const url = "https://pwca.org/events/2023-world-cup-castelo-brazil-2023";
    const res = await getWprs(url);
    expect(res).toHaveProperty("error");
    if ("error" in res) {
      expect(res.error).toBe("PAST_EVENT");
    }
  }, 10000);
});
