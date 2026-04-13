"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AreaChartProps {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  showGrid?: boolean;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-popover/95 px-3 py-2 shadow-xl backdrop-blur-md">
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-foreground">
        ${payload[0].value.toLocaleString()}
      </p>
    </div>
  );
}

export function PortfolioArea({
  data,
  color = "hsl(var(--primary))",
  height = 280,
  showGrid = true,
}: AreaChartProps) {
  const id = `area-gradient-${color.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="50%" stopColor={color} stopOpacity={0.08} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border) / 0.4)"
            vertical={false}
          />
        )}
        <XAxis
          dataKey="label"
          stroke="hsl(var(--muted-foreground) / 0.5)"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          fontFamily="var(--font-mono)"
        />
        <YAxis
          stroke="hsl(var(--muted-foreground) / 0.5)"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `$${v.toLocaleString()}`}
          fontFamily="var(--font-mono)"
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${id})`}
          animationDuration={1200}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
