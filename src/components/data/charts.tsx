"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/lib/types";
import { formatCompactCurrency, formatNumber } from "@/lib/utils";

/**
 * Chart palette.
 *
 * The brand tokens (deep navy, forest, warm gold) are tuned for type and
 * chrome; at full saturation on a small mark they read as grey. These three
 * slots are the brand hues stepped into the chart lightness band, validated as
 * a set for colour-vision deficiency and adjacent separation. They are assigned
 * in fixed order and never cycled — a fourth series folds into "Other" or
 * becomes its own chart.
 *
 * Gold and green sit below 3:1 against the surface, so every chart that uses
 * them also ships a legend, direct labels or the matching table (the relief
 * rule).
 */
const SERIES = ["#256abf", "#1baf7a", "#eda100"] as const;

const GRID = "hsl(218 18% 89%)";
const AXIS_TEXT = "hsl(218 14% 42%)";
const SURFACE = "#ffffff";

const axisProps = {
  stroke: GRID,
  tick: { fill: AXIS_TEXT, fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: GRID },
} as const;

/* ------------------------------------------------------------------ */
/* Tooltip                                                             */
/* ------------------------------------------------------------------ */

interface TooltipEntry {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
}

function ChartTooltip({
  active,
  payload,
  label,
  formatter,
  seriesNames,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  formatter: (value: number) => string;
  seriesNames?: Record<string, string>;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 shadow-md">
      <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <ul className="space-y-0.5">
        {payload.map((entry, index) => (
          <li key={index} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full"
              style={{ background: entry.color }}
            />
            <span className="text-muted-foreground">
              {seriesNames?.[String(entry.dataKey)] ?? entry.name}
            </span>
            <span className="ml-auto font-semibold text-foreground">
              {formatter(Number(entry.value ?? 0))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Area trend — one series, change over time                           */
/* ------------------------------------------------------------------ */

export function TrendAreaChart({
  data,
  seriesName,
  variant = "currency",
  height = 240,
}: {
  data: TrendPoint[];
  seriesName: string;
  variant?: "currency" | "count";
  height?: number;
}) {
  const gradientId = React.useId().replace(/:/g, "");
  const format = variant === "currency" ? formatCompactCurrency : formatNumber;

  return (
    <div className="w-full min-w-0" style={{ height }}>
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SERIES[0]} stopOpacity={0.22} />
            <stop offset="100%" stopColor={SERIES[0]} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={16} />
        <YAxis {...axisProps} width={58} tickFormatter={(v) => format(Number(v))} />
        <Tooltip
          cursor={{ stroke: AXIS_TEXT, strokeWidth: 1, strokeDasharray: "3 3" }}
          content={<ChartTooltip formatter={format} seriesNames={{ value: seriesName }} />}
        />
        <Area
          type="monotone"
          dataKey="value"
          name={seriesName}
          stroke={SERIES[0]}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          activeDot={{ r: 4, strokeWidth: 2, stroke: SURFACE }}
        />
      </AreaChart>
    </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Two-series bars — created vs completed                              */
/* ------------------------------------------------------------------ */

export function DualBarChart({
  data,
  primaryName,
  secondaryName,
  height = 240,
}: {
  data: TrendPoint[];
  primaryName: string;
  secondaryName: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={16} />
        <YAxis {...axisProps} width={38} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: "hsl(218 18% 89% / 0.35)" }}
          content={
            <ChartTooltip
              formatter={formatNumber}
              seriesNames={{ value: primaryName, secondary: secondaryName }}
            />
          }
        />
        <Legend
          verticalAlign="top"
          align="right"
          height={28}
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span className="text-xs text-muted-foreground">{value}</span>
          )}
        />
        <Bar dataKey="value" name={primaryName} fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={18} />
        <Bar
          dataKey="secondary"
          name={secondaryName}
          fill={SERIES[1]}
          radius={[4, 4, 0, 0]}
          maxBarSize={18}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ */
/* Magnitude bars — one hue, ranked, direct-labelled                   */
/* ------------------------------------------------------------------ */

export function RankedBarChart({
  data,
  variant = "count",
  height,
}: {
  data: TrendPoint[];
  variant?: "currency" | "count";
  height?: number;
}) {
  const format = variant === "currency" ? formatCompactCurrency : formatNumber;
  const max = Math.max(...data.map((d) => d.value), 1);

  // A ranked list of magnitudes reads faster as labelled rows than as a plot:
  // no axis to trace, and the value sits beside its own label.
  return (
    <ul className="space-y-3" style={height ? { minHeight: height } : undefined}>
      {data.map((item) => (
        <li key={item.label} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium text-foreground">{item.label}</span>
            <span className="shrink-0 tabular-nums font-semibold text-foreground">
              {format(item.value)}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${Math.max((item.value / max) * 100, 2)}%`,
                background: SERIES[0],
              }}
              role="img"
              aria-label={`${item.label}: ${format(item.value)}`}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Donut — part to whole, at most three slices                         */
/* ------------------------------------------------------------------ */

export function SplitDonutChart({
  data,
  height = 240,
}: {
  data: TrendPoint[];
  height?: number;
}) {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  const slices = data.slice(0, 3);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="w-full sm:w-1/2">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              innerRadius="58%"
              outerRadius="84%"
              paddingAngle={2}
              stroke={SURFACE}
              strokeWidth={2}
            >
              {slices.map((entry, index) => (
                <Cell key={entry.label} fill={SERIES[index % SERIES.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip formatter={formatNumber} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full space-y-2 sm:w-1/2">
        {slices.map((entry, index) => (
          <li key={entry.label} className="flex items-center gap-2.5 text-sm">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: SERIES[index % SERIES.length] }}
            />
            <span className="text-muted-foreground">{entry.label}</span>
            <span className="ml-auto tabular-nums font-semibold text-foreground">
              {formatNumber(entry.value)}
            </span>
            <span className="w-10 shrink-0 text-right tabular-nums text-xs text-muted-foreground">
              {total ? Math.round((entry.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const CHART_SERIES = SERIES;
