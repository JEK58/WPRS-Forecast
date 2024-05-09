import { describe, it, expect } from "bun:test";
import { scrapeRecentCivlComps } from "../src/utils/update-recent-comps";

describe("Scrape recent comps from CIVL website", () => {
  it("should find the recent comps in the world ranking", async () => {
    const comps = await scrapeRecentCivlComps();
    expect(comps.length).toBeGreaterThan(100);
    expect(comps[0]?.pilots).toBeGreaterThan(30);
    expect(comps[0]?.winnerScore).toBeGreaterThan(10);
  });
});
