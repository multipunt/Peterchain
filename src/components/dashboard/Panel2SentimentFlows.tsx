"use client";

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  Rectangle,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Flame, GaugeCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import type {
  AssetSymbol,
  MarketSentimentState,
  SentimentFlowPoint,
  SentimentRegimeId,
} from "@/lib/types/onchain";
import { cn, formatCompactNumber, formatPct, formatRatio } from "@/lib/utils";

interface Panel2Props {
  asset: AssetSymbol;
  sentimentFlows: SentimentFlowPoint[];
  sentimentState: MarketSentimentState;
  sourceLabel: string;
}

const REGIME_CATALOG: {
  id: SentimentRegimeId;
  title: string;
  subtitle: string;
  lightColor: string;
  activeBorder: string;
  activeBg: string;
}[] = [
  {
    id: "EUPHORIA",
    title: "Punto de Euforia",
    subtitle: "CPI pico + SOPR STH pico + Inflows disparados",
    lightColor: "bg-rose-500 shadow-[0_0_14px_rgba(244,63,94,0.85)]",
    activeBorder: "border-rose-500/60",
    activeBg: "bg-rose-500/15",
  },
  {
    id: "OVEROPTIMISM",
    title: "Sobreoptimismo / Venta de grandes",
    subtitle: "Toma agresiva de beneficios y presión de entrada a CEX",
    lightColor: "bg-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.85)]",
    activeBorder: "border-amber-500/60",
    activeBg: "bg-amber-500/15",
  },
  {
    id: "HEALTHY_BULL",
    title: "Continuación alcista saludable",
    subtitle: "SOPR alto con inflows bajos o salidas netas de exchanges",
    lightColor: "bg-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.85)]",
    activeBorder: "border-emerald-500/60",
    activeBg: "bg-emerald-500/15",
  },
  {
    id: "APATHY_ACCUMULATION",
    title: "Apatía / Zona de acumulación",
    subtitle: "SOPR enfriado y prima institucional neutral/negativa",
    lightColor: "bg-cyan-400 shadow-[0_0_14px_rgba(6,182,212,0.85)]",
    activeBorder: "border-cyan-500/60",
    activeBg: "bg-cyan-500/15",
  },
];

