import { getWprs } from "@/utils/calculate-wprs";
import { it, expect, describe } from "vitest";

describe("Get WPRS for CIVL comps", () => {
  it("should reject a comp that lies in the past", async () => {
    const url = "https://civlcomps.org/event/german-open-2023";
    const res = await getWprs(url);

    expect(res).toHaveProperty("error");
    if ("error" in res) {
      expect(res.error).toBe("PAST_EVENT");
    }
  }, 10000);
});
