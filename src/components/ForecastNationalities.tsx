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
} from "recharts";

export function Nationalities({ data }: { data: Forecast }) {
  if (!data.nationalities) return null;

  const pieData = Object.keys(data.nationalities.count)
    .map((key) => {
      return { name: key, value: data.nationalities?.count[key] ?? 0 };
    })
    .sort((a, b) => b.value - a.value);

  interface EntryType {
    payload?: {
      payload?: {
        value?: string;
      };
    };
  }

  const renderLegend = (value: string, entry: EntryType) => {
    return (
      <span className="text-sm text-black dark:text-slate-200">
        {value}: {entry?.payload?.payload?.value}
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
          {/* @ts-expect-error It does not seem to be typed correctly in recharts */}
          <Legend formatter={renderLegend} iconType="circle" />
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
