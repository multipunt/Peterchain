"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Compass,
  Flame,
  LayoutGrid,
  Network,
  Server,
  TrendingUp,
} from "lucide-react";
import { Tabs, type TabOption } from "@/components/ui/Tabs";
import type {
  AssetSymbol,
  MarketScenario,
  Timeframe,
  UnifiedDashboardPayload,
} from "@/lib/types/onchain";
import { KpiStrip } from "./KpiStrip";
import { Panel1PriceStructure } from "./Panel1PriceStructure";
import { Panel2SentimentFlows } from "./Panel2SentimentFlows";
import { Panel3AccumulationNetwork } from "./Panel3AccumulationNetwork";
import { Panel4MacroAlerts } from "./Panel4MacroAlerts";
import { TopNavBar } from "./TopNavBar";

type ViewMode = "all" | "panel1" | "panel2" | "panel3" | "panel4";

interface DashboardClientProps {
  initialData: UnifiedDashboardPayload;
}

export function DashboardClient({ initialData }: DashboardClientProps) {
  const [data, setData] = useState<UnifiedDashboardPayload>(initialData);
  const [asset, setAsset] = useState<AssetSymbol>(initialData.asset);
  const [timeframe, setTimeframe] = useState<Timeframe>(initialData.timeframe);
  const [scenario, setScenario] = useState<MarketScenario>(initialData.scenario);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [loading, setLoading] = useState(false);

  const fetchDashboard = useCallback(
    async (
      nextAsset: AssetSymbol,
      nextTimeframe: Timeframe,
      nextScenario: MarketScenario
    ) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          asset: nextAsset,
          timeframe: nextTimeframe,
          scenario: nextScenario,
        });
        const res = await fetch(`/api/dashboard?${params.toString()}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const json = (await res.json()) as UnifiedDashboardPayload;
          setData(json);
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Sync automatically if user returns from /admin with modified rules/mappings
  useEffect(() => {
    const onFocus = () => {
      void fetchDashboard(asset, timeframe, scenario);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [asset, timeframe, scenario, fetchDashboard]);

  const handleAssetChange = (nextAsset: AssetSymbol) => {
    setAsset(nextAsset);
    void fetchDashboard(nextAsset, timeframe, scenario);
  };

  const handleTimeframeChange = (nextTf: Timeframe) => {
    setTimeframe(nextTf);
    void fetchDashboard(asset, nextTf, scenario);
  };

  const handleScenarioChange = (nextSc: MarketScenario) => {
    setScenario(nextSc);
    void fetchDashboard(asset, timeframe, nextSc);
  };

  const getPanelSourceLabel = (keys: string[]) => {
    const unique = Array.from(
      new Set(
        data.metricSources
          .filter((s) => keys.includes(s.metricKey))
          .map((s) =>
            s.effectiveMode === "live"
              ? s.providerName
              : `${s.providerName} (Mock)`
          )
      )
    );
    return unique.join(" + ") || "Sandbox Mock Engine";
  };

  const panelTabs: TabOption<ViewMode>[] = [
    {
      id: "all",
      label: "Vista Multipanel (4)",
      icon: <LayoutGrid className="h-3.5 w-3.5" />,
    },
    {
      id: "panel1",
      label: "1. Precios y Niveles",
      icon: <TrendingUp className="h-3.5 w-3.5" />,
    },
    {
      id: "panel2",
      label: "2. Sentimiento y Flujos",
      icon: <Flame className="h-3.5 w-3.5" />,
    },
    {
      id: "panel3",
      label: "3. Acumulación y Red",
      icon: <Network className="h-3.5 w-3.5" />,
    },
    {
      id: "panel4",
      label: "4. Macro y Alertas",
      icon: <Compass className="h-3.5 w-3.5" />,
      count: data.alerts.length,
    },
  ];

  const lastUpdatedStr = new Date(data.generatedAt).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="min-h-screen bg-terminal-bg bg-terminal-grid">
      <TopNavBar
        asset={asset}
        timeframe={timeframe}
        scenario={scenario}
        isSandboxMode={data.isSandboxMode}
        activeLiveProviders={data.activeLiveProviders}
        loading={loading}
        lastUpdated={lastUpdatedStr}
        onAssetChange={handleAssetChange}
        onTimeframeChange={handleTimeframeChange}
        onScenarioChange={handleScenarioChange}
        onRefresh={() => void fetchDashboard(asset, timeframe, scenario)}
      />

      <main className="mx-auto max-w-[1640px] space-y-5 px-4 py-5 sm:px-6">
        {/* Top KPI Strip */}
        <KpiStrip asset={asset} kpis={data.kpis} alerts={data.alerts} />

        {/* View Selector Tabs + Data Attribution Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs
            options={panelTabs}
            value={viewMode}
            onChange={setViewMode}
            size="sm"
          />

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
            <Server className="h-3.5 w-3.5 text-sky-400" />
            <span>Mapeo activo:</span>
            <span className="font-mono text-slate-300">
              PRECIO →{" "}
              {data.metricSources.find((m) => m.metricKey === "PRECIO")
                ?.providerName ?? "Mock"}
            </span>
            <span>·</span>
            <span className="font-mono text-slate-300">
              INFLOWS →{" "}
              {data.metricSources.find((m) => m.metricKey === "EXCHANGE_INFLOWS")
                ?.providerName ?? "Mock"}
            </span>
            <span>·</span>
            <span className="font-mono text-slate-300">
              CPI →{" "}
              {data.metricSources.find((m) => m.metricKey === "CPI")
                ?.providerName ?? "Mock"}
            </span>
            <Link
              href="/admin?tab=mapping"
              className="ml-1 text-sky-400 underline-offset-2 hover:underline"
            >
              Editar mapeo
            </Link>
          </div>
        </div>

        {/* 4 Modular Panels */}
        <div className="space-y-6">
          {(viewMode === "all" || viewMode === "panel1") && (
            <Panel1PriceStructure
              asset={asset}
              priceStructure={data.priceStructure}
              urpd={data.urpd}
              sourceLabel={getPanelSourceLabel([
                "PRECIO",
                "RP_STH",
                "RP_LTH",
                "URPD",
                "MVRV_STH",
              ])}
            />
          )}

          {(viewMode === "all" || viewMode === "panel2") && (
            <Panel2SentimentFlows
              asset={asset}
              sentimentFlows={data.sentimentFlows}
              sentimentState={data.sentimentState}
              sourceLabel={getPanelSourceLabel([
                "SOPR_STH",
                "EXCHANGE_INFLOWS",
                "CPI",
              ])}
            />
          )}

          {(viewMode === "all" || viewMode === "panel3") && (
            <Panel3AccumulationNetwork
              asset={asset}
              data={data.accumulationNetwork}
              sourceLabel={getPanelSourceLabel([
                "WHALE_ACCUMULATION",
                "UTXO_AGE_BANDS",
                "CEX_RESERVES",
              ])}
            />
          )}

          {(viewMode === "all" || viewMode === "panel4") && (
            <Panel4MacroAlerts
              macroCycle={data.macroCycle}
              alerts={data.alerts}
              sourceLabel={getPanelSourceLabel(["NUPL", "SOPR_LTH"])}
            />
          )}
        </div>
      </main>
    </div>
  );
}
