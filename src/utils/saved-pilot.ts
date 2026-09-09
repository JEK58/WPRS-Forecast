export type RankedPilot = {
  id: number;
  name: string;
  rank: number;
  points: number;
  nation: string;
};

export function encodeSavedPilot(pilot: Pick<RankedPilot, "id">) {
  return encodeURIComponent(JSON.stringify({ id: pilot.id }));
}

export async function restoreSavedPilot(
  raw: string,
  signal: AbortSignal,
): Promise<RankedPilot | null> {
  let id: number;
  try {
    // Older cookies include rank and points. Only their stable CIVL ID is used.
    const saved = JSON.parse(decodeURIComponent(raw)) as {
      id?: unknown;
    } | null;
    if (
      typeof saved?.id !== "number" ||
      !Number.isSafeInteger(saved.id) ||
      saved.id <= 0
    ) {
      return null;
    }
    id = saved.id;
  } catch {
    return null;
  }

  const response = await fetch(`/api/pilot/search?q=${id}`, {
    signal,
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to load saved pilot");

  const pilots = (await response.json()) as RankedPilot[];
  return pilots.find((pilot) => pilot.id === id) ?? null;
}
