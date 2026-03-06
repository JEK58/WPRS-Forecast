import { describe, expect, it } from "bun:test";
import {
  buildPrefixSums,
  computeImpactContributions,
} from "@/utils/simulation-impact";

function buildWorldPoints(count: number) {
  return Array.from({ length: count }, (_, index) => count - index);
}

describe("simulation impact core", () => {
  it("keeps contribution at zero for pilots outside the current top half", () => {
    const allPilots = Array.from({ length: 81 }, (_, index) => ({
      key: `pilot-${index}`,
      civlId: index + 1,
    }));
    const worldPoints = buildWorldPoints(200);
    const rankedByCivlId = new Map(
      worldPoints.map((points, index) => [index + 1, { points }]),
    );
    const topWorldPrefixSums = buildPrefixSums(worldPoints);
    const selectedPilotKeys = allPilots.map((pilot) => pilot.key);

    const impacts = computeImpactContributions({
      allPilots,
      selectedPilotKeys,
      rankedByCivlId,
      topWorldPrefixSums,
    });

    expect((impacts["pilot-39"] ?? 0) > 0).toBe(true);
    expect(impacts["pilot-40"]).toBe(0);
    expect(impacts["pilot-60"]).toBe(0);
  });

  it("does not create lower-half contribution after deselecting a zero-contribution pilot", () => {
    const allPilots = Array.from({ length: 81 }, (_, index) => ({
      key: `pilot-${index}`,
      civlId: index + 1,
    }));
    const worldPoints = buildWorldPoints(200);
    const rankedByCivlId = new Map(
      worldPoints.map((points, index) => [index + 1, { points }]),
    );
    const topWorldPrefixSums = buildPrefixSums(worldPoints);

    const selectedPilotKeys = allPilots.map((pilot) => pilot.key);
    const impactsWithAll = computeImpactContributions({
      allPilots,
      selectedPilotKeys,
      rankedByCivlId,
      topWorldPrefixSums,
    });

    const impactsWithoutTail = computeImpactContributions({
      allPilots,
      selectedPilotKeys: selectedPilotKeys.filter((key) => key !== "pilot-80"),
      rankedByCivlId,
      topWorldPrefixSums,
    });

    expect(impactsWithAll["pilot-60"]).toBe(0);
    expect(impactsWithoutTail["pilot-60"]).toBe(0);
  });

  it("never returns negative displayed impact", () => {
    const allPilots = Array.from({ length: 90 }, (_, index) => ({
      key: `pilot-${index}`,
      civlId: index % 3 === 0 ? undefined : index + 1,
    }));
    const worldPoints = buildWorldPoints(200);
    const rankedByCivlId = new Map(
      worldPoints.map((points, index) => [index + 1, { points }]),
    );
    const topWorldPrefixSums = buildPrefixSums(worldPoints);
    const selectedPilotKeys = allPilots.map((pilot) => pilot.key);

    const impacts = computeImpactContributions({
      allPilots,
      selectedPilotKeys,
      rankedByCivlId,
      topWorldPrefixSums,
    });

    expect(Object.values(impacts).every((value) => value >= 0)).toBe(true);
  });

  it("returns positive would-add only for unselected pilots who can enter top half", () => {
    const allPilots = Array.from({ length: 90 }, (_, index) => ({
      key: `pilot-${index}`,
      civlId: index + 1,
    }));
    const worldPoints = buildWorldPoints(300);
    const rankedByCivlId = new Map(
      worldPoints.map((points, index) => [index + 1, { points }]),
    );
    const topWorldPrefixSums = buildPrefixSums(worldPoints);
    const selectedPilotKeys = allPilots.slice(5, 85).map((pilot) => pilot.key);

    const impacts = computeImpactContributions({
      allPilots,
      selectedPilotKeys,
      rankedByCivlId,
      topWorldPrefixSums,
    });

    expect((impacts["pilot-0"] ?? 0) > 0).toBe(true);
    expect(impacts["pilot-89"]).toBe(0);
  });

  it("keeps would-add and selected impact aligned for the same pilot", () => {
    const allPilots = Array.from({ length: 110 }, (_, index) => ({
      key: `pilot-${index}`,
      civlId: index + 1,
    }));
    const worldPoints = buildWorldPoints(300);
    const rankedByCivlId = new Map(
      worldPoints.map((points, index) => [index + 1, { points }]),
    );
    const topWorldPrefixSums = buildPrefixSums(worldPoints);
    const selectedPilotKeys = allPilots.slice(20, 80).map((pilot) => pilot.key);
    const pilotKey = "pilot-0";

    const beforeAdd = computeImpactContributions({
      allPilots,
      selectedPilotKeys,
      rankedByCivlId,
      topWorldPrefixSums,
    });

    const afterAdd = computeImpactContributions({
      allPilots,
      selectedPilotKeys: [...selectedPilotKeys, pilotKey],
      rankedByCivlId,
      topWorldPrefixSums,
    });

    expect((beforeAdd[pilotKey] ?? 0) > 0).toBe(true);
    expect(afterAdd[pilotKey]).toBeCloseTo(beforeAdd[pilotKey] ?? 0, 12);
  });
});
