"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Play,
  Plus,
  Radio,
  Save,
  Settings2,
  Trash2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import type {
  PollingInterval,
  ProviderConfig,
  ProviderStatus,
  ProviderTestResult,
} from "@/lib/types/onchain";
import { cn } from "@/lib/utils";

interface ProvidersManagerProps {
  providers: ProviderConfig[];
  onSaveProviders: (nextProviders: ProviderConfig[]) => Promise<void>;
}

const STATUS_BADGE: Record<
  ProviderStatus,
  { label: string; variant: "bull" | "warn" | "neutral" }
> = {
  active: { label: "Activo", variant: "bull" },
  mock: { label: "Mock Mode", variant: "warn" },
  inactive: { label: "Inactivo", variant: "neutral" },
};

export function ProvidersManager({
  providers,
  onSaveProviders,
}: ProvidersManagerProps) {
  const [editing, setEditing] = useState<ProviderConfig | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleTestConnection = async (provider: ProviderConfig) => {
    setTestingId(provider.id);
    try {
      const res = await fetch("/api/providers/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      if (res.ok) {
        const result = (await res.json()) as ProviderTestResult;
        const nextList = providers.map((p) =>
          p.id === provider.id
            ? {
                ...provider,
                lastTestedAt: result.timestamp,
                lastTestResult: result,
              }
            : p
        );
        await onSaveProviders(nextList);
        if (editing && editing.id === provider.id) {
          setEditing({
            ...provider,
            lastTestedAt: result.timestamp,
            lastTestResult: result,
          });
        }
      }
    } finally {
      setTestingId(null);
    }
  };

  const handleQuickStatusChange = async (
    providerId: ProviderConfig["id"],
    nextStatus: ProviderStatus
  ) => {
    const nextList = providers.map((p) =>
      p.id === providerId ? { ...p, status: nextStatus } : p
    );
    await onSaveProviders(nextList);
  };

  const handleModalSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const cleanedHeaders = editing.customHeaders.filter(
        (h) => h.key.trim().length > 0
      );
      const updatedProvider: ProviderConfig = {
        ...editing,
        customHeaders: cleanedHeaders,
      };
      const nextList = providers.map((p) =>
        p.id === updatedProvider.id ? updatedProvider : p
      );
      await onSaveProviders(nextList);
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-100">
            Gestor de Proveedores de Datos (IOnchainDataProvider)
          </h2>
          <p className="text-xs text-slate-400">
            Configura credenciales, endpoints base, cabeceras personalizadas y polling para cada adaptador conectado al sistema.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Badge variant="bull">
            {providers.filter((p) => p.status === "active").length} Activos
          </Badge>
          <Badge variant="warn">
            {providers.filter((p) => p.status === "mock").length} Mock Mode
          </Badge>
          <Badge variant="neutral">
            {providers.filter((p) => p.status === "inactive").length} Inactivos
          </Badge>
        </div>
      </div>

      {/* Provider Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {providers.map((provider) => {
          const st = STATUS_BADGE[provider.status];
          const isTesting = testingId === provider.id;

          return (
            <Card key={provider.id} className="flex flex-col justify-between">
              <CardBody className="flex flex-1 flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-terminal-border bg-terminal-elevated text-sky-400">
                        {provider.protocol === "WebSocket" ? (
                          <Radio className="h-4 w-4 text-violet-400" />
                        ) : (
                          <Globe className="h-4 w-4 text-sky-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-100">
                          {provider.name}
                        </h3>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                          {provider.protocol} · Polling {provider.pollingInterval} ·{" "}
                          {provider.rateLimitRpm} rpm
                        </span>
                      </div>
                    </div>
                    <Badge variant={st.variant} pulse={provider.status === "active"}>
                      {st.label}
                    </Badge>
                  </div>

                  <p className="text-xs leading-relaxed text-slate-400">
                    {provider.description}
                  </p>

                  {/* Endpoint & Credential summary */}
                  <div className="space-y-1.5 rounded-lg border border-terminal-border/80 bg-terminal-bg/75 p-2.5 font-mono text-[11px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500">Endpoint:</span>
                      <span className="truncate text-slate-300" title={provider.baseUrl}>
                        {provider.baseUrl}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500">API Key:</span>
                      <span
                        className={cn(
                          provider.apiKey ? "text-emerald-400" : "text-amber-400"
                        )}
                      >
                        {provider.apiKey
                          ? `••••${provider.apiKey.slice(-4)}`
                          : "No configurada (Sandbox)"}
                      </span>
                    </div>
                  </div>

                  {/* Quick Status Selector */}
                  <div className="flex items-center gap-1 rounded-lg border border-terminal-border bg-terminal-bg p-1 text-[11px]">
                    {(["active", "mock", "inactive"] as ProviderStatus[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => void handleQuickStatusChange(provider.id, s)}
                        className={cn(
                          "flex-1 rounded-md py-1 font-medium transition",
                          provider.status === s
                            ? s === "active"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : s === "mock"
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-slate-800 text-slate-200"
                            : "text-slate-500 hover:text-slate-300"
                        )}
                      >
                        {STATUS_BADGE[s].label}
                      </button>
                    ))}
                  </div>

                  {/* Last Test Result Pill */}
                  {provider.lastTestResult && (
                    <div
                      className={cn(
                        "rounded-lg border p-2.5 text-[11px]",
                        provider.lastTestResult.ok
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                          : "border-rose-500/30 bg-rose-500/10 text-rose-200"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 font-mono font-semibold">
                        <span className="flex items-center gap-1.5">
                          {provider.lastTestResult.ok ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-rose-400" />
                          )}
                          HTTP {provider.lastTestResult.httpStatus} ·{" "}
                          {provider.lastTestResult.latencyMs}ms
                        </span>
                        <span className="text-[10px] opacity-80">
                          Schema {provider.lastTestResult.schemaValid ? "OK" : "Error"}
                        </span>
                      </div>
                      <p className="mt-1 leading-snug opacity-90">
                        {provider.lastTestResult.message}
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 border-t border-terminal-border/70 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowKey(false);
                      setEditing(structuredClone(provider));
                    }}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-terminal-border bg-terminal-elevated px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-sky-500/50 hover:text-sky-200"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    Configurar
                  </button>
                  <button
                    type="button"
                    disabled={isTesting}
                    onClick={() => void handleTestConnection(provider)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/15 px-3 py-2 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/25 disabled:opacity-50"
                  >
                    <Play className="h-3.5 w-3.5" />
                    {isTesting ? "Probando..." : "Test Connection"}
                  </button>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Credentials & Advanced Config Modal */}
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing ? `Configurar Proveedor · ${editing.name}` : ""}
        subtitle="Define credenciales, endpoint base, webhook, cabeceras HTTP personalizadas y frecuencia de refresco."
        footer={
          editing && (
            <>
              <button
                type="button"
                onClick={() => void handleTestConnection(editing)}
                disabled={testingId === editing.id}
                className="mr-auto inline-flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/15 px-3.5 py-2 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/25"
              >
                <Play className="h-3.5 w-3.5" />
                {testingId === editing.id ? "Validando..." : "Test Connection"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg border border-terminal-border px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-terminal-elevated"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleModalSave()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? "Guardando..." : "Guardar Proveedor"}
              </button>
            </>
          )
        }
      >
        {editing && (
          <div className="space-y-4">
            {/* Status + Polling Interval */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Estado de Conexión
                </label>
                <select
                  value={editing.status}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      status: e.target.value as ProviderStatus,
                    })
                  }
                  className="w-full rounded-lg border border-terminal-border bg-terminal-bg px-3 py-2 text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
                >
                  <option value="active">Activo (Live)</option>
                  <option value="mock">Mock Mode (Sandbox)</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Intervalo de Polling
                </label>
                <select
                  value={editing.pollingInterval}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      pollingInterval: e.target.value as PollingInterval,
                    })
                  }
                  className="w-full rounded-lg border border-terminal-border bg-terminal-bg px-3 py-2 text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
                >
                  <option value="5m">Cada 5 minutos (Alta freq)</option>
                  <option value="1h">Cada 1 hora (Estándar)</option>
                  <option value="24h">Cada 24 horas (Macro)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Rate Limit (req/min)
                </label>
                <input
                  type="number"
                  min={1}
                  max={5000}
                  value={editing.rateLimitRpm}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      rateLimitRpm: Math.max(1, Number(e.target.value) || 60),
                    })
                  }
                  className="w-full rounded-lg border border-terminal-border bg-terminal-bg px-3 py-2 font-mono text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* API Key */}
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-300">
                <KeyRound className="h-3.5 w-3.5 text-sky-400" />
                API Key / Bearer Token
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={editing.apiKey}
                  placeholder="Introduce tu clave API (opcional en Mock Mode)"
                  onChange={(e) =>
                    setEditing({ ...editing, apiKey: e.target.value })
                  }
                  className="w-full rounded-lg border border-terminal-border bg-terminal-bg py-2 pl-3 pr-10 font-mono text-xs text-slate-100 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((prev) => !prev)}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200"
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Base URL & Webhook URL */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Endpoint Base ({editing.protocol})
                </label>
                <input
                  type="text"
                  value={editing.baseUrl}
                  onChange={(e) =>
                    setEditing({ ...editing, baseUrl: e.target.value })
                  }
                  className="w-full rounded-lg border border-terminal-border bg-terminal-bg px-3 py-2 font-mono text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Webhook URL (Opcional)
                </label>
                <input
                  type="text"
                  value={editing.webhookUrl}
                  placeholder="https://api.tu-app.com/webhooks/onchain"
                  onChange={(e) =>
                    setEditing({ ...editing, webhookUrl: e.target.value })
                  }
                  className="w-full rounded-lg border border-terminal-border bg-terminal-bg px-3 py-2 font-mono text-xs text-slate-100 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Custom Headers Editor */}
            <div className="space-y-2 rounded-xl border border-terminal-border bg-terminal-bg/60 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">
                  Cabeceras Personalizadas (HTTP Headers)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setEditing({
                      ...editing,
                      customHeaders: [
                        ...editing.customHeaders,
                        { key: "", value: "" },
                      ],
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-md border border-terminal-border bg-terminal-elevated px-2 py-1 text-[11px] text-sky-300 hover:border-sky-500/50"
                >
                  <Plus className="h-3 w-3" />
                  Añadir Header
                </button>
              </div>

              {editing.customHeaders.length === 0 ? (
                <p className="text-[11px] text-slate-500">
                  Sin cabeceras personalizadas configuradas.
                </p>
              ) : (
                <div className="space-y-2">
                  {editing.customHeaders.map((header, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Header Key (ej. X-API-KEY)"
                        value={header.key}
                        onChange={(e) => {
                          const next = [...editing.customHeaders];
                          next[idx] = { ...next[idx], key: e.target.value };
                          setEditing({ ...editing, customHeaders: next });
                        }}
                        className="w-1/2 rounded-md border border-terminal-border bg-terminal-surface px-2.5 py-1.5 font-mono text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Valor"
                        value={header.value}
                        onChange={(e) => {
                          const next = [...editing.customHeaders];
                          next[idx] = { ...next[idx], value: e.target.value };
                          setEditing({ ...editing, customHeaders: next });
                        }}
                        className="w-1/2 rounded-md border border-terminal-border bg-terminal-surface px-2.5 py-1.5 font-mono text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = editing.customHeaders.filter(
                            (_, i) => i !== idx
                          );
                          setEditing({ ...editing, customHeaders: next });
                        }}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-rose-500/15 hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live test feedback inside modal */}
            {editing.lastTestResult && (
              <div
                className={cn(
                  "rounded-lg border p-3 text-xs",
                  editing.lastTestResult.ok
                    ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-200"
                    : "border-rose-500/35 bg-rose-500/10 text-rose-200"
                )}
              >
                <div className="font-mono font-semibold">
                  Resultado Test: HTTP {editing.lastTestResult.httpStatus} ·{" "}
                  {editing.lastTestResult.latencyMs}ms · Schema{" "}
                  {editing.lastTestResult.schemaValid ? "Válido" : "Inválido"}
                </div>
                <p className="mt-1 text-[11px]">{editing.lastTestResult.message}</p>
                <div className="mt-1.5 font-mono text-[10px] opacity-80">
                  Endpoints verificados:{" "}
                  {editing.lastTestResult.checkedEndpoints.join(", ")}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
