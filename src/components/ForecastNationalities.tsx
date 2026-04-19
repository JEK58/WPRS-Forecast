"use client";
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
} from "recharts";

export function Nationalities({ data }: { data: Forecast["nationalities"] }) {
  if (!data) return null;

  const pieData = Object.keys(data.count)
    .map((key) => {
      return { name: key, value: data.count[key] ?? 0 };
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
    <div className="mt-6">
      <h2 className="text-lg font-bold">Nationalities</h2>

      <ResponsiveContainer width="100%" height={600}>
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
          >
            {pieData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Legend formatter={renderLegend} iconType="circle" />
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
