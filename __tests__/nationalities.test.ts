import { describe, expect, it } from "bun:test";
import { calculateNationalities } from "@/utils/get-forecast";
import { type Ranking } from "@/utils/calculate-wprs";

function ranking(name: string, nation: string, id: number): Ranking {
  return {
    id,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    name,
    normalizedName: name,
    gender: "M",
    points: 1,
    rank: id,
    nation,
    date: "2026-01-01T00:00:00.000Z",
  };
}

describe("calculateNationalities", () => {
  it("groups counts and alphabetized pilot names by nationality", () => {
    const result = calculateNationalities([
      ranking("Zoey Pilot", "GER", 1),
      ranking("Anna Pilot", "GER", 2),
      ranking("Bruno Pilot", "FRA", 3),
    ]);

    expect(result?.count).toEqual({ GER: 2, FRA: 1 });
    expect(result?.pilotNames).toEqual({
      GER: ["Anna Pilot", "Zoey Pilot"],
      FRA: ["Bruno Pilot"],
    });
  });

  it("omits pilots without a nationality", () => {
    const result = calculateNationalities([
      ranking("Known Pilot", "SUI", 1),
      ranking("Unknown Pilot", "", 2),
    ]);

    expect(result?.count).toEqual({ SUI: 1 });
    expect(result?.pilotNames).toEqual({ SUI: ["Known Pilot"] });
  });

  it("reflects the pilots in the current selection", () => {
    const pilots = [
      ranking("Selected Pilot", "ITA", 1),
      ranking("Removed Pilot", "ITA", 2),
    ];

    const allSelected = calculateNationalities(pilots);
    const oneSelected = calculateNationalities([pilots[0]!]);

    expect(allSelected?.pilotNames.ITA).toEqual([
      "Removed Pilot",
      "Selected Pilot",
    ]);
    expect(oneSelected?.count.ITA).toBe(1);
    expect(oneSelected?.pilotNames.ITA).toEqual(["Selected Pilot"]);
  });
});
