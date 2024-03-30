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

export function Genders({ data }: { data: Forecast }) {
  if (!data.genders) return null;

  const pieData = [
    { name: "Female", value: data.genders.female },
    { name: "Male", value: data.genders.male },
  ];

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
    <div className="">
      <h2 className="text-lg font-bold">Genders</h2>

      <ResponsiveContainer width="100%" height={200}>
        <PieChart width={500} height={200}>
          <Pie
            dataKey="value"
            isAnimationActive={true}
            startAngle={180}
            endAngle={0}
            data={pieData}
            cx="50%"
            cy="90%"
            outerRadius={120}
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