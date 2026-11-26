"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Layers, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import type {
  AssetSymbol,
  PriceStructurePoint,
  UrpdBucket,
} from "@/lib/types/onchain";
import { formatCompactNumber, formatCurrency, formatRatio } from "@/lib/utils";

interface Panel1Props {
  asset: AssetSymbol;
  priceStructure: PriceStructurePoint[];
  urpd: UrpdBucket[];
  sourceLabel: string;
}

export function Panel1PriceStructure({
  asset,
  priceStructure,
  urpd,
  sourceLabel,
}: Panel1Props) {
  const latest = priceStructure[priceStructure.length - 1];
  const strongestSupport = urpd
    .filter((b) => b.zone === "support")
    .sort((a, b) => b.volumeNative - a.volumeNative)[0];
  const strongestResistance = urpd
    .filter((b) => b.zone === "resistance")
    .sort((a, b) => b.volumeNative - a.volumeNative)[0];

  const mvrvSthMax = Math.max(
    1.55,
    ...priceStructure.map((p) => p.mvrvSth + 0.08)
  );
  const mvrvLthMin = Math.min(
    -0.35,
    ...priceStructure.map((p) => p.mvrvLth - 0.1)
  );
  const mvrvLthMax = Math.max(
    2.2,
    ...priceStructure.map((p) => p.mvrvLth + 0.15)
  );

  return (
    <Card>
      <CardHeader
        icon={<TrendingUp className="h-4 w-4" />}
        title="Panel 1 · Estructura de Precios y Niveles Clave"
        subtitle="Precio Spot vs. Realized Price STH/LTH, concentración de liquidez URPD y osciladores MVRV"
        badge={
          <Badge variant="info">
            Fuente: {sourceLabel}
          </Badge>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] tabular-nums">
            <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-300">
              RP STH: {formatCurrency(latest.rpSth)}
            </span>
            <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-300">
              RP LTH: {formatCurrency(latest.rpLth)}
            </span>
          </div>
        }
      />

      <CardBody className="space-y-5">
        {/* Top Row: Main Price + Realized Prices (8 cols) + Lateral URPD Histogram (4 cols) */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          {/* Main Price Overlay Chart */}
          <div className="rounded-xl border border-terminal-border/80 bg-terminal-bg/65 p-3.5 xl:col-span-8">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Precio {asset} vs. Realized Price STH &amp; LTH
                </h3>
                <p className="text-[11px] text-slate-500">
                  Bases de coste agregadas de tenedores de corto (&lt;155d) y largo plazo (&gt;155d)
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1.5 text-sky-300">
                  <span className="h-2 w-2 rounded-full bg-sky-400" />
                  Spot
                </span>
                <span className="flex items-center gap-1.5 text-amber-300">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  RP STH
                </span>
                <span className="flex items-center gap-1.5 text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  RP LTH
                </span>
              </div>
            </div>

            <div className="h-[310px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={priceStructure}
                  margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
                >
                  <CartesianGrid stroke="#1b2638" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={{ stroke: "#1f2a3d" }}
                    tickLine={false}
                    minTickGap={26}
                  />
                  <YAxis
                    tickFormatter={(v: number) => formatCurrency(v, true)}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    domain={["auto", "auto"]}
                    width={64}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0b1220",
                      border: "1px solid #26344a",
                      borderRadius: "10px",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "#94a3b8", marginBottom: 4 }}
                    formatter={(val, name) => [
                      formatCurrency(Number(val ?? 0)),
                      String(name),
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    name={`Precio ${asset}`}
                    stroke="#38bdf8"
                    strokeWidth={2.4}
                    dot={false}
                    activeDot={{ r: 4, fill: "#38bdf8" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rpSth"
                    name="Realized Price STH"
                    stroke="#f59e0b"
                    strokeWidth={1.8}
                    strokeDasharray="5 3"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="rpLth"
                    name="Realized Price LTH"
                    stroke="#10b981"
                    strokeWidth={1.8}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Lateral URPD Volume Profile / Heatmap */}
          <div className="rounded-xl border border-terminal-border/80 bg-terminal-bg/65 p-3.5 xl:col-span-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
                  <Layers className="h-3.5 w-3.5 text-violet-400" />
                  URPD · Perfil de Liquidez
                </h3>
                <p className="text-[11px] text-slate-500">
                  Distribución UTXO por precio realizado (STH vs LTH)
                </p>
              </div>
            </div>

            <div className="h-[255px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={urpd}
                  layout="vertical"
                  margin={{ top: 2, right: 10, left: 2, bottom: 2 }}
                  barCategoryGap={2}
                >
                  <CartesianGrid stroke="#1b2638" strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={(v: number) => `${v}%`}
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="priceLabel"
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={52}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0b1220",
                      border: "1px solid #26344a",
                      borderRadius: "10px",
                      fontSize: "11px",
                    }}
                    formatter={(val, _name, item) => {
                      const payload = item?.payload as UrpdBucket | undefined;
                      if (!payload) return [String(val), "URPD"];
                      return [
                        `${payload.sharePct}% (${formatCompactNumber(
                          payload.volumeNative,
                          1
                        )} ${asset})`,
                        payload.isCurrentPrice
                          ? "Zona Spot Actual"
                          : payload.zone === "support"
                          ? "Clúster Soporte"
                          : "Clúster Resistencia",
                      ];
                    }}
                  />
                  <Bar dataKey="sharePct" radius={[0, 4, 4, 0]}>
                    {urpd.map((entry) => (
                      <Cell
                        key={`urpd-${entry.priceBucket}`}
                        fill={
                          entry.isCurrentPrice
                            ? "#38bdf8"
                            : entry.zone === "support"
                            ? entry.sharePct > 8
                              ? "#10b981"
                              : "#0d9488"
                            : entry.sharePct > 7
                            ? "#f43f5e"
                            : "#f59e0b"
                        }
                        fillOpacity={entry.isCurrentPrice ? 1 : 0.82}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Key URPD Walls */}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-terminal-border/70 pt-2.5 text-[11px]">
              <div className="rounded-lg bg-emerald-500/10 px-2.5 py-1.5">
                <div className="text-[10px] uppercase text-emerald-400/90">
                  Muro Soporte URPD
                </div>
                <div className="font-mono font-semibold text-emerald-300 tabular-nums">
                  {strongestSupport
                    ? `${strongestSupport.priceLabel} (${strongestSupport.sharePct}%)`
                    : "N/A"}
                </div>
              </div>
              <div className="rounded-lg bg-rose-500/10 px-2.5 py-1.5">
                <div className="text-[10px] uppercase text-rose-400/90">
                  Techo Liquidez URPD
                </div>
                <div className="font-mono font-semibold text-rose-300 tabular-nums">
                  {strongestResistance
                    ? `${strongestResistance.priceLabel} (${strongestResistance.sharePct}%)`
                    : "N/A"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: MVRV STH & MVRV LTH Oscillator Subchart */}
        <div className="rounded-xl border border-terminal-border/80 bg-terminal-bg/65 p-3.5">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Oscilador MVRV STH &amp; MVRV LTH · Zonas Críticas
              </h3>
              <p className="text-[11px] text-slate-500">
                MVRV STH &gt; 1.35 marca resistencia/sobrecompra · MVRV LTH &lt; 0 marca zona de suelo estructural
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={latest.mvrvSth >= 1.35 ? "bear" : "warn"}>
                MVRV STH: {formatRatio(latest.mvrvSth, 3)}
              </Badge>
              <Badge variant={latest.mvrvLth <= 0 ? "bull" : "accent"}>
                MVRV LTH Osc: {formatRatio(latest.mvrvLth, 3)}
              </Badge>
            </div>
          </div>

          <div className="h-[225px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={priceStructure}
                margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid stroke="#1b2638" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={{ stroke: "#1f2a3d" }}
                  tickLine={false}
                  minTickGap={26}
                />
                <YAxis
                  yAxisId="sth"
                  domain={[0.7, Number(mvrvSthMax.toFixed(2))]}
                  tick={{ fill: "#f59e0b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                />
                <YAxis
                  yAxisId="lth"
                  orientation="right"
                  domain={[Number(mvrvLthMin.toFixed(2)), Number(mvrvLthMax.toFixed(2))]}
                  tick={{ fill: "#a78bfa", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
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
                <Legend wrapperStyle={{ fontSize: "11px" }} />

                {/* Overbought Danger Zone: MVRV STH > 1.35 */}
                <ReferenceArea
                  yAxisId="sth"
                  y1={1.35}
                  y2={mvrvSthMax}
                  fill="#f43f5e"
                  fillOpacity={0.14}
                />
                <ReferenceLine
                  yAxisId="sth"
                  y={1.35}
                  stroke="#f43f5e"
                  strokeDasharray="4 4"
                  label={{
                    value: "Resistencia STH (1.35)",
                    position: "insideTopLeft",
                    fill: "#fb7185",
                    fontSize: 10,
                  }}
                />
                <ReferenceLine
                  yAxisId="sth"
                  y={1.0}
                  stroke="#64748b"
                  strokeDasharray="2 3"
                />

                {/* Structural Floor Zone: MVRV LTH < 0 */}
                <ReferenceArea
                  yAxisId="lth"
                  y1={mvrvLthMin}
                  y2={0}
                  fill="#10b981"
                  fillOpacity={0.14}
                />
                <ReferenceLine
                  yAxisId="lth"
                  y={0}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  label={{
                    value: "Suelo Estructural LTH (< 0)",
                    position: "insideBottomRight",
                    fill: "#34d399",
                    fontSize: 10,
                  }}
                />

                <Line
                  yAxisId="sth"
                  type="monotone"
                  dataKey="mvrvSth"
                  name="MVRV STH"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="lth"
                  type="monotone"
                  dataKey="mvrvLth"
                  name="MVRV LTH (Osc.)"
                  stroke="#a78bfa"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
