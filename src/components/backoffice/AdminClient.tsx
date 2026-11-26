"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRightLeft,
  CheckCircle2,
  Database,
  RotateCcw,
  Shield,
  Sliders,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Tabs, type TabOption } from "@/components/ui/Tabs";
import type {
  MetricMappingConfig,
  ProviderConfig,
  RuleThresholdsConfig,
  SystemConfig,
  WebhookDestination,
} from "@/lib/types/onchain";
import { MetricMappingTable } from "./MetricMappingTable";
import { ProvidersManager } from "./ProvidersManager";
import { RuleEngineConfig } from "./RuleEngineConfig";

export type AdminTab = "providers" | "mapping" | "rules";

interface AdminClientProps {
  initialConfig: SystemConfig;
  initialTab?: AdminTab;
}

export function AdminClient({
  initialConfig,
  initialTab = "providers",
}: AdminClientProps) {
  const [config, setConfig] = useState<SystemConfig>(initialConfig);
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [toast, setToast] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const persistPartialConfig = async (
    patch: Partial<SystemConfig>,
    successMsg: string
  ) => {
    const res = await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const updated = (await res.json()) as SystemConfig;
      setConfig(updated);
      showToast(successMsg);
    }
  };

  const handleSaveProviders = async (providers: ProviderConfig[]) => {
    await persistPartialConfig(
      { providers },
      "Configuración de proveedores guardada correctamente."
    );
  };

  const handleSaveMappings = async (metricMappings: MetricMappingConfig[]) => {
    await persistPartialConfig(
      { metricMappings },
      "Mapeo de métricas actualizado. El dashboard consumirá las nuevas fuentes."
    );
  };

  const handleSaveRulesAndWebhooks = async (
    ruleThresholds: RuleThresholdsConfig,
    webhooks: WebhookDestination[]
  ) => {
    await persistPartialConfig(
      { ruleThresholds, webhooks },
      "Umbrales del motor de reglas y destinos Webhook actualizados."
    );
  };

  const handleResetDefaults = async () => {
    setResetting(true);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      if (res.ok) {
        const fresh = (await res.json()) as SystemConfig;
        setConfig(fresh);
        showToast("Configuración restaurada a los valores por defecto.");
      }
    } finally {
      setResetting(false);
    }
  };

  const tabs: TabOption<AdminTab>[] = [
    {
      id: "providers",
      label: "Proveedores de Datos",
      icon: <Database className="h-3.5 w-3.5" />,
      count: config.providers.length,
    },
    {
      id: "mapping",
      label: "Mapeo de Métricas",
      icon: <ArrowRightLeft className="h-3.5 w-3.5" />,
      count: config.metricMappings.length,
    },
    {
      id: "rules",
      label: "Umbrales y Alertas",
      icon: <Sliders className="h-3.5 w-3.5" />,
      count: config.webhooks.filter((w) => w.enabled).length,
    },
  ];

  return (
    <div className="min-h-screen bg-terminal-bg bg-terminal-grid">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-30 border-b border-terminal-border bg-terminal-bg/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1560px] flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-terminal-border bg-terminal-surface px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-sky-500/50 hover:text-sky-200"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver al Dashboard
            </Link>
            <div className="h-5 w-px bg-terminal-border" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-slate-100 sm:text-base">
                  Back Office · Configuración Onchain
                </h1>
                <Badge variant="accent">
                  <Shield className="h-3 w-3" />
                  Admin Console
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400">
                Última actualización:{" "}
                <span className="font-mono text-slate-300">
                  {new Date(config.updatedAt).toLocaleString("es-ES")}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={resetting}
            onClick={() => void handleResetDefaults()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-terminal-border bg-terminal-surface px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-amber-500/50 hover:text-amber-200 disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {resetting ? "Restaurando..." : "Restaurar Defaults"}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[1560px] space-y-5 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs options={tabs} value={activeTab} onChange={setActiveTab} />

          {toast && (
            <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-200 shadow-glowGreen">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>{toast}</span>
            </div>
          )}
        </div>

        {activeTab === "providers" && (
          <ProvidersManager
            providers={config.providers}
            onSaveProviders={handleSaveProviders}
          />
        )}

        {activeTab === "mapping" && (
          <MetricMappingTable
            key={config.updatedAt}
            mappings={config.metricMappings}
            providers={config.providers}
            onSaveMappings={handleSaveMappings}
          />
        )}

        {activeTab === "rules" && (
          <RuleEngineConfig
            key={config.updatedAt}
            ruleThresholds={config.ruleThresholds}
            webhooks={config.webhooks}
            onSaveRulesAndWebhooks={handleSaveRulesAndWebhooks}
          />
        )}
      </main>
    </div>
  );
}
