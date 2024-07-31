"use client";
import { type Forecast } from "@/types/common";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS } from "@/utils/constants";

export function LevelChart({ data }: { data: Forecast["confirmed"] }) {
  const pilots = data?.pilots;

  if (!pilots) return;

  const ranks = [0, 10, 50, 100, 200, 500, 1000, 5000, 9000] as const;
  const sortedIds = new Set<number>();
  const groupedRanks = {} as Record<(typeof ranks)[number], number>;

  ranks.forEach((rank) => (groupedRanks[rank] = 0));

  pilots.forEach(({ rank, id }) => {
    if (!rank || !id) return;
    ranks.forEach((groupRank) => {
      if (rank < groupRank && !sortedIds.has(id)) {
        groupedRanks[groupRank] += 1;
        sortedIds.add(id);
      }
    });
  });

  const chartData = Object.entries(groupedRanks).map(([key, value]) => ({
    name: key,
    value: value,
  }));

  return (
    <div className="mt-6">
      <h2 className="text-lg font-bold">Pilot level distribution</h2>

      <ResponsiveContainer width="100%" height={300} className={"mt-4"}>
        <AreaChart
          data={chartData}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 18,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            label={{
              value: "Rank (range)",
              position: "insideBottom",
              offset: -14,
            }}
          />
          <YAxis
            label={{
              value: "Pilots",
              angle: -90,
              position: "insideLeft",
              offset: 10,
            }}
          />
          <Tooltip
            separator=": "
            formatter={(value) => [value, "Pilots"]}
            // labelFormatter={(value) => `Top ${value}`}
            labelFormatter={() => ``}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={CHART_COLORS[0]}
            fill={CHART_COLORS[0]}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
