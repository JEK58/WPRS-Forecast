"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  type Forecast,
  type ForecastSimulation,
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

    const signedValue =
      value > 0 && value < 0.01 ? "+<0.01" : `+${value.toFixed(2)}`;

    if (isSelected) return signedValue;
    return `would add ${signedValue}`;
  };

  const pilotImpactSection =
    allPilotEntries.length > 0 ? (
      <div className="collapse-arrow collapse mt-4 border border-slate-300 dark:border-slate-600">
        <input type="checkbox" />
        <div className="collapse-title font-semibold">
          <span className="mr-2 rounded-full bg-green-500 px-2 py-0.5 text-xs font-semibold tracking-wide text-white uppercase">
            New
          </span>
          Pilot impact ({selectedPilots.length}/{allPilotEntries.length})
        </div>
        <div className="collapse-content">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onSelectConfirmed}
              disabled={isDefaultSelection}
            >
              All confirmed
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
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
            className="not-prose relative mt-2 mb-2 h-[25rem] overflow-x-hidden overflow-y-auto overscroll-contain rounded-md border border-slate-200 dark:border-slate-700"
            onWheel={(event) => event.stopPropagation()}
            onTouchMove={(event) => event.stopPropagation()}
          >
            <table className="table-pin-rows table-sm table w-full">
              <thead>
                <tr className="border-b-0">
                  <th className="bg-base-200">Pilot</th>
                  <th className="bg-base-200">Impact</th>
                  <th className="bg-base-200 text-right">Include</th>
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
                          checked={isSelected}
                          onChange={() => onTogglePilot(entry.key)}
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
                          checked={isSelected}
                          onChange={() => onTogglePilot(entry.key)}
                          className="checkbox checkbox-sm"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="bg-base-100 pointer-events-none sticky bottom-0 -mt-6 flex h-16 [mask-image:linear-gradient(transparent,#000000)]" />
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
      <div className="mt-4 font-semibold">
        WPRS:{" "}
        {hasCurrentTa3 ? (
          <span className="font-semibold text-green-500">
            {currentTa3?.toFixed(2)}
          </span>
        ) : (
          <span>No confirmed pilots yet.</span>
        )}
      </div>

      {data.maxPilots && data.maxPilots > 0 && (
        <div className="mt-2">
          Potential WPRS:{" "}
          <span className="text-green-500">
            {hasPotentialTa3 ? potentialTa3?.toFixed(2) : "-"}
          </span>
          <p className="text-sm">
            If the top {data.maxPilots} registered pilots would be confirmed.
          </p>
        </div>
      )}

      <p className="mt-4 text-sm">
        This forecast is based on the currently confirmed/registered pilots and
        their CIVL rankings. The calculation will become more accurate as the
        competition date approaches.
      </p>
      <div className="mt-2">
        <Link
          className="text-sm underline decoration-green-500 decoration-dotted hover:decoration-solid"
          target="_blank"
          href="https://www.fai.org/sites/default/files/civl/documents/sporting_code_s7_e_-_wprs_2022.pdf"
        >
          Details can be found in the FAI Sporting Code Section 7E
        </Link>
      </div>
      <PilotSelfProjection
        confirmedPilots={displayData.confirmed?.pilots}
        registeredPilots={data.all?.pilots}
        confirmedWprs={displayData.confirmed?.WPRS}
        registeredWprs={data.all?.WPRS}
      />
      {pilotImpactSection}
      {hasCurrentTa3 && <ForecastDetails data={displayData} />}

      {displayData.confirmed?.pilots && (
        <LevelChart data={displayData.confirmed} />
      )}
      {displayData.nationalities && (
        <Nationalities data={displayData.nationalities} />
      )}
      {displayData.genders && <Genders data={displayData.genders} />}
      {(displayData.nationalities ?? displayData.genders) && (
        <div className="mt-4 text-sm">
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
