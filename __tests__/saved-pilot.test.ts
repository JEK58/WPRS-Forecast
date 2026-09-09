import { afterEach, describe, expect, it, spyOn } from "bun:test";
import { encodeSavedPilot, restoreSavedPilot } from "@/utils/saved-pilot";

const oldPilot = {
  id: 12345,
  name: "Test Pilot",
  rank: 100,
  points: 150,
  nation: "GBR",
};
const currentPilot = { ...oldPilot, rank: 80, points: 175 };
const signal = new AbortController().signal;
let fetchSpy: ReturnType<typeof spyOn<typeof globalThis, "fetch">>;

afterEach(() => fetchSpy?.mockRestore());

describe("saved pilot ranking", () => {
  it("saves only the CIVL ID, excluding the ranking snapshot", () => {
    expect(JSON.parse(decodeURIComponent(encodeSavedPilot(oldPilot)))).toEqual({
      id: oldPilot.id,
    });
  });

  it("restores an old full-record cookie using the current ranking", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json([currentPilot]),
    );
    const legacyCookie = encodeURIComponent(JSON.stringify(oldPilot));

    expect(await restoreSavedPilot(legacyCookie, signal)).toEqual(currentPilot);
    expect(fetchSpy).toHaveBeenCalledWith("/api/pilot/search?q=12345", {
      signal,
      cache: "no-store",
    });
  });

  it("picks up the next monthly ranking with the same saved ID", async () => {
    const cookie = encodeSavedPilot(oldPilot);
    fetchSpy = spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json([oldPilot]))
      .mockResolvedValueOnce(Response.json([currentPilot]));

    expect(await restoreSavedPilot(cookie, signal)).toEqual(oldPilot);
    expect(await restoreSavedPilot(cookie, signal)).toEqual(currentPilot);
  });

  it("matches the exact CIVL ID even if search returns other pilots first", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json([{ ...currentPilot, id: 999 }, currentPilot]),
    );
    expect(await restoreSavedPilot(encodeSavedPilot(oldPilot), signal)).toEqual(
      currentPilot,
    );
  });

  it("returns no pilot when the saved ID is no longer ranked", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(Response.json([]));
    expect(
      await restoreSavedPilot(encodeSavedPilot(oldPilot), signal),
    ).toBeNull();
  });

  it("rejects invalid cookies without requesting a ranking", async () => {
    fetchSpy = spyOn(globalThis, "fetch");
    for (const raw of [
      "%",
      "invalid",
      "null",
      "{}",
      '{"id":-1}',
      '{"id":"12345"}',
    ]) {
      expect(await restoreSavedPilot(raw, signal)).toBeNull();
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("reports lookup failures instead of falling back to stale ranking data", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 503 }),
    );
    await expect(
      restoreSavedPilot(encodeURIComponent(JSON.stringify(oldPilot)), signal),
    ).rejects.toThrow("Failed to load saved pilot");
  });
});
