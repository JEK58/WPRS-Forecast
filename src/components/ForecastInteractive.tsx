"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  type Forecast,
  type ForecastSimulation,
  type PositionForecastRequestContext,
  type Pilot,
} from "@/types/common";
import { Button } from "@/components/ui/Button";
import { ForecastDetails } from "@/components/ForecastDetails";
import { ListRankings } from "@/components/ForecastListRankings";
import { Nationalities } from "./ForecastNationalities";
import { LevelChart } from "./ForecastLevelChart";
import { Genders } from "./ForecastGenders";
import { PilotSelfProjection } from "./PilotSelfProjection";

type RankedPilot = NonNullable<
  NonNullable<Forecast["confirmed"]>["pilots"]
>[number];
type PilotEntry = {
  key: string;
  index: number;
  pilot: Pilot;
  isConfirmed: boolean;
  ranking?: RankedPilot;
};

function toIsoDateString(value?: Date | string) {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function comparePilotEntries(a: PilotEntry, b: PilotEntry) {
  const rankA = a.ranking?.rank ?? Number.POSITIVE_INFINITY;
  const rankB = b.ranking?.rank ?? Number.POSITIVE_INFINITY;
  if (rankA !== rankB) return rankA - rankB;
  const nameA = (a.pilot.name ?? "").toLowerCase();
  const nameB = (b.pilot.name ?? "").toLowerCase();
  if (nameA < nameB) return -1;
  if (nameA > nameB) return 1;
  return 0;
}

export function ForecastInteractive({ data }: { data: Forecast }) {
  const registeredPilots = useMemo(
    () => data.registeredPilots ?? data.confirmedPilots ?? [],
    [data.confirmedPilots, data.registeredPilots],
  );

  const [isRecalculating, setIsRecalculating] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [hasSimulationResponse, setHasSimulationResponse] = useState(false);
  const [isPilotImpactOpen, setIsPilotImpactOpen] = useState(false);
  const simulationRequestIdRef = useRef(0);
  const [simulation, setSimulation] = useState<ForecastSimulation>({
    confirmed: data.confirmed,
    nationalities: data.nationalities,
    genders: data.genders,
  });

  const rankedPilotByCivlId = useMemo(() => {
    const pilots = data.all?.pilots ?? data.confirmed?.pilots ?? [];
    return pilots.reduce((acc, pilot) => {
      acc.set(pilot.id, pilot);
      return acc;
    }, new Map<number, RankedPilot>());
  }, [data.all?.pilots, data.confirmed?.pilots]);

  const allPilotEntries = useMemo(() => {
    return registeredPilots.map((pilot, index) => {
      const ranking =
        typeof pilot.civlID === "number"
          ? rankedPilotByCivlId.get(pilot.civlID)
          : undefined;

      return {
        key: `pilot-${index}`,
        index,
        pilot,
        isConfirmed: Boolean(pilot.confirmed),
        ranking,
      } satisfies PilotEntry;
    });
  }, [rankedPilotByCivlId, registeredPilots]);

  const confirmedEntries = useMemo(
    () =>
      allPilotEntries
        .filter((entry) => entry.isConfirmed)
        .sort(comparePilotEntries),
    [allPilotEntries],
  );

  const unconfirmedEntries = useMemo(
    () =>
      allPilotEntries
        .filter((entry) => !entry.isConfirmed)
        .sort(comparePilotEntries),
    [allPilotEntries],
  );

  const defaultSelectedPilotKeys = useMemo(
    () => confirmedEntries.map((entry) => entry.key),
    [confirmedEntries],
  );

  const [selectedPilotKeys, setSelectedPilotKeys] = useState<string[]>(
    defaultSelectedPilotKeys,
  );

  const selectedPilotSet = useMemo(
    () => new Set(selectedPilotKeys),
    [selectedPilotKeys],
  );

  const selectedPilots = useMemo(
    () =>
      allPilotEntries
        .filter((entry) => selectedPilotSet.has(entry.key))
        .map((entry) => entry.pilot),
    [allPilotEntries, selectedPilotSet],
  );

  const selectedPilotCivlIds = useMemo(
    () =>
      selectedPilots
        .map((pilot) => pilot.civlID)
        .filter(
          (civlId): civlId is number =>
            typeof civlId === "number" && civlId > 0,
        ),
    [selectedPilots],
  );

  const registeredPilotCivlIds = useMemo(
    () =>
      allPilotEntries
        .map((entry) => entry.pilot.civlID)
        .filter(
          (civlId): civlId is number =>
            typeof civlId === "number" && civlId > 0,
        ),
    [allPilotEntries],
  );

  const positionForecastContext = useMemo(
    (): PositionForecastRequestContext => ({
      competitionUrl: data.compUrl,
      pilotsUrl: data.pilotsUrl,
      competitionTitle: data.compTitle,
      startDate: toIsoDateString(data.compDate?.startDate),
      endDate: toIsoDateString(data.compDate?.endDate),
    }),
    [
      data.compDate?.endDate,
      data.compDate?.startDate,
      data.compTitle,
      data.compUrl,
      data.pilotsUrl,
    ],
  );

  const isDefaultSelection = useMemo(() => {
    if (selectedPilotKeys.length !== defaultSelectedPilotKeys.length)
      return false;
    const defaultSet = new Set(defaultSelectedPilotKeys);
    return selectedPilotKeys.every((key) => defaultSet.has(key));
  }, [defaultSelectedPilotKeys, selectedPilotKeys]);

  useEffect(() => {
    setSelectedPilotKeys(defaultSelectedPilotKeys);
    setSimulation({
      confirmed: data.confirmed,
      nationalities: data.nationalities,
      genders: data.genders,
      contributions: undefined,
    });
    setHasSimulationResponse(false);
    setSimulationError(null);
  }, [
    data.confirmed,
    data.genders,
    data.nationalities,
    defaultSelectedPilotKeys,
  ]);

  useEffect(() => {
    if (!allPilotEntries.length) return;

    const requestId = simulationRequestIdRef.current + 1;
    simulationRequestIdRef.current = requestId;
    const controller = new AbortController();
    setIsRecalculating(true);
    setSimulationError(null);

    fetch("/api/forecast/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selectedPilotKeys,
        allPilots: allPilotEntries.map((entry) => ({
          key: entry.key,
          civlId:
            typeof entry.pilot.civlID === "number" && entry.pilot.civlID > 0
              ? entry.pilot.civlID
              : undefined,
        })),
      }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to recompute forecast");
        return (await response.json()) as ForecastSimulation;
      })
      .then((payload) => {
        if (requestId !== simulationRequestIdRef.current) return;
        setSimulation(payload);
        setHasSimulationResponse(true);
      })
      .catch((error: { name?: string }) => {
        if (requestId !== simulationRequestIdRef.current) return;
        if (error?.name === "AbortError") return;
        setSimulationError("Could not recompute forecast.");
      })
      .finally(() => {
        if (requestId !== simulationRequestIdRef.current) return;
        setIsRecalculating(false);
      });

    return () => controller.abort();
  }, [allPilotEntries, selectedPilotKeys]);

  const onSelectConfirmed = () => {
    setSelectedPilotKeys(defaultSelectedPilotKeys);
  };

  const onClearAll = () => {
    setSelectedPilotKeys([]);
  };

  const onTogglePilot = (key: string) => {
    setSelectedPilotKeys((current) => {
      if (current.includes(key)) {
        return current.filter((item) => item !== key);
      }
      return [...current, key];
    });
  };

  const displayData: Forecast = {
    ...data,
    confirmed: hasSimulationResponse ? simulation.confirmed : data.confirmed,
    nationalities: hasSimulationResponse
      ? simulation.nationalities
      : data.nationalities,
    genders: hasSimulationResponse ? simulation.genders : data.genders,
  };

  const currentTa3 = displayData.confirmed?.WPRS?.[0]?.Ta3;
  const hasCurrentTa3 = Number.isFinite(currentTa3);
  const potentialTa3 = data.all?.WPRS?.[0]?.Ta3;
  const hasPotentialTa3 = Number.isFinite(potentialTa3);

  const renderContribution = (entryKey: string, isSelected: boolean) => {
    const rawValue = simulation.contributions?.[entryKey];
    const value =
      typeof rawValue === "number" ? Math.max(0, rawValue) : rawValue;
    if (typeof value !== "number") return isRecalculating ? "..." : "-";

    const activeValue =
      value > 0 && value < 0.01 ? "+<0.01" : `+${value.toFixed(2)}`;
    const inactiveValue =
      value > 0 && value < 0.01 ? "<0.01" : value.toFixed(2);

    return isSelected ? activeValue : inactiveValue;
  };

  const pilotImpactSection =
    allPilotEntries.length > 0 ? (
      <div
        className={`collapse-arrow collapse mt-5 rounded-lg border border-slate-200 bg-white/55 shadow-sm shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900/35 ${
          isPilotImpactOpen ? "collapse-open" : ""
        }`}
      >
        <button
          type="button"
          className="collapse-title flex w-full items-center gap-3 pr-12 text-left font-semibold"
          onClick={() => setIsPilotImpactOpen((current) => !current)}
          aria-expanded={isPilotImpactOpen}
        >
          <span>
            <span className="mr-2 rounded-full bg-green-500 px-2 py-0.5 text-xs font-semibold tracking-wide text-white uppercase">
              New
            </span>
            Pilot impact ({selectedPilots.length}/{allPilotEntries.length})
          </span>
        </button>
        {isPilotImpactOpen && (
          <div className="px-4 pb-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className={
                  isDefaultSelection
                    ? "border-slate-300 text-slate-400 dark:border-slate-600 dark:text-slate-500"
                    : "border-green-500 text-green-600 hover:border-green-600 hover:bg-green-500 hover:text-white dark:text-green-400"
                }
                onClick={onSelectConfirmed}
                disabled={isDefaultSelection}
              >
                All confirmed
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className={
                  selectedPilots.length === 0
                    ? "border-slate-300 text-slate-400 dark:border-slate-600 dark:text-slate-500"
                    : "border-green-500 text-green-600 hover:border-green-600 hover:bg-green-500 hover:text-white dark:text-green-400"
                }
                onClick={onClearAll}
                disabled={selectedPilots.length === 0}
              >
                Clear all
              </Button>
              {isRecalculating && (
                <span className="text-sm text-slate-500 dark:text-slate-300">
                  Recalculating...
                </span>
              )}
              {simulationError && (
                <span className="text-sm text-red-500">{simulationError}</span>
              )}
            </div>

            <div
              className="not-prose relative mb-2 h-[25rem] overflow-x-hidden overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-cyan-950/50"
              onWheel={(event) => event.stopPropagation()}
              onTouchMove={(event) => event.stopPropagation()}
            >
              <table className="table-pin-rows table-sm table w-full [&_tbody_tr:hover]:bg-slate-50 dark:[&_tbody_tr:hover]:bg-slate-800/60">
                <thead>
                  <tr className="border-b-0">
                    <th className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase shadow-none dark:bg-cyan-950 dark:text-slate-300">
                      Pilot
                    </th>
                    <th className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase shadow-none dark:bg-cyan-950 dark:text-slate-300">
                      Impact
                    </th>
                    <th className="bg-slate-50 text-right text-xs font-semibold tracking-wide text-slate-500 uppercase shadow-none dark:bg-cyan-950 dark:text-slate-300">
                      Include
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {!!confirmedEntries.length && (
                    <tr>
                      <td
                        colSpan={3}
                        className="pt-3 pb-1 text-xs font-semibold text-slate-500 uppercase dark:text-slate-300"
                      >
                        Confirmed pilots
                      </td>
                    </tr>
                  )}
                  {confirmedEntries.map((entry, rowIndex) => {
                    const isSelected = selectedPilotSet.has(entry.key);
                    return (
                      <tr key={entry.key}>
                        <td className="font-medium">
                          {rowIndex + 1}.{" "}
                          {entry.pilot.name ?? `Pilot ${entry.index + 1}`}
                        </td>
                        <td className="font-mono text-xs">
                          {renderContribution(entry.key, isSelected)}
                        </td>
                        <td className="text-right">
                          <input
                            type="checkbox"
                            id={`pilot-impact-${entry.key}`}
                            name={`pilot-impact-${entry.key}`}
                            checked={isSelected}
                            onChange={() => onTogglePilot(entry.key)}
                            aria-label={`Toggle ${entry.pilot.name ?? `Pilot ${entry.index + 1}`}`}
                            className="checkbox checkbox-sm"
                          />
                        </td>
                      </tr>
                    );
                  })}
                  {!!unconfirmedEntries.length && (
                    <tr>
                      <td
                        colSpan={3}
                        className="pt-4 pb-1 text-xs font-semibold text-slate-500 uppercase dark:text-slate-300"
                      >
                        Registered but not confirmed pilots
                      </td>
                    </tr>
                  )}
                  {unconfirmedEntries.map((entry, rowIndex) => {
                    const isSelected = selectedPilotSet.has(entry.key);
                    return (
                      <tr key={entry.key}>
                        <td className="font-medium">
                          {confirmedEntries.length + rowIndex + 1}.{" "}
                          {entry.pilot.name ?? `Pilot ${entry.index + 1}`}
                        </td>
                        <td className="font-mono text-xs">
                          {renderContribution(entry.key, isSelected)}
                        </td>
                        <td className="text-right">
                          <input
                            type="checkbox"
                            id={`pilot-impact-${entry.key}`}
                            name={`pilot-impact-${entry.key}`}
                            checked={isSelected}
                            onChange={() => onTogglePilot(entry.key)}
                            aria-label={`Toggle ${entry.pilot.name ?? `Pilot ${entry.index + 1}`}`}
                            className="checkbox checkbox-sm"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="pointer-events-none sticky bottom-0 -mt-6 flex h-16 bg-linear-to-b from-transparent to-white/90 dark:to-cyan-950/90" />
            </div>
          </div>
        )}
      </div>
    ) : null;

  return (
    <>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="relative rounded-lg border border-slate-200 bg-white/58 p-3 shadow-sm shadow-slate-950/5 before:absolute before:inset-x-0 before:top-0 before:h-1 before:rounded-t-lg before:bg-linear-to-r before:from-green-400 before:to-blue-500 dark:border-slate-800 dark:bg-slate-900/35">
          <div className="flex items-start justify-between gap-3">
            <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
              WPRS
            </div>
            <div className="group relative -mt-1 -mr-1 inline-flex">
              <button
                type="button"
                aria-describedby="forecast-method-info"
                className="btn btn-circle btn-ghost btn-xs h-7 min-h-7 w-7 border border-slate-200 bg-white/65 text-slate-500 shadow-sm hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none dark:border-slate-700 dark:bg-slate-900/35 dark:text-slate-300 dark:hover:border-sky-500 dark:hover:bg-sky-500/10 dark:hover:text-sky-300"
              >
                <svg
                  aria-hidden="true"
                  className="h-3.5 w-3.5"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
                <span className="sr-only">Forecast method information</span>
              </button>
              <div
                id="forecast-method-info"
                role="tooltip"
                className="pointer-events-none absolute top-full right-0 z-20 mt-2 w-[min(22rem,calc(100vw-3rem))] rounded-lg border border-slate-200 bg-white/95 p-3 text-sm leading-5 text-slate-600 opacity-0 shadow-xl shadow-slate-950/15 backdrop-blur-sm transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 dark:border-slate-700 dark:bg-cyan-950/95 dark:text-slate-300"
              >
                The competition WPRS forecast uses CIVL rankings as required by
                the WPRS rules. Your personal position forecast uses historical
                competition results against the current field.
              </div>
            </div>
          </div>
          {hasCurrentTa3 ? (
            <>
              <div className="mt-0.5 text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
                {currentTa3?.toFixed(1)}
              </div>
              <p className="mt-0.5 text-xs leading-5 text-slate-600 dark:text-slate-300">
                Based on the currently confirmed pilots.
              </p>
            </>
          ) : (
            <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              No confirmed pilots yet.
            </div>
          )}
        </div>

        {data.maxPilots && data.maxPilots > 0 && (
          <div className="relative rounded-lg border border-slate-200 bg-white/58 p-3 shadow-sm shadow-slate-950/5 before:absolute before:inset-x-0 before:top-0 before:h-1 before:rounded-t-lg before:bg-linear-to-r before:from-blue-500 before:to-green-400 dark:border-slate-800 dark:bg-slate-900/35">
            <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
              Potential WPRS
            </div>
            <div className="mt-0.5 text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
              {hasPotentialTa3 ? potentialTa3?.toFixed(1) : "-"}
            </div>
            <p className="mt-0.5 text-xs leading-5 text-slate-600 dark:text-slate-300">
              If the top {data.maxPilots} registered pilots would be confirmed.
            </p>
          </div>
        )}
      </div>

      {pilotImpactSection}
      <PilotSelfProjection
        confirmedPilotCivlIds={selectedPilotCivlIds}
        registeredPilotCivlIds={registeredPilotCivlIds}
        forecastContext={positionForecastContext}
        confirmedWprs={displayData.confirmed?.WPRS}
        registeredWprs={data.all?.WPRS}
      />
      {hasCurrentTa3 && <ForecastDetails data={displayData} />}

      {displayData.confirmed?.pilots && (
        <LevelChart data={displayData.confirmed} />
      )}
      {displayData.nationalities && (
        <Nationalities data={displayData.nationalities} />
      )}
      {displayData.genders && <Genders data={displayData.genders} />}
      {(displayData.nationalities ?? displayData.genders) && (
        <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">
          The sum of pilots may not be equal to the number of confirmed pilots
          because of lookup mismatches.
        </div>
      )}

      {displayData.confirmed?.WPRS.length && (
        <ListRankings data={displayData.confirmed} />
      )}
    </>
  );
}
