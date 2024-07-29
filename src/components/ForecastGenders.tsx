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
interface EntryType {
  payload?: {
    payload?: {
      value?: string;
      percentage?: number;
    };
  };
}

export function Genders({ data }: { data: Forecast["genders"] }) {
  if (!data) return null;

  const genders = data;
  const sum = genders.female + genders.male;

  const pieData = [
    {
      name: "Female",
      value: genders.female,
      percentage: (genders.female / sum) * 100,
    },
    {
      name: "Male",
      value: genders.male,
      percentage: (genders.male / sum) * 100,
    },
  ];

  const renderLegend = (value: string, entry: EntryType) => {
    return (
      <span className="text-sm text-black dark:text-slate-200">
        {value}: {Math.round(entry?.payload?.payload?.percentage ?? 0)}%
      </span>
    );
  };

  return (
    <div className="mt-2">
      <h2 className="text-lg font-bold">Genders</h2>

      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
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
