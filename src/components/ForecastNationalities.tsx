"use client";
import { type Forecast } from "@/types/common";
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

  const COLORS = [
    "#88D498", // pastel green
    "#32CCBC", // pastel blue
    "#7CEC9F", // another pastel green
    "#48A9A6", // another pastel blue
    "#FFC1A1", // pastel red
    "#FFABAB", // another pastel red
    "#D4A5A5", // pastel violet
    "#392F5A", // another pastel violet
    "#9F5F80", // pastel purple
    "#FFD8A8", // pastel orange
    "#ACD8AA", // another light pastel green
    "#FFE156", // pastel yellow
    "#FF9B85", // pastel coral
    "#D0E1F9", // light pastel blue
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
        {value} {entry?.payload?.payload?.value}
      </span>
    );
  };

  return (
    <>
      <div className="collapse collapse-arrow mt-3 rounded-box border border-slate-300 ">
        <input type="checkbox" />
        <div className="collapse-title font-medium">Show nationalities</div>
        <div className="collapse-content">
          <ResponsiveContainer width="100%" height={500}>
            <PieChart width={500} height={500}>
              <Pie
                dataKey="value"
                isAnimationActive={false}
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={120}
                fill="#8884d8"
                label
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              {/* @ts-expect-error It does not seem to be typed correctly in recharts */}
              <Legend formatter={renderLegend} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
