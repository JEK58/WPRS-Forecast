"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Pilot = {
  id: number;
  name: string;
  rank: number;
  points: number;
  nation: string;
};

type WprsRow = {
  Ta1: number;
  Ta2: number;
  Ta3: number;
};

type Projection = {
  position: number;
  total: number;
  points?: WprsRow;
  alreadyInList: boolean;
};

const PILOT_COOKIE_NAME = "wprs_selected_pilot";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function getCookie(name: string) {
  if (typeof document === "undefined") return undefined;

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));

  if (!cookie) return undefined;
  return cookie.slice(name.length + 1);
}

function savePilotCookie(pilot: Pilot) {
  if (typeof document === "undefined") return;

  document.cookie = `${PILOT_COOKIE_NAME}=${encodeURIComponent(
    JSON.stringify(pilot),
  )}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

function clearPilotCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${PILOT_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function PilotSelfProjection({
  confirmedPilots,
  registeredPilots,
  confirmedWprs,
  registeredWprs,
}: {
  confirmedPilots?: Pilot[];
  registeredPilots?: Pilot[];
  confirmedWprs?: WprsRow[];
  registeredWprs?: WprsRow[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Pilot[]>([]);
  const [selectedPilot, setSelectedPilot] = useState<Pilot | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = getCookie(PILOT_COOKIE_NAME);
    if (raw) {
      try {
        const parsed = JSON.parse(decodeURIComponent(raw)) as Pilot;
        if (parsed?.id && parsed?.name) {
          setSelectedPilot(parsed);
        }
      } catch {
        clearPilotCookie();
      }
    }

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const q = query.trim();
    const isNumeric = /^\d+$/.test(q);

    if (!isNumeric && q.length < 2) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    setIsSearching(true);

    fetch(`/api/pilot/search?q=${encodeURIComponent(q)}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to search pilots");
        return (await res.json()) as Pilot[];
      })
      .then((data) => setResults(data))
      .catch((error: { name?: string }) => {
        if (error.name === "AbortError") return;
        setResults([]);
      })
      .finally(() => setIsSearching(false));

    return () => controller.abort();
  }, [query]);

  const confirmedProjection = useMemo(() => {
    return projectPilot(selectedPilot, confirmedPilots ?? [], confirmedWprs);
  }, [selectedPilot, confirmedPilots, confirmedWprs]);

  const registeredProjection = useMemo(() => {
    return projectPilot(selectedPilot, registeredPilots ?? [], registeredWprs);
  }, [selectedPilot, registeredPilots, registeredWprs]);

  const onSelectPilot = (pilot: Pilot) => {
    setSelectedPilot(pilot);
    setQuery("");
    setResults([]);
    savePilotCookie(pilot);
  };

  const onClearPilot = () => {
    setSelectedPilot(null);
    setQuery("");
    setResults([]);
    clearPilotCookie();
  };

  if (!confirmedWprs?.length && !registeredWprs?.length) return null;

  return (
    <div className="rounded-box mt-6 border border-slate-300 p-4">
      <h3 className="text-base font-semibold">Your Potential Ranking</h3>

      {isHydrated && !selectedPilot && (
        <div className="relative mt-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or CIVL ID"
            className="h-10 border-slate-300/55 focus-visible:border-slate-400/50 focus-visible:ring-slate-300/45 dark:border-slate-700/55 dark:focus-visible:border-slate-600/45 dark:focus-visible:ring-slate-700/45"
          />

          {!!query.trim().length && (
            <div className="absolute top-full right-0 left-0 z-20 mt-1 rounded-md border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900">
              {isSearching ? (
                <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-300">
                  Searching...
                </div>
              ) : results.length > 0 ? (
                <ul className="max-h-56 overflow-y-auto">
                  {results.map((pilot) => (
                    <li key={pilot.id}>
                      <button
                        type="button"
                        className="w-full border-b border-slate-200 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                        onClick={() => onSelectPilot(pilot)}
                      >
                        <span className="font-medium">{pilot.name}</span>{" "}
                        <span className="text-slate-500 dark:text-slate-300">
                          CIVL {pilot.id} | WR #{pilot.rank} | {pilot.points}{" "}
                          pts
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-300">
                  No matches found.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {selectedPilot && (
        <div className="mt-4 rounded-md bg-slate-100 p-3 text-sm dark:bg-slate-900">
          <div className="flex items-start justify-between gap-3">
            <div className="font-semibold">
              {selectedPilot.name} (CIVL {selectedPilot.id})
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 border-slate-300/60 text-slate-600 hover:border-green-500 hover:bg-green-500 hover:text-white dark:border-slate-700/60 dark:text-slate-300 dark:hover:border-green-500 dark:hover:bg-green-500 dark:hover:text-white"
              onClick={onClearPilot}
            >
              Clear
            </Button>
          </div>
          <div className="text-slate-500 dark:text-slate-300">
            World rank #{selectedPilot.rank} | {selectedPilot.points} pts
          </div>
        </div>
      )}

      {selectedPilot && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <ProjectionCard
            title="Against Confirmed Pilots"
            projection={confirmedProjection}
          />
          <ProjectionCard
            title="Against Registered Pilots"
            projection={registeredProjection}
          />
        </div>
      )}
    </div>
  );
}

function projectPilot(
  pilot: Pilot | null,
  participants: Pilot[],
  wprsRows?: WprsRow[],
): Projection | undefined {
  if (!pilot || !wprsRows?.length) return;

  const uniquePilots = new Map<number, Pilot>();
  participants.forEach((entry) => uniquePilots.set(entry.id, entry));

  const alreadyInList = uniquePilots.has(pilot.id);
  if (!alreadyInList) uniquePilots.set(pilot.id, pilot);

  const sorted = [...uniquePilots.values()].sort((a, b) => a.rank - b.rank);
  const position = sorted.findIndex((entry) => entry.id === pilot.id) + 1;
  if (position < 1) return;

  return {
    position,
    total: sorted.length,
    points: wprsRows[position - 1],
    alreadyInList,
  };
}

function ProjectionCard({
  title,
  projection,
}: {
  title: string;
  projection?: Projection;
}) {
  return (
    <div className="rounded-md border border-slate-200 p-3 dark:border-slate-700">
      <div className="font-medium">{title}</div>
      {projection ? (
        <>
          <div className="mt-2 text-sm">
            Projected place:{" "}
            <span className="font-semibold">#{projection.position}</span> /{" "}
            {projection.total}
          </div>
          {projection.points ? (
            <div className="mt-1 text-sm">
              Points:{" "}
              <span className="font-semibold text-green-500">
                {projection.points.Ta3}
              </span>{" "}
            </div>
          ) : (
            <div className="mt-1 text-sm text-slate-500 dark:text-slate-300">
              Outside current scoring range.
            </div>
          )}
        </>
      ) : (
        <div className="mt-2 text-sm text-slate-500 dark:text-slate-300">
          No projection available.
        </div>
      )}
    </div>
  );
}
