"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  type PositionForecastRequestContext,
  type PositionForecastResponse,
} from "@/types/common";
import { CHART_COLORS } from "@/utils/constants";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
  forecast: NonNullable<PositionForecastResponse["scenarios"]["confirmed"]>;
  points?: WprsRow;
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
  confirmedPilotCivlIds,
  registeredPilotCivlIds,
  forecastContext,
  confirmedWprs,
  registeredWprs,
}: {
  confirmedPilotCivlIds?: number[];
  registeredPilotCivlIds?: number[];
  forecastContext?: PositionForecastRequestContext;
  confirmedWprs?: WprsRow[];
  registeredWprs?: WprsRow[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Pilot[]>([]);
  const [selectedPilot, setSelectedPilot] = useState<Pilot | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isForecasting, setIsForecasting] = useState(false);
  const [forecastError, setForecastError] = useState<string | null>(null);
  const [positionForecast, setPositionForecast] = useState<
    PositionForecastResponse["scenarios"]
  >({});
  const [isHydrated, setIsHydrated] = useState(false);
  const forecastRequestIdRef = useRef(0);

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

  useEffect(() => {
    if (!selectedPilot) {
      forecastRequestIdRef.current += 1;
      setPositionForecast({});
      setForecastError(null);
      return;
    }

    const requestId = forecastRequestIdRef.current + 1;
    forecastRequestIdRef.current = requestId;
    const controller = new AbortController();
    setIsForecasting(true);
    setForecastError(null);

    fetch("/api/pilot/position-forecast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selectedCivlId: selectedPilot.id,
        selectedPilotName: selectedPilot.name,
        context: forecastContext,
        scenarios: {
          confirmed: confirmedPilotCivlIds ?? [],
          registered: registeredPilotCivlIds ?? [],
        },
      }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to forecast position");
        return (await res.json()) as PositionForecastResponse;
      })
      .then((payload) => {
        if (requestId !== forecastRequestIdRef.current) return;
        setPositionForecast(payload.scenarios);
      })
      .catch((error: { name?: string }) => {
        if (requestId !== forecastRequestIdRef.current) return;
        if (error.name === "AbortError") return;
        setPositionForecast({});
        setForecastError("Could not forecast position from historical results.");
      })
      .finally(() => {
        if (requestId !== forecastRequestIdRef.current) return;
        setIsForecasting(false);
      });

    return () => controller.abort();
  }, [
    confirmedPilotCivlIds,
    forecastContext,
    registeredPilotCivlIds,
    selectedPilot,
  ]);

  const confirmedProjection = useMemo(() => {
    return projectPilot(positionForecast.confirmed, confirmedWprs);
  }, [positionForecast.confirmed, confirmedWprs]);

  const registeredProjection = useMemo(() => {
    return projectPilot(positionForecast.registered, registeredWprs);
  }, [positionForecast.registered, registeredWprs]);

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
    <div className="rounded-box mt-6 border border-green-300/80 bg-slate-50 p-4 dark:border-green-700/60 dark:bg-slate-950">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-green-500 px-2 py-0.5 text-xs font-semibold tracking-wide text-white uppercase">
          New
        </span>
        <h3 className="text-base font-semibold">Personal Position Forecast</h3>
      </div>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        This forecast looks at how you’ve performed against the current field
        in past competitions. Recent results count more than older ones, using a
        two-year weighting system. No AI, just maths.
      </p>
      {isHydrated && !selectedPilot && (
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Search your name or CIVL ID to forecast your place from historical
          results.
        </p>
      )}

      {isHydrated && !selectedPilot && (
        <div className="relative mt-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or CIVL ID"
            className="h-10"
          />

          {!!query.trim().length && (
            <div className="absolute inset-x-0 top-full z-20 mt-1 rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
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
        <div className="mt-4 rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-900">
          <div className="flex items-start justify-between gap-3">
            <div className="font-semibold">
              {selectedPilot.name} (CIVL {selectedPilot.id})
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 min-h-7 border-slate-300/60 text-slate-600 hover:border-green-500 hover:bg-green-500 hover:text-white dark:border-slate-700/60 dark:text-slate-300 dark:hover:border-green-500 dark:hover:bg-green-500 dark:hover:text-white"
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
            isLoading={isForecasting}
            error={forecastError}
          />
          <ProjectionCard
            title="Against Registered Pilots"
            projection={registeredProjection}
            isLoading={isForecasting}
            error={forecastError}
          />
        </div>
      )}
    </div>
  );
}

function projectPilot(
  forecast?: PositionForecastResponse["scenarios"]["confirmed"],
  wprsRows?: WprsRow[],
): Projection | undefined {
  if (!forecast) return;

  return {
    forecast,
    points: wprsRows?.[forecast.predictedPosition - 1],
  };
}

