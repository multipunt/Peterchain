"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Area,
  CartesianGrid,
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
import {
  AlertOctagon,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Compass,
  Info,
  Send,
  Sliders,
} from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import type {
  AlertSeverity,
  MacroCyclePoint,
  OnchainAlert,
} from "@/lib/types/onchain";
import { cn, formatRatio } from "@/lib/utils";

interface Panel4Props {
  macroCycle: MacroCyclePoint[];
  alerts: OnchainAlert[];
  sourceLabel: string;
}

const SEVERITY_CONFIG: Record<
  AlertSeverity,
  {
    variant: BadgeVariant;
    label: string;
    borderClass: string;
    bgClass: string;
    icon: ReactNode;
  }
> = {
  CRITICAL: {
    variant: "bear",
    label: "CRÍTICA",
    borderClass: "border-rose-500/45",
    bgClass: "bg-rose-500/[0.08]",
    icon: <AlertOctagon className="h-4 w-4 text-rose-400" />,
  },
  WARNING: {
    variant: "warn",
    label: "ADVERTENCIA",
    borderClass: "border-amber-500/45",
    bgClass: "bg-amber-500/[0.08]",
    icon: <AlertTriangle className="h-4 w-4 text-amber-400" />,
  },
  BULLISH: {
    variant: "bull",
    label: "ALCISTA",
    borderClass: "border-emerald-500/45",
    bgClass: "bg-emerald-500/[0.08]",
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  },
  INFO: {
    variant: "info",
    label: "INFO",
    borderClass: "border-sky-500/35",
    bgClass: "bg-sky-500/[0.06]",
    icon: <Info className="h-4 w-4 text-sky-400" />,
  },
};

