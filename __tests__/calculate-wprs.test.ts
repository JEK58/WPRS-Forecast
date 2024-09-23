import { describe, it, expect, beforeAll } from "bun:test";
import { calculateWPRS, type Ranking } from "@/utils/calculate-wprs";
import { db } from "@/server/db";
import { ranking } from "@/server/db/schema";
import dummyRanking from "__tests__/data/DummyRanking.json";
import { gt, lte, and } from "drizzle-orm";

beforeAll(async () => {
  console.log("Clearing ranking table and importing dummy data...");
  await db.delete(ranking); // eslint-disable-line
  await db.insert(ranking).values(dummyRanking);
  console.log("...done");
});

describe("Calculate WPRS", () => {
  it("should find the correct forecast for the 120 best pilots in the world", async () => {
    const expectedWprs = 120;
    const expectedNumOfPilots = 120;
    const expectedPq_srp = 10230;
    const expectedPq_srtp = 10230;

    // Select all pilots with rank better or equal 120
    const pilots = await db
      .select()
      .from(ranking)
      .where(lte(ranking.rank, expectedNumOfPilots));
    const res = await calculateWPRS(pilots, pilots.length);

    expect(res?.numPilots).toBe(expectedNumOfPilots);
    expect(res?.WPRS[0]?.Ta3).toBe(expectedWprs);
    expect(res?.Pq_srtp).toBe(expectedPq_srtp);
    expect(res?.Pq_srp).toBe(expectedPq_srp);
  });

  it("should find the correct forecast for the 60 best pilots in the world (devalued by avg pilots)", async () => {
    const expectedWprs = 104.4;
    const expectedNumOfPilots = 60;
    const expectedPq_srp = 5565;
    const expectedPq_srtp = 5565;

    const pilots = await db
      .select()
      .from(ranking)
      .where(lte(ranking.rank, expectedNumOfPilots));

    const res = await calculateWPRS(pilots, pilots.length);

    expect(res?.numPilots).toBe(expectedNumOfPilots);
    expect(res?.WPRS[0]?.Ta3).toBe(expectedWprs);
    expect(res?.Pq_srtp).toBe(expectedPq_srtp);
    expect(res?.Pq_srp).toBe(expectedPq_srp);
  });

  it("should find the correct forecast for the 61th to 180th best pilots in the world", async () => {
    const expectedWprs = 86.2;
    const expectedNumOfPilots = 120;
    const expectedPq_srp = 6630;
    const expectedPq_srtp = 10230;

    const pilots = await db
      .select()
      .from(ranking)
      .where(and(gt(ranking.rank, 60), lte(ranking.rank, 180)));

    const res = await calculateWPRS(pilots, pilots.length);

    expect(res?.numPilots).toBe(expectedNumOfPilots);
    expect(res?.WPRS[0]?.Ta3).toBe(expectedWprs);
    expect(res?.Pq_srtp).toBe(expectedPq_srtp);
    expect(res?.Pq_srp).toBe(expectedPq_srp);
  });
});
