"use client";

import Link from "next/link";
import {
  Activity,
  Database,
  RefreshCw,
  Settings,
  SlidersHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type {
  AssetSymbol,
  MarketScenario,
  Timeframe,
} from "@/lib/types/onchain";
import { cn } from "@/lib/utils";

const ASSETS: { id: AssetSymbol; name: string }[] = [
  { id: "BTC", name: "Bitcoin" },
  { id: "ETH", name: "Ethereum" },
  { id: "SOL", name: "Solana" },
];

const TIMEFRAMES: { id: Timeframe; label: string }[] = [
  { id: "24h", label: "24h" },
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
  { id: "1y", label: "1y" },
  { id: "cycle", label: "Ciclo completo" },
];

const SCENARIOS: { id: MarketScenario; label: string }[] = [
  { id: "auto", label: "Live Sandbox (Auto)" },
  { id: "healthy_bull", label: "Sim: Alcista Saludable" },
  { id: "euphoria_top", label: "Sim: Punto de Euforia" },
  { id: "rp_sth_support", label: "Sim: Soporte en RP STH" },
  { id: "structural_floor", label: "Sim: Suelo Estructural" },
];

interface TopNavBarProps {
  asset: AssetSymbol;
  timeframe: Timeframe;
  scenario: MarketScenario;
  isSandboxMode: boolean;
  activeLiveProviders: number;
  loading: boolean;
  lastUpdated: string;
  onAssetChange: (asset: AssetSymbol) => void;
  onTimeframeChange: (tf: Timeframe) => void;
  onScenarioChange: (scenario: MarketScenario) => void;
  onRefresh: () => void;
}

export function TopNavBar({
  asset,
  timeframe,
  scenario,
  isSandboxMode,
  activeLiveProviders,
  loading,
  lastUpdated,
  onAssetChange,
  onTimeframeChange,
  onScenarioChange,
  onRefresh,
}: TopNavBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-terminal-border bg-terminal-bg/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1640px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-500/40 bg-sky-500/15 text-sky-400 shadow-glowBlue">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-slate-100 sm:text-base">
                PeterChain
              </span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-sky-400">
                ONCHAIN TERMINAL
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Inteligencia de mercado multipanel · Actualizado{" "}
              <span className="font-mono text-slate-300">{lastUpdated}</span>
            </p>
          </div>
        </div>

        {/* Center Controls: Asset + Timeframe */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Asset selector */}
          <div
            className="inline-flex items-center rounded-lg border border-terminal-border bg-terminal-surface p-0.5"
            aria-label="Selector de activo"
          >
            {ASSETS.map((item) => {
              const active = item.id === asset;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onAssetChange(item.id)}
                  className={cn(
                    "rounded-md px-2.5 py-1 font-mono text-xs font-semibold transition",
                    active
                      ? "bg-sky-500/25 text-sky-200 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.45)]"
                      : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  {item.id}
                </button>
              );
            })}
          </div>

          {/* Timeframe selector */}
          <div
            className="inline-flex items-center rounded-lg border border-terminal-border bg-terminal-surface p-0.5"
            aria-label="Selector temporal"
          >
            {TIMEFRAMES.map((tf) => {
              const active = tf.id === timeframe;
              return (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => onTimeframeChange(tf.id)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition",
                    active
                      ? "bg-slate-800 text-slate-100 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.3)]"
                      : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  {tf.label}
                </button>
              );
            })}
          </div>

          {/* Sandbox Scenario Simulator */}
          <div className="relative flex items-center">
            <SlidersHorizontal className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
            <select
              aria-label="Escenario de simulación Sandbox"
              value={scenario}
              onChange={(e) => onScenarioChange(e.target.value as MarketScenario)}
              className="rounded-lg border border-terminal-border bg-terminal-surface py-1.5 pl-8 pr-3 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
            >
              {SCENARIOS.map((sc) => (
                <option key={sc.id} value={sc.id} className="bg-terminal-surface">
                  {sc.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Controls: Provider Status + Refresh + Back Office */}
        <div className="flex items-center gap-2">
          <Badge variant={isSandboxMode ? "warn" : "bull"} pulse>
            <Database className="h-3 w-3" />
            {isSandboxMode
              ? "Sandbox / Mock Mode"
              : `${activeLiveProviders} Proveedor${activeLiveProviders > 1 ? "es" : ""} Activo${activeLiveProviders > 1 ? "s" : ""}`}
          </Badge>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            title="Recargar indicadores"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-terminal-border bg-terminal-surface text-slate-300 transition hover:border-sky-500/50 hover:text-sky-300 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </button>

          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/15 px-3 py-1.5 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/25"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Back Office</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
