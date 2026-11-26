"use client";

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Flame,
  Gauge,
  ShieldCheck,
} from "lucide-react";
import type {
  AssetSymbol,
  DashboardKpiSummary,
  OnchainAlert,
} from "@/lib/types/onchain";
import {
  cn,
  formatCompactNumber,
  formatCurrency,
  formatPct,
  formatRatio,
} from "@/lib/utils";

interface KpiStripProps {
  asset: AssetSymbol;
  kpis: DashboardKpiSummary;
  alerts: OnchainAlert[];
}

export function KpiStrip({ asset, kpis, alerts }: KpiStripProps) {
  const criticalCount = alerts.filter((a) => a.severity === "CRITICAL").length;

  const cards = [
    {
      label: `Precio Spot ${asset}`,
      value: formatCurrency(kpis.price),
      sub: formatPct(kpis.priceChangePct),
      positive: kpis.priceChangePct >= 0,
      icon:
        kpis.priceChangePct >= 0 ? (
          <ArrowUpRight className="h-4 w-4 text-emerald-400" />
        ) : (
          <ArrowDownRight className="h-4 w-4 text-rose-400" />
        ),
      tone: kpis.priceChangePct >= 0 ? "text-emerald-400" : "text-rose-400",
    },
    {
      label: "Realized Price STH",
      value: formatCurrency(kpis.rpSth),
      sub: `Spread ${formatPct(kpis.rpSthSpreadPct)}`,
      positive: kpis.rpSthSpreadPct >= 0,
      icon: <ShieldCheck className="h-4 w-4 text-amber-400" />,
      tone:
        Math.abs(kpis.rpSthSpreadPct) <= 2.5
          ? "text-amber-300"
          : kpis.rpSthSpreadPct > 0
          ? "text-emerald-400"
          : "text-rose-400",
    },
    {
      label: "MVRV STH",
      value: formatRatio(kpis.mvrvSth, 3),
      sub:
        kpis.mvrvSth >= 1.35
          ? "Zona Resistencia (>1.35)"
          : kpis.mvrvSth < 1
          ? "STH en Pérdida (<1.0)"
          : "Expansión Controlada",
      icon: <Gauge className="h-4 w-4 text-sky-400" />,
      tone:
        kpis.mvrvSth >= 1.35
          ? "text-rose-400"
          : kpis.mvrvSth < 1
          ? "text-cyan-300"
          : "text-emerald-400",
    },
    {
      label: "SOPR STH / CPI",
      value: formatRatio(kpis.soprSth, 4),
      sub: `CPI ${formatPct(kpis.cpi, true, 3)}`,
      icon: <Flame className="h-4 w-4 text-violet-400" />,
      tone:
        kpis.soprSth > 1.08
          ? "text-rose-400"
          : kpis.soprSth >= 1
          ? "text-emerald-400"
          : "text-cyan-300",
    },
    {
      label: "Flujo Neto CEX / Reservas",
      value: `${kpis.exchangeNetflow24h > 0 ? "+" : ""}${formatCompactNumber(
        kpis.exchangeNetflow24h,
        1
      )} ${asset}`,
      sub: `CEX: ${formatCompactNumber(kpis.cexReserves, 2)} (${formatPct(
        kpis.cexReservesDeltaPct
      )})`,
      icon: <Activity className="h-4 w-4 text-cyan-400" />,
      tone: kpis.exchangeNetflow24h <= 0 ? "text-emerald-400" : "text-rose-400",
    },
    {
      label: "NUPL Macro / Alertas",
      value: formatRatio(kpis.nupl, 3),
      sub:
        criticalCount > 0
          ? `${criticalCount} crítica${criticalCount > 1 ? "s" : ""} · ${alerts.length} total`
          : `${alerts.length} señal${alerts.length === 1 ? "" : "es"} activa${alerts.length === 1 ? "" : "s"}`,
      icon: (
        <AlertTriangle
          className={cn(
            "h-4 w-4",
            criticalCount > 0 ? "text-rose-400" : "text-emerald-400"
          )}
        />
      ),
      tone: criticalCount > 0 ? "text-rose-400" : "text-sky-300",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-terminal-border bg-terminal-surface/95 px-4 py-3 shadow-terminal transition hover:border-slate-700"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              {card.label}
            </span>
            {card.icon}
          </div>
          <div className="mt-1.5 font-mono text-lg font-bold tracking-tight text-slate-100 tabular-nums">
            {card.value}
          </div>
          <div className={cn("mt-0.5 font-mono text-[11px] tabular-nums", card.tone)}>
            {card.sub}
          </div>
        </div>
      ))}
    </div>
  );
}
