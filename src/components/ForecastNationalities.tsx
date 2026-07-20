"use client";
import { useEffect, useRef, useState } from "react";
import { type Forecast } from "@/types/common";
import { CHART_COLORS } from "@/utils/constants";
import {
  PieChart,
  Pie,
  Legend,
  Tooltip,
  ResponsiveContainer,
  Cell,
  type LegendPayload,
  type TooltipContentProps,
} from "recharts";

type NationalityPieDatum = {
  name: string;
  value: number;
  pilotNames: string[];
};

function NationalityTooltip({
  active,
  payload,
  isPinned,
}: TooltipContentProps & { isPinned: boolean }) {
  const data = payload[0]?.payload as NationalityPieDatum | undefined;

  if (!active || !data) return null;

  return (
    <div
      data-nationality-tooltip
      className="w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white/95 p-3 text-slate-700 shadow-xl shadow-slate-950/15 backdrop-blur-sm dark:border-slate-700 dark:bg-cyan-950/95 dark:text-slate-200"
    >
      <div className="font-semibold text-slate-950 dark:text-white">
        {data.name}: {data.value} {data.value === 1 ? "pilot" : "pilots"}
      </div>
      {!isPinned && data.pilotNames.length > 8 && (
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Click or tap to keep this list open and scroll.
        </div>
      )}
      <ul
        tabIndex={isPinned ? 0 : -1}
        className="mt-2 max-h-64 space-y-1 overflow-y-auto overscroll-contain pr-2 text-sm focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:outline-none"
      >
        {data.pilotNames.map((pilotName, index) => (
          <li key={`${pilotName}-${index}`}>{pilotName}</li>
        ))}
      </ul>
    </div>
  );
}

export function Nationalities({ data }: { data: Forecast["nationalities"] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [pinnedIndex, setPinnedIndex] = useState<number | null>(null);

  useEffect(() => setPinnedIndex(null), [data]);

  useEffect(() => {
    if (pinnedIndex === null) return;

    const dismissOnPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (sectionRef.current?.contains(target)) return;
      if (
        target instanceof Element &&
        target.closest("[data-nationality-tooltip]")
      )
        return;
      setPinnedIndex(null);
    };
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPinnedIndex(null);
    };

    document.addEventListener("pointerdown", dismissOnPointerDown);
    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismissOnPointerDown);
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, [pinnedIndex]);

  if (!data) return null;

  const pieData = Object.keys(data.count)
    .map((key) => {
      return {
        name: key,
        value: data.count[key] ?? 0,
        pilotNames: data.pilotNames[key] ?? [],
      } satisfies NationalityPieDatum;
    })
    .sort((a, b) => b.value - a.value);

  const renderLegend = (value: string | undefined, entry: LegendPayload) => {
    const payload = entry.payload as { value?: number } | undefined;

    return (
      <span className="text-sm text-black dark:text-slate-200">
        {value}: {payload?.value}
      </span>
    );
  };

  return (
    <section
      ref={sectionRef}
      className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800"
    >
      <h2 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-100">
        Nationalities
      </h2>

      <ResponsiveContainer width="100%" height={520}>
        <PieChart>
          <Pie
            dataKey="value"
            isAnimationActive={true}
            data={pieData}
            cx="50%"
            cy="50%"
            outerRadius={"80%"}
            fill="#8884d8"
            label
            onClick={(_, index) =>
              setPinnedIndex((current) => (current === index ? null : index))
            }
          >
            {pieData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Legend formatter={renderLegend} iconType="circle" />
          <Tooltip
            active={pinnedIndex === null ? undefined : true}
            allowEscapeViewBox={{ x: true, y: true }}
            content={(props) => (
              <NationalityTooltip {...props} isPinned={pinnedIndex !== null} />
            )}
            defaultIndex={pinnedIndex ?? undefined}
            isAnimationActive={false}
            trigger={pinnedIndex === null ? "hover" : "click"}
            wrapperStyle={{
              pointerEvents: pinnedIndex === null ? "none" : "auto",
              zIndex: 20,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </section>
  );
}
