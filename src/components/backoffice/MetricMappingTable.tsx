"use client";

import { useState } from "react";
import { ArrowRightLeft, Save, Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Switch";
import type {
  MetricMappingConfig,
  ProviderConfig,
  ProviderId,
} from "@/lib/types/onchain";

const ENDPOINT_TEMPLATE_BY_PROVIDER: Record<ProviderId, string> = {
  mock: "internal://sandbox/metrics/",
  glassnode: "/v1/metrics/market/",
  cryptoquant: "/v1/btc/market-indicator/",
  coinglass: "/api/onchain/",
  intotheblock: "/v1/assets/btc/",
  custom_rest: "/api/v1/onchain/",
  custom_ws: "channel:onchain.",
};

interface MetricMappingTableProps {
  mappings: MetricMappingConfig[];
  providers: ProviderConfig[];
  onSaveMappings: (nextMappings: MetricMappingConfig[]) => Promise<void>;
}

export function MetricMappingTable({
  mappings,
  providers,
  onSaveMappings,
}: MetricMappingTableProps) {
  const [draft, setDraft] = useState<MetricMappingConfig[]>(mappings);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [saving, setSaving] = useState(false);

  const categories = [
    "ALL",
    "Precio y Niveles",
    "Sentimiento y Flujos",
    "Acumulación y Red",
    "Ciclo Macro",
  ];

  const filtered = draft.filter((row) => {
    const matchesCat =
      categoryFilter === "ALL" || row.category === categoryFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      row.metricKey.toLowerCase().includes(q) ||
      row.label.toLowerCase().includes(q) ||
      row.endpointPath.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const updateRow = (
    metricKey: MetricMappingConfig["metricKey"],
    patch: Partial<MetricMappingConfig>
  ) => {
    setDraft((prev) =>
      prev.map((row) =>
        row.metricKey === metricKey ? { ...row, ...patch } : row
      )
    );
  };

  const handleProviderSwitch = (
    row: MetricMappingConfig,
    nextProviderId: ProviderId
  ) => {
    const slug = row.metricKey.toLowerCase();
    const suggestedEndpoint = `${ENDPOINT_TEMPLATE_BY_PROVIDER[nextProviderId]}${slug}`;
    updateRow(row.metricKey, {
      providerId: nextProviderId,
      endpointPath: suggestedEndpoint,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveMappings(draft);
    } finally {
      setSaving(false);
    }
  };

  const providerOptions: { id: ProviderId; name: string; status: string }[] = [
    ...providers.map((p) => ({ id: p.id, name: p.name, status: p.status })),
    { id: "mock", name: "Sandbox Mock Engine", status: "mock" },
  ];

  return (
    <Card>
      <CardHeader
        icon={<ArrowRightLeft className="h-4 w-4 text-sky-400" />}
        title="Motor de Mapeo de Métricas (Metric Mapping Engine)"
        subtitle="Asigna cada indicador onchain a un proveedor específico y define su endpoint y campo JSON exacto. Permite combinar fuentes (ej. Precio desde Glassnode, Inflows desde CryptoQuant)."
        actions={
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3.5 py-2 text-xs font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Guardando..." : "Guardar Mapeo"}
          </button>
        }
      />

      <CardBody className="space-y-4">
        {/* Search & Category Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={
                  categoryFilter === cat
                    ? "rounded-md bg-sky-500/20 px-2.5 py-1 text-xs font-medium text-sky-300 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.4)]"
                    : "rounded-md border border-terminal-border bg-terminal-bg px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200"
                }
              >
                {cat === "ALL" ? `Todas (${draft.length})` : cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar métrica o endpoint..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-terminal-border bg-terminal-bg py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Mapping Table */}
        <div className="overflow-x-auto rounded-xl border border-terminal-border">
          <table className="w-full min-w-[920px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-terminal-border bg-terminal-bg/90 text-[11px] uppercase tracking-wider text-slate-400">
                <th className="px-3.5 py-3">Métrica del Sistema</th>
                <th className="px-3.5 py-3">Proveedor Asignado</th>
                <th className="px-3.5 py-3">Endpoint / Canal del Proveedor</th>
                <th className="px-3.5 py-3">Parámetro JSON Path</th>
                <th className="px-3.5 py-3 text-center">Escala</th>
                <th className="px-3.5 py-3 text-center">Activa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-terminal-border/70">
              {filtered.map((row) => (
                <tr
                  key={row.metricKey}
                  className="bg-terminal-surface/50 transition hover:bg-terminal-elevated/50"
                >
                  <td className="px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-sky-300">
                        {row.metricKey}
                      </span>
                      <Badge variant="neutral" className="text-[10px]">
                        {row.unit}
                      </Badge>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-400">
                      {row.label}
                    </div>
                  </td>

                  <td className="px-3.5 py-2.5">
                    <select
                      value={row.providerId}
                      onChange={(e) =>
                        handleProviderSwitch(row, e.target.value as ProviderId)
                      }
                      className="w-44 rounded-md border border-terminal-border bg-terminal-bg px-2.5 py-1.5 text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
                    >
                      {providerOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.name} ({opt.status})
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="px-3.5 py-2.5">
                    <input
                      type="text"
                      value={row.endpointPath}
                      onChange={(e) =>
                        updateRow(row.metricKey, {
                          endpointPath: e.target.value,
                        })
                      }
                      className="w-full min-w-[240px] rounded-md border border-terminal-border bg-terminal-bg px-2.5 py-1.5 font-mono text-[11px] text-slate-200 focus:border-sky-500 focus:outline-none"
                    />
                  </td>

                  <td className="px-3.5 py-2.5">
                    <input
                      type="text"
                      value={row.jsonFieldPath}
                      onChange={(e) =>
                        updateRow(row.metricKey, {
                          jsonFieldPath: e.target.value,
                        })
                      }
                      className="w-44 rounded-md border border-terminal-border bg-terminal-bg px-2.5 py-1.5 font-mono text-[11px] text-amber-300 focus:border-sky-500 focus:outline-none"
                    />
                  </td>

                  <td className="px-3.5 py-2.5 text-center">
                    <input
                      type="number"
                      step="0.1"
                      value={row.transformMultiplier}
                      onChange={(e) =>
                        updateRow(row.metricKey, {
                          transformMultiplier: parseFloat(e.target.value) || 1,
                        })
                      }
                      className="w-16 rounded-md border border-terminal-border bg-terminal-bg px-2 py-1 text-center font-mono text-[11px] text-slate-200 focus:border-sky-500 focus:outline-none"
                    />
                  </td>

                  <td className="px-3.5 py-2.5 text-center">
                    <Switch
                      checked={row.enabled}
                      label={`Activar métrica ${row.metricKey}`}
                      onChange={(checked) =>
                        updateRow(row.metricKey, { enabled: checked })
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}