function ProjectionCard({
  title,
  projection,
  isLoading,
  error,
}: {
  title: string;
  projection?: Projection;
  isLoading: boolean;
  error: string | null;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
      <div className="font-medium">{title}</div>
      {isLoading ? (
        <div className="mt-2 text-sm text-slate-500 dark:text-slate-300">
          Forecasting...
        </div>
      ) : error ? (
        <div className="mt-2 text-sm text-red-500">{error}</div>
      ) : projection ? (
        <>
          <div className="mt-2 text-sm">
            Predicted place:{" "}
            <span className="font-semibold">
              #{projection.forecast.predictedPosition}
            </span>{" "}
            / {projection.forecast.totalPilots}
          </div>
          <div className="mt-1 text-sm">
            Likely range:{" "}
            <span className="font-semibold">
              #{projection.forecast.likelyRange.lower}-
              {projection.forecast.likelyRange.upper}
            </span>{" "}
            <span className="text-xs text-slate-500 dark:text-slate-300">
              ({formatProbability(projection.forecast.likelyRange.probability)})
            </span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
            <ProbabilityStat
              label="Win"
              value={projection.forecast.winProbability}
            />
            <ProbabilityStat
              label="Podium"
              value={projection.forecast.podiumProbability}
            />
            <ProbabilityStat
              label="Top 10"
              value={projection.forecast.topTenProbability}
            />
          </div>
          <PositionProbabilityCurve forecast={projection.forecast} />
          <div className="mt-1 text-sm">
            Confidence:{" "}
            <span className="font-semibold capitalize">
              {projection.forecast.confidence}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-300">
            {projection.forecast.directComparisonCount} direct comparisons,{" "}
            {projection.forecast.selectedPilotCompetitionCount} historical
            competitions,{" "}
            {Math.round(projection.forecast.opponentHistoryCoverage * 100)}%
            opponent coverage.
          </div>
          {projection.points ? (
            <div className="mt-1 text-sm">
              Points at predicted place:{" "}
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

function ProbabilityStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-900">
      <div className="text-slate-500 dark:text-slate-300">{label}</div>
      <div className="font-semibold">{formatProbability(value)}</div>
    </div>
  );
}

function PositionProbabilityCurve({
  forecast,
}: {
  forecast: Projection["forecast"];
}) {
  const probabilities = getVisiblePositionProbabilities(forecast);
  const chartData = probabilities.map((entry) => ({
    position: entry.position,
    label: `#${entry.position}`,
    probability: entry.probability,
    percentage: entry.probability * 100,
  }));
  const xAxisTicks = getProbabilityAxisTicks(
    probabilities.map((entry) => entry.position),
    forecast.predictedPosition,
  );

  return (
    <div className="mt-3">
      <div className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-300">
        Place probability
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart
          data={chartData}
          margin={{ top: 8, right: 12, left: 6, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="position"
            ticks={xAxisTicks}
            interval={0}
            tick={{ fontSize: 10 }}
            tickLine={false}
            tickMargin={6}
            tickFormatter={(position) =>
              position === forecast.predictedPosition
                ? `#${position}`
                : `${position}`
            }
          />
          <YAxis
            tick={{ fontSize: 10 }}
            tickLine={false}
            tickMargin={4}
            tickFormatter={(value) => `${value}%`}
            width={34}
          />
          <Tooltip
            separator=": "
            formatter={(value) => [
              formatProbability(Number(value) / 100),
              "Probability",
            ]}
            labelFormatter={(position) => `Place #${position}`}
          />
          <ReferenceLine
            x={forecast.predictedPosition}
            stroke={CHART_COLORS[3]}
            strokeDasharray="4 4"
          />
          <Area
            type="monotone"
            dataKey="percentage"
            stroke={CHART_COLORS[0]}
            fill={CHART_COLORS[0]}
            fillOpacity={0.35}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function getProbabilityAxisTicks(positions: number[], predictedPosition: number) {
  if (positions.length <= 8) return positions;

  const step = Math.ceil(positions.length / 6);
  const minGap = Math.max(2, Math.floor(step / 2));
  const ticks = new Set<number>();
  const firstPosition = positions[0];
  const lastPosition = positions[positions.length - 1];

  positions.forEach((position, index) => {
    if (index % step === 0) ticks.add(position);
  });

  if (typeof firstPosition === "number") ticks.add(firstPosition);
  if (typeof lastPosition === "number") ticks.add(lastPosition);

  ticks.add(predictedPosition);

  let sortedTicks = [...ticks]
    .filter(
      (tick) =>
        tick === firstPosition ||
        tick === lastPosition ||
        tick === predictedPosition ||
        Math.abs(tick - predictedPosition) >= minGap,
    )
    .sort((a, b) => a - b);
  const previousToLastTick = sortedTicks[sortedTicks.length - 2];

  if (
    typeof previousToLastTick === "number" &&
    typeof lastPosition === "number" &&
    previousToLastTick !== predictedPosition &&
    lastPosition - previousToLastTick < minGap
  ) {
    sortedTicks = sortedTicks.filter((tick) => tick !== previousToLastTick);
  }

  return sortedTicks;
}

function getVisiblePositionProbabilities(forecast: Projection["forecast"]) {
  const lower = Math.max(1, forecast.likelyRange.lower - 2);
  const upper = Math.min(forecast.totalPilots, forecast.likelyRange.upper + 2);

  return forecast.positionProbabilities.filter(
    (entry) => entry.position >= lower && entry.position <= upper,
  );
}

function formatProbability(value: number) {
  if (value > 0 && value < 0.001) return "<0.1%";
  return `${(value * 100).toFixed(value < 0.1 ? 1 : 0)}%`;
}
