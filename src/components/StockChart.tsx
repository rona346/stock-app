import React, { useId } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface StockChartProps {
  data: { time: string; price: number }[];
  color?: string;
  height?: number;
  showAxes?: boolean;
}

export const StockChart: React.FC<StockChartProps> = ({
  data,
  color = "#10b981",
  height = 100,
  showAxes = false,
}) => {
  const gradientId = `colorPrice-${useId().replace(/:/g, "")}`;

  return (
    <div
      style={{
        width: "100%",
        height: `${height}px`,
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 2, right: 0, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient
              id={gradientId}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>

          {showAxes && <XAxis dataKey="time" hide />}
          {showAxes && <YAxis hide domain={["auto", "auto"]} />}

          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2937",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
            }}
            itemStyle={{ color: "#fff" }}
            labelStyle={{ display: "none" }}
          />

          <Area
            type="monotone"
            dataKey="price"
            stroke={color}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};