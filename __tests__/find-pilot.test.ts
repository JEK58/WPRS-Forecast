import { getCivlIds } from "@/utils/get-civl-ids";
import { pilots } from "./data/pwcPilots";

const DISABLE_ALGOLIA = true;

describe("Lookup pilots by name", () => {
  it("should find CIVL IDs for all pilots by name", async () => {
    const expectedNumberOfIds = pilots.length;
    const maxPercentageNotFound = 5;

    const res = await getCivlIds(
      pilots.flatMap((p) => p.name),
      DISABLE_ALGOLIA,
    );

    expect(res.civlIds.size).toBe(expectedNumberOfIds);
    expect(res.statistics.percentageNotFound).toBeLessThan(
      maxPercentageNotFound,
    );
  });

  it("should find pilot with exact name", async () => {
    const name = "Stephan Schöpe";
    const expectedPilotCivl = 39705;

    const res = await getCivlIds([name], DISABLE_ALGOLIA);

    expect(res?.civlIds.get(name.toLowerCase())).toBe(expectedPilotCivl);
  });

  it("should find pilot with exact name", async () => {
    const name = "Anatolii Mykhailiyuta";
    const expectedPilotCivl = 17523;
    const res = await getCivlIds([name], DISABLE_ALGOLIA);

    expect(res?.civlIds.get(name.toLowerCase())).toBe(expectedPilotCivl);
  });

  it("should find pilot without umlauts", async () => {
    const name = "Stephan Schoepe";
    const expectedPilotCivl = 39705;
    const res = await getCivlIds([name]);

    expect(res?.civlIds.get(name.toLowerCase())).toBe(expectedPilotCivl);
  });

  it("should find pilot without reverse name", async () => {
    const name = "Schöpe Stephan";
    const expectedPilotCivl = 39705;
    const res = await getCivlIds([name], DISABLE_ALGOLIA);

    expect(res?.civlIds.get(name.toLowerCase())).toBe(expectedPilotCivl);
  });

  it("should find pilot with typos", async () => {
    const name = "Stepfan Schöpes";
    const expectedPilotCivl = 39705;
    const res = await getCivlIds([name], DISABLE_ALGOLIA);

    expect(res?.civlIds.get(name.toLowerCase())).toBe(expectedPilotCivl);
  });

  it("should find pilot with diacritics", async () => {
    const name = "Dušan OROŽ";
    const expectedPilotCivl = 12672;
    const res = await getCivlIds([name], DISABLE_ALGOLIA);

    expect(res?.civlIds.get(name.toLowerCase())).toBe(expectedPilotCivl);
  });
});
