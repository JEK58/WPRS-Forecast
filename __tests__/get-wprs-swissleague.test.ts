import { describe, it, expect } from "bun:test";
import { getForecast } from "@/utils/get-forecast";

describe("Get WPRS for Swissleague comps", () => {
  it("should reject a comp that lies in the past", async () => {
    const url =
      "https://www.swissleague.ch/comp-league/competitions/detailsx/gb4JPNipbgzOMSp2FD4Aj1";
    const res = await getForecast(url);

    expect(res).toHaveProperty("error");
    if ("error" in res) {
      expect(res.error).toBe("PAST_EVENT");
    }
  }, 20000);
});
