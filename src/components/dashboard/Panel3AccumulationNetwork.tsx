"use client";

import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Network } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import type {
  AccumulationNetworkPoint,
  AssetSymbol,
} from "@/lib/types/onchain";
import { formatCompactNumber, formatRatio } from "@/lib/utils";

interface Panel3Props {
  asset: AssetSymbol;
  data: AccumulationNetworkPoint[];
  sourceLabel: string;
}

export function Panel3AccumulationNetwork({
  asset,
  data,
  sourceLabel,
}: Panel3Props) {
  const latest = data[data.length - 1];
  const matureShare =
    latest.ageBand_6m_1y + latest.ageBand_1y_2y + latest.ageBand_gt2y;
  const youngShare =
    latest.ageBand_lt1m + latest.ageBand_1m_3m + latest.ageBand_3m_6m;

  return (
    <Card>
      <CardHeader
        icon={<Network className="h-4 w-4 text-cyan-400" />}
        title="Panel 3 · Acumulación, Red y Dinámica de Monedas"
        subtitle="Whale Accumulation Trend (>1,000 BTC), UTXO Age Bands, Reservas CEX y Actividad de Red"
        badge={<Badge variant="cyan">Fuente: {sourceLabel}</Badge>}
        actions={
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] tabular-nums">
            <Badge variant={latest.whaleScore >= 0.7 ? "bull" : "warn"}>
              Whale Score: {formatRatio(latest.whaleScore, 2)}
            </Badge>
            <Badge variant="neutral">
              Maduras: {matureShare.toFixed(1)}% · Jóvenes: {youngShare.toFixed(1)}%
            </Badge>
          </div>
        }
      />

      <CardBody>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {/* 1. Whale Accumulation Trend (>1,000 BTC cohort) */}
          <div className="rounded-xl border border-terminal-border/80 bg-terminal-bg/65 p-3.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Whale Accumulation Trend (Cohortes &gt;1,000 {asset})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Índice 0.0 (distribución) a 1.0 (acumulación intensa de ballenas)
                </p>
              </div>
              <span className="font-mono text-xs font-semibold text-emerald-300 tabular-nums">
                {latest.whaleBalanceDelta >= 0 ? "+" : ""}
                {formatCompactNumber(latest.whaleBalanceDelta, 0)} {asset}/d
              </span>
            </div>

            <div className="h-[225px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={data}
                  margin={{ top: 6, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid stroke="#1b2638" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={{ stroke: "#1f2a3d" }}
                    tickLine={false}
                    minTickGap={24}
                  />
                  <YAxis
                    domain={[0, 1]}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0b1220",
                      border: "1px solid #26344a",
                      borderRadius: "10px",
                      fontSize: "12px",
                    }}
                    formatter={(val, name) => [formatRatio(Number(val ?? 0), 3), String(name)]}
                  />
                  <ReferenceLine y={0.75} stroke="#10b981" strokeDasharray="3 3" />
                  <ReferenceLine y={0.35} stroke="#f43f5e" strokeDasharray="3 3" />
                  <Bar dataKey="whaleScore" name="Whale Trend Score" radius={[3, 3, 0, 0]}>
                    {data.map((pt) => (
                      <Cell
                        key={`wh-${pt.timestamp}`}
                        fill={
                          pt.whaleScore >= 0.72
                            ? "#10b981"
                            : pt.whaleScore >= 0.45
                            ? "#38bdf8"
                            : "#f43f5e"
                        }
                        fillOpacity={0.78}
                      />
                    ))}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. UTXO Age Bands (Mature vs Young Coins) */}
          <div className="rounded-xl border border-terminal-border/80 bg-terminal-bg/65 p-3.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  UTXO Age Bands · Monedas Maduras vs. Jóvenes
                </h3>
                <p className="text-[11px] text-slate-500">
                  Distribución porcentual de la oferta circulante por antigüedad UTXO
                </p>
              </div>
            </div>

            <div className="h-[225px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data}
                  stackOffset="expand"
                  margin={{ top: 6, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid stroke="#1b2638" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={{ stroke: "#1f2a3d" }}
                    tickLine={false}
                    minTickGap={24}
                  />
                  <YAxis
                    tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0b1220",
                      border: "1px solid #26344a",
                      borderRadius: "10px",
                      fontSize: "11px",
                    }}
                    formatter={(val, name) => [`${Number(val ?? 0).toFixed(1)}%`, String(name)]}
                  />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                  <Area
                    type="monotone"
                    dataKey="ageBand_lt1m"
                    name="<1m (Joven)"
                    stackId="1"
                    stroke="#f43f5e"
                    fill="#f43f5e"
                    fillOpacity={0.75}
                  />
                  <Area
                    type="monotone"
                    dataKey="ageBand_1m_3m"
                    name="1m–3m"
                    stackId="1"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.7}
                  />
                  <Area
                    type="monotone"
                    dataKey="ageBand_3m_6m"
                    name="3m–6m"
                    stackId="1"
                    stroke="#eab308"
                    fill="#eab308"
                    fillOpacity={0.62}
                  />
                  <Area
                    type="monotone"
                    dataKey="ageBand_6m_1y"
                    name="6m–1y"
                    stackId="1"
                    stroke="#06b6d4"
                    fill="#06b6d4"
                    fillOpacity={0.65}
                  />
                  <Area
                    type="monotone"
                    dataKey="ageBand_1y_2y"
                    name="1y–2y"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.68}
                  />
                  <Area
                    type="monotone"
                    dataKey="ageBand_gt2y"
                    name=">2y (Madura)"
                    stackId="1"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.72}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Global CEX Reserves */}
          <div className="rounded-xl border border-terminal-border/80 bg-terminal-bg/65 p-3.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Reservas Globales en CEX ({asset})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Balance agregado en exchanges centralizados (shock de oferta líquida)
                </p>
              </div>
              <span className="font-mono text-xs font-semibold text-cyan-300 tabular-nums">
                {formatCompactNumber(latest.cexReserves, 2)} {asset}
              </span>
            </div>

            <div className="h-[225px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data}
                  margin={{ top: 6, right: 8, left: 4, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="cexReservesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1b2638" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={{ stroke: "#1f2a3d" }}
                    tickLine={false}
                    minTickGap={24}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tickFormatter={(v: number) => formatCompactNumber(v, 2)}
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={58}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0b1220",
                      border: "1px solid #26344a",
                      borderRadius: "10px",
                      fontSize: "12px",
                    }}
                    formatter={(val) => [
                      `${formatCompactNumber(Number(val ?? 0), 2)} ${asset}`,
                      "Reservas CEX",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="cexReserves"
                    name="Reservas CEX"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fill="url(#cexReservesGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4. Network Activity (Active Addresses & TX Volume) */}
          <div className="rounded-xl border border-terminal-border/80 bg-terminal-bg/65 p-3.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Actividad de Red · Direcciones Activas &amp; Volumen TX
                </h3>
                <p className="text-[11px] text-slate-500">
                  Tracción orgánica onchain (direcciones activas vs. volumen liquidado USD)
                </p>
              </div>
              <span className="font-mono text-xs text-slate-300 tabular-nums">
                {formatCompactNumber(latest.activeAddresses, 1)} addrs · $
                {latest.txVolumeUsdBillions.toFixed(1)}B
              </span>
            </div>

            <div className="h-[225px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={data}
                  margin={{ top: 6, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid stroke="#1b2638" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={{ stroke: "#1f2a3d" }}
                    tickLine={false}
                    minTickGap={24}
                  />
                  <YAxis
                    yAxisId="addrs"
                    tickFormatter={(v: number) => formatCompactNumber(v, 0)}
                    tick={{ fill: "#8b5cf6", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                  />
                  <YAxis
                    yAxisId="vol"
                    orientation="right"
                    tickFormatter={(v: number) => `$${v}B`}
                    tick={{ fill: "#38bdf8", fontSize: 10 }}
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
                      if (String(name).includes("Volumen")) {
                        return [`$${num.toFixed(2)}B`, String(name)];
                      }
                      return [formatCompactNumber(num, 1), String(name)];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar
                    yAxisId="addrs"
                    dataKey="activeAddresses"
                    name="Direcciones Activas"
                    fill="#8b5cf6"
                    fillOpacity={0.5}
                    barSize={9}
                    radius={[2, 2, 0, 0]}
                  />
                  <Line
                    yAxisId="vol"
                    type="monotone"
                    dataKey="txVolumeUsdBillions"
                    name="Volumen TX (USD B)"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={false}
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