export function Panel4MacroAlerts({
  macroCycle,
  alerts,
  sourceLabel,
}: Panel4Props) {
  const [severityFilter, setSeverityFilter] = useState<"ALL" | AlertSeverity>("ALL");
  const [acknowledgedIds, setAcknowledgedIds] = useState<Record<string, boolean>>({});

  const latestMacro = macroCycle[macroCycle.length - 1];

  const filteredAlerts =
    severityFilter === "ALL"
      ? alerts
      : alerts.filter((a) => a.severity === severityFilter);

  const toggleAck = (id: string) => {
    setAcknowledgedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Card>
      <CardHeader
        icon={<Compass className="h-4 w-4 text-emerald-400" />}
        title="Panel 4 · Ciclo Macro y Alertas en Tiempo Real"
        subtitle="Indicadores macro NUPL & SOPR LTH acoplados al motor de reglas y centro de notificaciones"
        badge={<Badge variant="bull">Fuente: {sourceLabel}</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Badge
              variant={
                latestMacro.nupl >= 0.72
                  ? "bear"
                  : latestMacro.nupl < 0
                  ? "cyan"
                  : "bull"
              }
            >
              Fase Macro: {latestMacro.macroPhase} ({formatRatio(latestMacro.nupl, 2)})
            </Badge>
            <Link
              href="/admin?tab=rules"
              className="inline-flex items-center gap-1 rounded-md border border-terminal-border bg-terminal-elevated px-2.5 py-1 text-[11px] font-medium text-slate-300 transition hover:border-sky-500/50 hover:text-sky-300"
            >
              <Sliders className="h-3 w-3" />
              Calibrar Reglas
            </Link>
          </div>
        }
      />

      <CardBody>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          {/* Left: Macro Chart (NUPL + SOPR LTH) */}
          <div className="rounded-xl border border-terminal-border/80 bg-terminal-bg/65 p-3.5 xl:col-span-7">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  NUPL (Net Unrealized Profit/Loss) &amp; SOPR LTH
                </h3>
                <p className="text-[11px] text-slate-500">
                  Bandas históricas de ciclo: Capitulación (&lt;0), Optimismo (0.25–0.50), Creencia (0.50–0.72), Euforia (&gt;0.72)
                </p>
              </div>
              <span className="font-mono text-xs text-violet-300 tabular-nums">
                SOPR LTH: {formatRatio(latestMacro.soprLth, 3)}
              </span>
            </div>

            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={macroCycle}
                  margin={{ top: 8, right: 10, left: 0, bottom: 0 }}
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
                    yAxisId="nupl"
                    domain={[-0.25, 0.9]}
                    tick={{ fill: "#10b981", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={42}
                  />
                  <YAxis
                    yAxisId="soprLth"
                    orientation="right"
                    domain={[0.6, 3.2]}
                    tick={{ fill: "#a78bfa", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={42}
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

                  {/* Macro NUPL shaded bands */}
                  <ReferenceArea yAxisId="nupl" y1={0.72} y2={0.9} fill="#f43f5e" fillOpacity={0.14} />
                  <ReferenceArea yAxisId="nupl" y1={0.5} y2={0.72} fill="#10b981" fillOpacity={0.07} />
                  <ReferenceArea yAxisId="nupl" y1={-0.25} y2={0} fill="#06b6d4" fillOpacity={0.14} />

                  <ReferenceLine
                    yAxisId="nupl"
                    y={0.72}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    label={{
                      value: "Euforia (0.72)",
                      position: "insideTopLeft",
                      fill: "#fb7185",
                      fontSize: 10,
                    }}
                  />
                  <ReferenceLine
                    yAxisId="nupl"
                    y={0}
                    stroke="#06b6d4"
                    strokeDasharray="4 4"
                    label={{
                      value: "Capitulación (0.0)",
                      position: "insideBottomLeft",
                      fill: "#22d3ee",
                      fontSize: 10,
                    }}
                  />

                  <Area
                    yAxisId="nupl"
                    type="monotone"
                    dataKey="nupl"
                    name="NUPL"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.2}
                    strokeWidth={2.2}
                  />
                  <Line
                    yAxisId="soprLth"
                    type="monotone"
                    dataKey="soprLth"
                    name="SOPR LTH"
                    stroke="#a78bfa"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right: Live Notification / Alert Feed */}
          <div className="flex flex-col rounded-xl border border-terminal-border/80 bg-terminal-bg/65 p-3.5 xl:col-span-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-sky-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  Centro de Alertas · Live Feed
                </h3>
                <Badge variant="info" className="font-mono">
                  {filteredAlerts.length}
                </Badge>
              </div>

              <div className="flex items-center gap-1 text-[11px]">
                {(["ALL", "CRITICAL", "WARNING", "BULLISH"] as const).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverityFilter(sev)}
                    className={cn(
                      "rounded px-2 py-0.5 transition",
                      severityFilter === sev
                        ? "bg-sky-500/25 text-sky-200"
                        : "text-slate-400 hover:bg-terminal-hover hover:text-slate-200"
                    )}
                  >
                    {sev === "ALL"
                      ? "Todas"
                      : sev === "CRITICAL"
                      ? "Críticas"
                      : sev === "WARNING"
                      ? "Avisos"
                      : "Alcistas"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 space-y-2.5 overflow-y-auto pr-1" style={{ maxHeight: "345px" }}>
              {filteredAlerts.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-terminal-border text-center text-xs text-slate-400">
                  No hay alertas activas para el filtro seleccionado.
                </div>
              ) : (
                filteredAlerts.map((alert) => {
                  const style = SEVERITY_CONFIG[alert.severity];
                  const isAck = Boolean(acknowledgedIds[alert.id]);
                  const timeStr = new Date(alert.timestamp).toLocaleTimeString(
                    "es-ES",
                    { hour: "2-digit", minute: "2-digit" }
                  );

                  return (
                    <article
                      key={alert.id}
                      className={cn(
                        "rounded-xl border p-3 transition",
                        style.borderClass,
                        style.bgClass,
                        isAck && "opacity-55"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 shrink-0">{style.icon}</div>
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h4 className="text-xs font-semibold text-slate-100">
                                {alert.title}
                              </h4>
                              <Badge variant={style.variant}>{style.label}</Badge>
                            </div>
                            <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                              {alert.message}
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 font-mono text-[10px] text-slate-500">
                          {timeStr}
                        </span>
                      </div>

                      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-2 text-[10px]">
                        <div className="flex flex-wrap items-center gap-2 font-mono text-slate-400">
                          <span className="rounded bg-terminal-bg/80 px-1.5 py-0.5 text-slate-200">
                            Valor: {alert.currentValue}
                          </span>
                          <span>Umbral: {alert.thresholdValue}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleAck(alert.id)}
                          className="rounded border border-terminal-border bg-terminal-bg/70 px-2 py-0.5 text-[10px] font-medium text-slate-300 transition hover:border-sky-500/50 hover:text-sky-200"
                        >
                          {isAck ? "Reabrir" : "Marcar vista"}
                        </button>
                      </div>

                      {alert.dispatchedWebhooks.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                          <Send className="h-2.5 w-2.5 text-sky-400" />
                          <span>Webhook:</span>
                          {alert.dispatchedWebhooks.map((wh) => (
                            <span
                              key={wh}
                              className="rounded bg-sky-500/10 px-1.5 py-0.5 text-sky-300"
                            >
                              {wh}
                            </span>
                          ))}
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
