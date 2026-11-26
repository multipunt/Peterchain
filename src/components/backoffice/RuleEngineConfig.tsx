"use client";

import { useState } from "react";
import {
  BellRing,
  CheckCircle2,
  Plus,
  Save,
  Send,
  Sliders,
  Trash2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Slider } from "@/components/ui/Slider";
import { Switch } from "@/components/ui/Switch";
import type {
  AlertSeverity,
  RuleThresholdsConfig,
  WebhookDestination,
  WebhookProviderType,
} from "@/lib/types/onchain";

interface RuleEngineConfigProps {
  ruleThresholds: RuleThresholdsConfig;
  webhooks: WebhookDestination[];
  onSaveRulesAndWebhooks: (
    nextThresholds: RuleThresholdsConfig,
    nextWebhooks: WebhookDestination[]
  ) => Promise<void>;
}

export function RuleEngineConfig({
  ruleThresholds,
  webhooks,
  onSaveRulesAndWebhooks,
}: RuleEngineConfigProps) {
  const [thresholds, setThresholds] =
    useState<RuleThresholdsConfig>(ruleThresholds);
  const [webhookList, setWebhookList] = useState<WebhookDestination[]>(webhooks);
  const [saving, setSaving] = useState(false);
  const [testingWhId, setTestingWhId] = useState<string | null>(null);
  const [whTestResults, setWhTestResults] = useState<
    Record<string, { ok: boolean; message: string }>
  >({});

  const toggleRule = (
    key: keyof RuleThresholdsConfig["enabledRules"],
    val: boolean
  ) => {
    setThresholds((prev) => ({
      ...prev,
      enabledRules: {
        ...prev.enabledRules,
        [key]: val,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveRulesAndWebhooks(thresholds, webhookList);
    } finally {
      setSaving(false);
    }
  };

  const handleAddWebhook = () => {
    const newWh: WebhookDestination = {
      id: `wh-${Date.now()}`,
      name: "Nuevo Webhook de Alertas",
      type: "discord",
      url: "https://discord.com/api/webhooks/...",
      channelOrChatId: "#onchain-signals",
      minSeverity: "WARNING",
      enabled: true,
    };
    setWebhookList((prev) => [...prev, newWh]);
  };

  const handleUpdateWebhook = (
    id: string,
    patch: Partial<WebhookDestination>
  ) => {
    setWebhookList((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...patch } : w))
    );
  };

  const handleDeleteWebhook = (id: string) => {
    setWebhookList((prev) => prev.filter((w) => w.id !== id));
  };

  const handleTestWebhook = async (webhook: WebhookDestination) => {
    setTestingWhId(webhook.id);
    try {
      const res = await fetch("/api/alerts/test-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhook }),
      });
      const data = (await res.json()) as { ok: boolean; message: string };
      setWhTestResults((prev) => ({
        ...prev,
        [webhook.id]: { ok: data.ok, message: data.message },
      }));
    } finally {
      setTestingWhId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Calibrated Threshold Sliders */}
      <Card>
        <CardHeader
          icon={<Sliders className="h-4 w-4 text-sky-400" />}
          title="Gestor de Umbrales y Disparadores Lógicos (Rule Engine)"
          subtitle="Calibra los niveles que disparan alertas automáticas en el Panel 4 y despachan eventos a tus Webhooks."
          actions={
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3.5 py-2 text-xs font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? "Guardando..." : "Guardar Reglas y Webhooks"}
            </button>
          }
        />

        <CardBody>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Rule 1: RP STH Proximity */}
            <div className="rounded-xl border border-terminal-border bg-terminal-bg/65 p-4">
              <div className="mb-3 flex items-center justify-between">
                <Badge variant="bull">Panel 1 · Soporte RP STH</Badge>
                <Switch
                  checked={thresholds.enabledRules.rpSthSupport}
                  onChange={(v) => toggleRule("rpSthSupport", v)}
                />
              </div>
              <Slider
                label="Umbral de proximidad al Realized Price STH"
                description="Dispara 'Soporte Confirmado en RP STH' cuando el precio cotiza dentro de este %."
                value={thresholds.rpSthProximityPct}
                min={0.5}
                max={10}
                step={0.5}
                unit="%"
                disabled={!thresholds.enabledRules.rpSthSupport}
                onChange={(v) =>
                  setThresholds({ ...thresholds, rpSthProximityPct: v })
                }
              />
            </div>

            {/* Rule 2: MVRV STH Overbought */}
            <div className="rounded-xl border border-terminal-border bg-terminal-bg/65 p-4">
              <div className="mb-3 flex items-center justify-between">
                <Badge variant="bear">Panel 1 · Resistencia MVRV STH</Badge>
                <Switch
                  checked={thresholds.enabledRules.mvrvSthResistance}
                  onChange={(v) => toggleRule("mvrvSthResistance", v)}
                />
              </div>
              <Slider
                label="Umbral crítico de MVRV STH (Sobrecompra)"
                description="Dispara 'Riesgo de Rechazo en Resistencia' por encima de este nivel."
                value={thresholds.mvrvSthOverbought}
                min={1.1}
                max={1.8}
                step={0.01}
                unit="x"
                disabled={!thresholds.enabledRules.mvrvSthResistance}
                onChange={(v) =>
                  setThresholds({ ...thresholds, mvrvSthOverbought: v })
                }
              />
            </div>

            {/* Rule 3: MVRV LTH Structural Floor */}
            <div className="rounded-xl border border-terminal-border bg-terminal-bg/65 p-4">
              <div className="mb-3 flex items-center justify-between">
                <Badge variant="cyan">Panel 1 · Suelo Estructural LTH</Badge>
                <Switch
                  checked={thresholds.enabledRules.mvrvLthFloor}
                  onChange={(v) => toggleRule("mvrvLthFloor", v)}
                />
              </div>
              <Slider
                label="Umbral de Suelo Estructural MVRV LTH (Osc.)"
                description="Alerta de capitulación histórica cuando MVRV LTH cae igual o por debajo de este valor."
                value={thresholds.mvrvLthFloor}
                min={-0.3}
                max={0.4}
                step={0.02}
                unit=""
                disabled={!thresholds.enabledRules.mvrvLthFloor}
                onChange={(v) =>
                  setThresholds({ ...thresholds, mvrvLthFloor: v })
                }
              />
            </div>

            {/* Rule 4: SOPR STH & CPI Peak */}
            <div className="rounded-xl border border-terminal-border bg-terminal-bg/65 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="warn">Panel 2 · Euforia SOPR &amp; CPI</Badge>
                <Switch
                  checked={thresholds.enabledRules.euphoriaRisk}
                  onChange={(v) => toggleRule("euphoriaRisk", v)}
                />
              </div>
              <Slider
                label="Umbral de pico de SOPR STH"
                description="Activa alerta de toma agresiva de beneficios STH."
                value={thresholds.soprSthPeak}
                min={1.01}
                max={1.25}
                step={0.01}
                unit="x"
                disabled={!thresholds.enabledRules.euphoriaRisk}
                onChange={(v) =>
                  setThresholds({ ...thresholds, soprSthPeak: v })
                }
              />
              <Slider
                label="Umbral de pico Coinbase Premium Index (CPI)"
                description="Marca prima institucional extrema en el semáforo de euforia."
                value={thresholds.cpiPeakPct}
                min={0.04}
                max={0.35}
                step={0.01}
                unit="%"
                disabled={!thresholds.enabledRules.euphoriaRisk}
                onChange={(v) =>
                  setThresholds({ ...thresholds, cpiPeakPct: v })
                }
              />
            </div>

            {/* Rule 5: CEX Massive Outflows */}
            <div className="rounded-xl border border-terminal-border bg-terminal-bg/65 p-4">
              <div className="mb-3 flex items-center justify-between">
                <Badge variant="bear">Panel 2 · Emergencia CEX</Badge>
                <Switch
                  checked={thresholds.enabledRules.cexMassiveOutflow}
                  onChange={(v) => toggleRule("cexMassiveOutflow", v)}
                />
              </div>
              <Slider
                label="Umbral de Retiradas Masivas de CEX (BTC eq.)"
                description="Dispara 'Alerta de Emergencia: Retiradas masivas de CEX' ante salidas netas anómalas."
                value={thresholds.cexMassiveOutflowThreshold}
                min={2000}
                max={35000}
                step={500}
                unit="BTC"
                disabled={!thresholds.enabledRules.cexMassiveOutflow}
                onChange={(v) =>
                  setThresholds({
                    ...thresholds,
                    cexMassiveOutflowThreshold: v,
                  })
                }
              />
            </div>

            {/* Rule 6 & 7: NUPL Macro & Whale Accumulation */}
            <div className="rounded-xl border border-terminal-border bg-terminal-bg/65 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="accent">Panel 3 y 4 · Ballenas y NUPL</Badge>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    NUPL
                    <Switch
                      checked={thresholds.enabledRules.nuplMacroZone}
                      onChange={(v) => toggleRule("nuplMacroZone", v)}
                    />
                  </span>
                  <span className="flex items-center gap-1.5">
                    Whales
                    <Switch
                      checked={thresholds.enabledRules.whaleAccumulation}
                      onChange={(v) => toggleRule("whaleAccumulation", v)}
                    />
                  </span>
                </div>
              </div>
              <Slider
                label="Umbral de Euforia Macro (NUPL)"
                description="Zona de distribución histórica de ciclo tardío."
                value={thresholds.nuplEuphoriaThreshold}
                min={0.5}
                max={0.85}
                step={0.01}
                unit=""
                disabled={!thresholds.enabledRules.nuplMacroZone}
                onChange={(v) =>
                  setThresholds({ ...thresholds, nuplEuphoriaThreshold: v })
                }
              />
              <Slider
                label="Umbral de Acumulación Fuerte de Ballenas (>1k BTC)"
                description="Score mínimo (0–1) para señalar acumulación institucional."
                value={thresholds.whaleAccumulationThreshold}
                min={0.5}
                max={0.95}
                step={0.01}
                unit=""
                disabled={!thresholds.enabledRules.whaleAccumulation}
                onChange={(v) =>
                  setThresholds({
                    ...thresholds,
                    whaleAccumulationThreshold: v,
                  })
                }
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Section 2: Webhook Notification Destinations */}
      <Card>
        <CardHeader
          icon={<BellRing className="h-4 w-4 text-amber-400" />}
          title="Destinos de Notificación (Webhooks Discord / Telegram / Slack)"
          subtitle="Configura canales externos para despacho automático de eventos del motor de reglas."
          actions={
            <button
              type="button"
              onClick={handleAddWebhook}
              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/15 px-3 py-1.5 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/25"
            >
              <Plus className="h-3.5 w-3.5" />
              Añadir Destino
            </button>
          }
        />

        <CardBody className="space-y-3">
          {webhookList.map((wh) => {
            const testResult = whTestResults[wh.id];
            return (
              <div
                key={wh.id}
                className="rounded-xl border border-terminal-border bg-terminal-bg/65 p-4 space-y-3"
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                  <div className="md:col-span-3">
                    <label className="mb-1 block text-[11px] text-slate-400">
                      Nombre del Canal
                    </label>
                    <input
                      type="text"
                      value={wh.name}
                      onChange={(e) =>
                        handleUpdateWebhook(wh.id, { name: e.target.value })
                      }
                      className="w-full rounded-md border border-terminal-border bg-terminal-surface px-2.5 py-1.5 text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[11px] text-slate-400">
                      Plataforma
                    </label>
                    <select
                      value={wh.type}
                      onChange={(e) =>
                        handleUpdateWebhook(wh.id, {
                          type: e.target.value as WebhookProviderType,
                        })
                      }
                      className="w-full rounded-md border border-terminal-border bg-terminal-surface px-2.5 py-1.5 text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
                    >
                      <option value="discord">Discord</option>
                      <option value="telegram">Telegram</option>
                      <option value="slack">Slack</option>
                      <option value="custom">Custom HTTP</option>
                    </select>
                  </div>

                  <div className="md:col-span-4">
                    <label className="mb-1 block text-[11px] text-slate-400">
                      Webhook URL
                    </label>
                    <input
                      type="text"
                      value={wh.url}
                      onChange={(e) =>
                        handleUpdateWebhook(wh.id, { url: e.target.value })
                      }
                      className="w-full rounded-md border border-terminal-border bg-terminal-surface px-2.5 py-1.5 font-mono text-[11px] text-slate-200 focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[11px] text-slate-400">
                      Severidad Mínima
                    </label>
                    <select
                      value={wh.minSeverity}
                      onChange={(e) =>
                        handleUpdateWebhook(wh.id, {
                          minSeverity: e.target.value as AlertSeverity,
                        })
                      }
                      className="w-full rounded-md border border-terminal-border bg-terminal-surface px-2.5 py-1.5 text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
                    >
                      <option value="INFO">INFO (Todas)</option>
                      <option value="BULLISH">BULLISH+</option>
                      <option value="WARNING">WARNING+</option>
                      <option value="CRITICAL">Solo CRITICAL</option>
                    </select>
                  </div>

                  <div className="flex items-end justify-between gap-2 md:col-span-1">
                    <Switch
                      checked={wh.enabled}
                      label={`Activar ${wh.name}`}
                      onChange={(v) => handleUpdateWebhook(wh.id, { enabled: v })}
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteWebhook(wh.id)}
                      title="Eliminar webhook"
                      className="rounded-md p-1.5 text-slate-400 hover:bg-rose-500/15 hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-terminal-border/60 pt-2.5">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>Canal / Chat ID:</span>
                    <input
                      type="text"
                      value={wh.channelOrChatId}
                      onChange={(e) =>
                        handleUpdateWebhook(wh.id, {
                          channelOrChatId: e.target.value,
                        })
                      }
                      className="w-40 rounded border border-terminal-border bg-terminal-surface px-2 py-0.5 font-mono text-[11px] text-slate-200 focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={testingWhId === wh.id}
                    onClick={() => void handleTestWebhook(wh)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-terminal-border bg-terminal-elevated px-2.5 py-1 text-[11px] font-medium text-sky-300 transition hover:border-sky-500/50 disabled:opacity-50"
                  >
                    <Send className="h-3 w-3" />
                    {testingWhId === wh.id ? "Enviando..." : "Enviar Prueba"}
                  </button>
                </div>

                {testResult && (
                  <div
                    className={
                      testResult.ok
                        ? "flex items-center gap-2 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-200"
                        : "flex items-center gap-2 rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-200"
                    }
                  >
                    {testResult.ok ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>
            );
          })}
        </CardBody>
      </Card>
    </div>
  );
}