export function Panel2SentimentFlows({
  asset,
  sentimentFlows,
  sentimentState,
  sourceLabel,
}: Panel2Props) {
  const trafficBadgeVariant =
    sentimentState.trafficColor === "red"
      ? "bear"
      : sentimentState.trafficColor === "amber"
      ? "warn"
      : sentimentState.trafficColor === "emerald"
      ? "bull"
      : "cyan";

  return (
    <Card>
      <CardHeader
        icon={<Flame className="h-4 w-4 text-amber-400" />}
        title="Panel 2 · Sentimiento y Presión de Venta"
        subtitle="SOPR STH, Exchange Inflows/Outflows, Coinbase Premium Index (CPI) y semáforo de régimen"
        badge={<Badge variant="accent">Fuente: {sourceLabel}</Badge>}
        actions={
          <Badge variant={trafficBadgeVariant} pulse>
            <GaugeCircle className="h-3 w-3" />
            {sentimentState.shortLabel} · {sentimentState.convictionScore}%
          </Badge>
        }
      />

      <CardBody className="space-y-5">
        {/* Traffic-light Regime Banner */}
        <div className="rounded-xl border border-terminal-border bg-terminal-bg/75 p-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Left: 4-state Traffic Light Matrix */}
            <div className="space-y-2 lg:col-span-7">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Indicador Semafórico de Estado de Mercado
                </span>
                <span className="font-mono text-[11px] text-slate-400">
                  Convicción: {sentimentState.convictionScore}/100
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {REGIME_CATALOG.map((item) => {
                  const isActive = item.id === sentimentState.regime;
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-start gap-2.5 rounded-lg border px-3 py-2.5 transition",
                        isActive
                          ? `${item.activeBorder} ${item.activeBg}`
                          : "border-terminal-border/70 bg-terminal-surface/40 opacity-55"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-1 h-3 w-3 shrink-0 rounded-full",
                          isActive ? item.lightColor : "bg-slate-700"
                        )}
                      />
                      <div>
                        <div
                          className={cn(
                            "text-xs font-semibold",
                            isActive ? "text-slate-100" : "text-slate-400"
                          )}
                        >
                          {item.title}
                        </div>
                        <p className="mt-0.5 text-[11px] leading-snug text-slate-400">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Live Diagnostic Breakdown of the 3 Sub-signals */}
            <div className="flex flex-col justify-between rounded-lg border border-terminal-border/80 bg-terminal-surface/65 p-3.5 lg:col-span-5">
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  Diagnóstico Actual: {sentimentState.label}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  {sentimentState.description}
                </p>
              </div>
              <div className="mt-3 space-y-2 border-t border-terminal-border/70 pt-3">
                {sentimentState.signals.map((sig) => (
                  <div
                    key={sig.key}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-medium text-slate-300">{sig.label}</span>
                      <span className="ml-2 text-[11px] text-slate-500">
                        {sig.detail}
                      </span>
                    </div>
                    <Badge
                      variant={
                        sig.status === "danger"
                          ? "bear"
                          : sig.status === "bull"
                          ? "bull"
                          : sig.status === "warn"
                          ? "warn"
                          : "cyan"
                      }
                      className="font-mono tabular-nums"
                    >
                      {sig.valueFormatted}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Combined Charts Row */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {/* Chart A: SOPR STH + Coinbase Premium Index (CPI) */}
          <div className="rounded-xl border border-terminal-border/80 bg-terminal-bg/65 p-3.5">
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  SOPR STH &amp; Coinbase Premium Index (CPI)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Ratio de beneficio gastado STH (línea) vs. prima institucional US (barras)
                </p>
              </div>
            </div>

            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={sentimentFlows}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid stroke="#1b2638" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={{ stroke: "#1f2a3d" }}
                    tickLine={false}
                    minTickGap={24}
                  />
                  <YAxis
                    yAxisId="sopr"
                    domain={["auto", "auto"]}
                    tick={{ fill: "#38bdf8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={46}
                  />
                  <YAxis
                    yAxisId="cpi"
                    orientation="right"
                    tickFormatter={(v: number) => `${v}%`}
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={46}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0b1220",
                      border: "1px solid #26344a",
                      borderRadius: "10px",
                      fontSize: "12px",
                    }}
                    formatter={(val, name) => {
                      const num = Number(val ?? 0);
                      if (String(name).includes("CPI")) {
                        return [formatPct(num, true, 3), "Coinbase Premium (CPI)"];
                      }
                      return [formatRatio(num, 4), "SOPR STH"];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <ReferenceLine
                    yAxisId="sopr"
                    y={1.0}
                    stroke="#64748b"
                    strokeDasharray="3 3"
                  />
                  <Bar
                    yAxisId="cpi"
                    dataKey="cpi"
                    name="CPI (%)"
                    barSize={10}
                    radius={[2, 2, 0, 0]}
                    shape={(props) => {
                      const pt = (props as { payload?: SentimentFlowPoint }).payload;
                      const fill = (pt?.cpi ?? 0) >= 0 ? "#10b981" : "#f43f5e";
                      return (
                        <Rectangle
                          x={props.x}
                          y={props.y}
                          width={props.width}
                          height={props.height}
                          radius={[2, 2, 0, 0]}
                          fill={fill}
                          fillOpacity={0.65}
                        />
                      );
                    }}
                  />
                  <Line
                    yAxisId="sopr"
                    type="monotone"
                    dataKey="soprSth"
                    name="SOPR STH"
                    stroke="#38bdf8"
                    strokeWidth={2.2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart B: Exchange Inflows, Outflows & Netflow */}
          <div className="rounded-xl border border-terminal-border/80 bg-terminal-bg/65 p-3.5">
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Exchange Inflows, Outflows &amp; Volumen Neto ({asset})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Entradas a exchanges (presión vendedora) vs. salidas hacia autocustodia
                </p>
              </div>
            </div>

            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={sentimentFlows}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid stroke="#1b2638" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={{ stroke: "#1f2a3d" }}
                    tickLine={false}
                    minTickGap={24}
                  />
                  <YAxis
                    tickFormatter={(v: number) => formatCompactNumber(v, 0)}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={54}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0b1220",
                      border: "1px solid #26344a",
                      borderRadius: "10px",
                      fontSize: "12px",
                    }}
                    formatter={(val, name) => [
                      `${formatCompactNumber(Number(val ?? 0), 1)} ${asset}`,
                      String(name),
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <ReferenceLine y={0} stroke="#475569" />
                  <Bar
                    dataKey="exchangeInflows"
                    name="Exchange Inflows"
                    fill="#f43f5e"
                    fillOpacity={0.55}
                    barSize={8}
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar
                    dataKey="exchangeOutflows"
                    name="Exchange Outflows"
                    fill="#10b981"
                    fillOpacity={0.55}
                    barSize={8}
                    radius={[2, 2, 0, 0]}
                  />
                  <Area
                    type="monotone"
                    dataKey="exchangeNetflow"
                    name="Flujo Neto (In - Out)"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.14}
                    strokeWidth={2}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
