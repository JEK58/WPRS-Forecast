import { calculateWPRS } from "@/utils/calculate-wprs";

// Use test database url with dummy data only for this test
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

describe("Calculate WPRS", () => {
  const timeout = 200000;
  it(
    "should find the correct forecast for the 120 best pilots in the world",
    async () => {
      const expectedWprs = 120;
      const expectedNumOfPilots = 120;
      const expectedPq_srp = 10230;
      const expectedPq_srtp = 10230;

      const pilots = generatePilotsList(expectedNumOfPilots);
      const res = await calculateWPRS(pilots);

      expect(res?.WPRS[0]?.Ta3).toBe(expectedWprs);
      expect(res?.Pq_srtp).toBe(expectedPq_srtp);
      expect(res?.Pq_srp).toBe(expectedPq_srp);
    },
    timeout,
  );

  it(
    "should find the correct forecast for the 60 best pilots in the world (devalued by avg pilots)",
    async () => {
      const expectedWprs = 88.9;
      const expectedNumOfPilots = 60;
      const expectedPq_srp = 5565;
      const expectedPq_srtp = 5565;

      const pilots = generatePilotsList(expectedNumOfPilots);
      const res = await calculateWPRS(pilots);

      expect(res?.WPRS[0]?.Ta3).toBe(expectedWprs);
      expect(res?.Pq_srtp).toBe(expectedPq_srtp);
      expect(res?.Pq_srp).toBe(expectedPq_srp);
    },
    timeout,
  );

  it(
    "should find the correct forecast for the 61th to 120th best pilots in the world",
    async () => {
      const expectedWprs = 86.2;
      const expectedNumOfPilots = 120;
      const expectedPq_srp = 6630;
      const expectedPq_srtp = 10230;

      const pilots = generatePilotsList(expectedNumOfPilots, 60);
      const res = await calculateWPRS(pilots);

      expect(res?.WPRS[0]?.Ta3).toBe(expectedWprs);
      expect(res?.Pq_srtp).toBe(expectedPq_srtp);
      expect(res?.Pq_srp).toBe(expectedPq_srp);
    },
    timeout,
  );
});

function generatePilotsList(numOfPilots: number, offset = 0) {
  const pilots = [];
  for (let i = 1; i <= numOfPilots; i++) {
    pilots.push({ civlID: i + offset });
  }
  return pilots;
}
