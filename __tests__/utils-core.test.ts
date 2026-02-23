import { describe, expect, it } from "bun:test";
import { isValidUrl } from "@/utils/check-valid-url";
import { evalMaxPilots } from "@/utils/eval-max-pilots";
import { normalizeName } from "@/utils/normalize-name";
import { getPosition } from "@/utils/utils";

describe("Core utility functions", () => {
  it("validates supported competition URLs", () => {
    expect(
      isValidUrl("https://airtribune.com/pre-world-cup-reunion-island-2023/info"),
    ).toBe(true);
    expect(
      isValidUrl("https://civlcomps.org/event/german-open-2023/participants"),
    ).toBe(true);
    expect(
      isValidUrl("https://pwca.events/world-cup-gourdon-france-2024/selection"),
    ).toBe(true);
    expect(
      isValidUrl(
        "https://www.swissleague.ch/comp-league/competitions/detailsx/gb4JPNipbgzOMSp2FD4Aj1",
      ),
    ).toBe(true);
  });

  it("rejects unsupported or invalid URLs", () => {
    expect(isValidUrl("http://airtribune.com/event")).toBe(false);
    expect(isValidUrl("https://example.com/event")).toBe(false);
    expect(isValidUrl("https://wprs-forecast.org/forecast")).toBe(false);
  });

  it("uses fallback max pilots when value is missing", () => {
    expect(evalMaxPilots(0)).toBe(120);
    expect(evalMaxPilots(95)).toBe(95);
  });

  it("normalizes names by removing diacritics", () => {
    expect(normalizeName("Stephan Schöpe")).toBe("Stephan Schope");
    expect(normalizeName("Dušan OROŽ")).toBe("Dusan OROZ");
  });

  it("finds nth occurrence position in a string", () => {
    expect(getPosition("https://airtribune.com/abc/def", "/", 3)).toBe(22);
    expect(getPosition("a-b-c-d", "-", 2)).toBe(3);
  });
});
