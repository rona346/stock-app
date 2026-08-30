import React from "react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
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
  return (
    <div style={{ width: "96px", height: `${height}px` }}>
      <AreaChart
        data={data}
        width={96}
        height={height}
      >
        <defs>
          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
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
          fill="url(#colorPrice)"
          strokeWidth={2}
          isAnimationActive={false}
        />
      </AreaChart>
    </div>
  );
};