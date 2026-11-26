import fs from "node:fs";
import path from "node:path";
import type {
  MetricMappingConfig,
  ProviderConfig,
  ProviderId,
  RuleThresholdsConfig,
  SystemConfig,
  WebhookDestination,
} from "@/lib/types/onchain";

const CONFIG_FILE_PATH = path.join(process.cwd(), ".peterchain-config.json");

export const DEFAULT_PROVIDERS: ProviderConfig[] = [
  {
    id: "glassnode",
    name: "Glassnode",
    description:
      "Métricas UTXO institucionales: Realized Price STH/LTH, URPD, MVRV, NUPL y HODL Waves.",
    protocol: "REST",
    status: "mock",
    apiKey: "",
    baseUrl: "https://api.glassnode.com",
    webhookUrl: "",
    customHeaders: [{ key: "Accept", value: "application/json" }],
    pollingInterval: "1h",
    rateLimitRpm: 60,
    docsUrl: "https://docs.glassnode.com/basic-api/api",
  },
  {
    id: "cryptoquant",
    name: "CryptoQuant",
    description:
      "Flujos de exchanges en alta frecuencia: Inflows, Outflows, Reservas CEX y Coinbase Premium Index.",
    protocol: "REST",
    status: "mock",
    apiKey: "",
    baseUrl: "https://api.cryptoquant.com",
    webhookUrl: "",
    customHeaders: [{ key: "Accept", value: "application/json" }],
    pollingInterval: "5m",
    rateLimitRpm: 120,
    docsUrl: "https://cryptoquant.com/docs",
  },
  {
    id: "coinglass",
    name: "Coinglass",
    description:
      "Sentimiento de mercado, Coinbase Premium Index, liquidez y balances de exchanges.",
    protocol: "REST",
    status: "mock",
    apiKey: "",
    baseUrl: "https://open-api-v3.coinglass.com",
    webhookUrl: "",
    customHeaders: [{ key: "Accept", value: "application/json" }],
    pollingInterval: "5m",
    rateLimitRpm: 90,
    docsUrl: "https://docs.coinglass.com",
  },
  {
    id: "intotheblock",
    name: "IntoTheBlock",
    description:
      "Dinámica de cohortes de ballenas (>1,000 BTC), direcciones activas y volumen en cadena.",
    protocol: "REST",
    status: "mock",
    apiKey: "",
    baseUrl: "https://api.intotheblock.com",
    webhookUrl: "",
    customHeaders: [{ key: "Accept", value: "application/json" }],
    pollingInterval: "1h",
    rateLimitRpm: 60,
    docsUrl: "https://docs.intotheblock.com",
  },
  {
    id: "custom_rest",
    name: "Custom REST API",
    description:
      "Conector genérico para nodos propios (Bitcoin Core / Electrum / Indexer) o APIs internas.",
    protocol: "REST",
    status: "inactive",
    apiKey: "",
    baseUrl: "https://node.mi-infraestructura.io/api/v1",
    webhookUrl: "",
    customHeaders: [
      { key: "X-Client", value: "PeterChain-Terminal" },
      { key: "Accept", value: "application/json" },
    ],
    pollingInterval: "5m",
    rateLimitRpm: 300,
    docsUrl: "",
  },
  {
    id: "custom_ws",
    name: "Custom WebSocket",
    description:
      "Stream bidireccional en tiempo real para bloques nuevos, mempool y alertas instantáneas.",
    protocol: "WebSocket",
    status: "inactive",
    apiKey: "",
    baseUrl: "wss://stream.mi-nodo-onchain.io/v1/ws",
    webhookUrl: "",
    customHeaders: [{ key: "X-Stream-Version", value: "1.0" }],
    pollingInterval: "5m",
    rateLimitRpm: 600,
    docsUrl: "",
  },
];

export const DEFAULT_METRIC_MAPPINGS: MetricMappingConfig[] = [
  {
    metricKey: "PRECIO",
    label: "Precio Spot (USD)",
    category: "Precio y Niveles",
    unit: "USD",
    providerId: "glassnode",
    endpointPath: "/v1/metrics/market/price_usd_close",
    jsonFieldPath: "data[].v",
    transformMultiplier: 1,
    enabled: true,
  },
  {
    metricKey: "RP_STH",
    label: "Realized Price STH (<155d)",
    category: "Precio y Niveles",
    unit: "USD",
    providerId: "glassnode",
    endpointPath: "/v1/metrics/market/price_realized_sth_usd",
    jsonFieldPath: "data[].v",
    transformMultiplier: 1,
    enabled: true,
  },
  {
    metricKey: "RP_LTH",
    label: "Realized Price LTH (>155d)",
    category: "Precio y Niveles",
    unit: "USD",
    providerId: "glassnode",
    endpointPath: "/v1/metrics/market/price_realized_lth_usd",
    jsonFieldPath: "data[].v",
    transformMultiplier: 1,
    enabled: true,
  },
  {
    metricKey: "URPD",
    label: "URPD (UTXO Realized Price Dist.)",
    category: "Precio y Niveles",
    unit: "BTC",
    providerId: "glassnode",
    endpointPath: "/v1/metrics/indicators/utxo_realized_price_distribution_ath",
    jsonFieldPath: "data[].partitions",
    transformMultiplier: 1,
    enabled: true,
  },
  {
    metricKey: "MVRV_STH",
    label: "MVRV Short-Term Holders",
    category: "Precio y Niveles",
    unit: "ratio",
    providerId: "glassnode",
    endpointPath: "/v1/metrics/market/mvrv_less_155",
    jsonFieldPath: "data[].v",
    transformMultiplier: 1,
    enabled: true,
  },
  {
    metricKey: "MVRV_LTH",
    label: "MVRV Long-Term Holders (Osc.)",
    category: "Precio y Niveles",
    unit: "osc",
    providerId: "glassnode",
    endpointPath: "/v1/metrics/market/mvrv_more_155",
    jsonFieldPath: "data[].v",
    transformMultiplier: 1,
    enabled: true,
  },
  {
    metricKey: "SOPR_STH",
    label: "SOPR Short-Term Holders",
    category: "Sentimiento y Flujos",
    unit: "ratio",
    providerId: "cryptoquant",
    endpointPath: "/v1/btc/market-indicator/sth-sopr",
    jsonFieldPath: "result.data[].sth_sopr",
    transformMultiplier: 1,
    enabled: true,
  },
  {
    metricKey: "EXCHANGE_INFLOWS",
    label: "Exchange Inflows",
    category: "Sentimiento y Flujos",
    unit: "Coins",
    providerId: "cryptoquant",
    endpointPath: "/v1/btc/exchange-flows/inflow",
    jsonFieldPath: "result.data[].inflow_total",
    transformMultiplier: 1,
    enabled: true,
  },
  {
    metricKey: "EXCHANGE_OUTFLOWS",
    label: "Exchange Outflows",
    category: "Sentimiento y Flujos",
    unit: "Coins",
    providerId: "cryptoquant",
    endpointPath: "/v1/btc/exchange-flows/outflow",
    jsonFieldPath: "result.data[].outflow_total",
    transformMultiplier: 1,
    enabled: true,
  },
  {
    metricKey: "CPI",
    label: "Coinbase Premium Index (CPI)",
    category: "Sentimiento y Flujos",
    unit: "%",
    providerId: "coinglass",
    endpointPath: "/api/coinbase-premium-index",
    jsonFieldPath: "data[].premium_rate",
    transformMultiplier: 100,
    enabled: true,
  },
  {
    metricKey: "WHALE_ACCUMULATION",
    label: "Whale Accumulation Trend (>1k BTC)",
    category: "Acumulación y Red",
    unit: "score",
    providerId: "intotheblock",
    endpointPath: "/v1/assets/btc/whales/accumulation",
    jsonFieldPath: "series[].trend_score",
    transformMultiplier: 1,
    enabled: true,
  },
  {
    metricKey: "UTXO_AGE_BANDS",
    label: "UTXO Age Bands (Maduras vs Jóvenes)",
    category: "Acumulación y Red",
    unit: "%",
    providerId: "glassnode",
    endpointPath: "/v1/metrics/supply/hodl_waves",
    jsonFieldPath: "data[].o",
    transformMultiplier: 1,
    enabled: true,
  },
  {
    metricKey: "CEX_RESERVES",
    label: "Reservas Globales en CEX",
    category: "Acumulación y Red",
    unit: "Coins",
    providerId: "cryptoquant",
    endpointPath: "/v1/btc/exchange-flows/reserve",
    jsonFieldPath: "result.data[].reserve",
    transformMultiplier: 1,
    enabled: true,
  },
  {
    metricKey: "ACTIVE_ADDRESSES",
    label: "Direcciones Activas",
    category: "Acumulación y Red",
    unit: "addrs",
    providerId: "intotheblock",
    endpointPath: "/v1/assets/btc/addresses/active",
    jsonFieldPath: "series[].active_count",
    transformMultiplier: 1,
    enabled: true,
  },
  {
    metricKey: "TX_VOLUME",
    label: "Volumen de Transacciones (USD)",
    category: "Acumulación y Red",
    unit: "USD B",
    providerId: "glassnode",
    endpointPath: "/v1/metrics/transactions/transfers_volume_sum",
    jsonFieldPath: "data[].v",
    transformMultiplier: 1,
    enabled: true,
  },
  {
    metricKey: "NUPL",
    label: "Net Unrealized Profit/Loss (NUPL)",
    category: "Ciclo Macro",
    unit: "index",
    providerId: "glassnode",
    endpointPath: "/v1/metrics/indicators/net_unrealized_profit_loss",
    jsonFieldPath: "data[].v",
    transformMultiplier: 1,
    enabled: true,
  },
  {
    metricKey: "SOPR_LTH",
    label: "SOPR Long-Term Holders",
    category: "Ciclo Macro",
    unit: "ratio",
    providerId: "cryptoquant",
    endpointPath: "/v1/btc/market-indicator/lth-sopr",
    jsonFieldPath: "result.data[].lth_sopr",
    transformMultiplier: 1,
    enabled: true,
  },
];

export const DEFAULT_RULE_THRESHOLDS: RuleThresholdsConfig = {
  rpSthProximityPct: 2.5,
  mvrvSthOverbought: 1.35,
  mvrvLthFloor: 0.0,
  soprSthPeak: 1.08,
  cpiPeakPct: 0.14,
  cexMassiveOutflowThreshold: 12000,
  nuplEuphoriaThreshold: 0.72,
  whaleAccumulationThreshold: 0.75,
  enabledRules: {
    rpSthSupport: true,
    mvrvSthResistance: true,
    mvrvLthFloor: true,
    euphoriaRisk: true,
    cexMassiveOutflow: true,
    nuplMacroZone: true,
    whaleAccumulation: true,
  },
};

export const DEFAULT_WEBHOOKS: WebhookDestination[] = [
  {
    id: "wh-discord-desk",
    name: "Discord — Trading Desk Alerts",
    type: "discord",
    url: "https://discord.com/api/webhooks/1234567890/sandbox-token",
    channelOrChatId: "#onchain-alerts",
    minSeverity: "WARNING",
    enabled: true,
  },
  {
    id: "wh-telegram-vip",
    name: "Telegram — Bot Macro Risk",
    type: "telegram",
    url: "https://api.telegram.org/bot<TOKEN>/sendMessage",
    channelOrChatId: "-100198273645",
    minSeverity: "CRITICAL",
    enabled: true,
  },
  {
    id: "wh-slack-ops",
    name: "Slack — Quant Research",
    type: "slack",
    url: "https://hooks.slack.com/services/T00000/B00000/sandbox",
    channelOrChatId: "#quant-signals",
    minSeverity: "BULLISH",
    enabled: false,
  },
];

export function createDefaultSystemConfig(): SystemConfig {
  return {
    providers: structuredClone(DEFAULT_PROVIDERS),
    metricMappings: structuredClone(DEFAULT_METRIC_MAPPINGS),
    ruleThresholds: structuredClone(DEFAULT_RULE_THRESHOLDS),
    webhooks: structuredClone(DEFAULT_WEBHOOKS),
    updatedAt: new Date().toISOString(),
  };
}

// Endpoint suggestions when switching a metric's provider in Back Office
export const PROVIDER_ENDPOINT_SUGGESTIONS: Record<ProviderId, string> = {
  mock: "internal://sandbox/metrics/{metric}",
  glassnode: "/v1/metrics/market/{metric}",
  cryptoquant: "/v1/btc/market-indicator/{metric}",
  coinglass: "/api/onchain/{metric}",
  intotheblock: "/v1/assets/btc/{metric}",
  custom_rest: "/api/v1/onchain/{metric}",
  custom_ws: "channel:onchain.{metric}",
};

let memoryStore: SystemConfig | null = null;

export function loadSystemConfig(): SystemConfig {
  if (memoryStore) return memoryStore;

  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const raw = fs.readFileSync(CONFIG_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw) as Partial<SystemConfig>;
      const defaults = createDefaultSystemConfig();
      memoryStore = {
        providers: parsed.providers?.length ? parsed.providers : defaults.providers,
        metricMappings: parsed.metricMappings?.length
          ? parsed.metricMappings
          : defaults.metricMappings,
        ruleThresholds: parsed.ruleThresholds
          ? {
              ...defaults.ruleThresholds,
              ...parsed.ruleThresholds,
              enabledRules: {
                ...defaults.ruleThresholds.enabledRules,
                ...(parsed.ruleThresholds.enabledRules ?? {}),
              },
            }
          : defaults.ruleThresholds,
        webhooks: parsed.webhooks ?? defaults.webhooks,
        updatedAt: parsed.updatedAt ?? new Date().toISOString(),
      };
      return memoryStore;
    }
  } catch {
    // Fallback cleanly to default config in memory
  }

  memoryStore = createDefaultSystemConfig();
  return memoryStore;
}

export function saveSystemConfig(nextConfig: Partial<SystemConfig>): SystemConfig {
  const current = loadSystemConfig();
  const merged: SystemConfig = {
    providers: nextConfig.providers ?? current.providers,
    metricMappings: nextConfig.metricMappings ?? current.metricMappings,
    ruleThresholds: nextConfig.ruleThresholds
      ? {
          ...current.ruleThresholds,
          ...nextConfig.ruleThresholds,
          enabledRules: {
            ...current.ruleThresholds.enabledRules,
            ...(nextConfig.ruleThresholds.enabledRules ?? {}),
          },
        }
      : current.ruleThresholds,
    webhooks: nextConfig.webhooks ?? current.webhooks,
    updatedAt: new Date().toISOString(),
  };

  memoryStore = merged;

  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(merged, null, 2), "utf-8");
  } catch {
    // Non-fatal in read-only or serverless environments
  }

  return merged;
}

export function resetSystemConfig(): SystemConfig {
  const defaults = createDefaultSystemConfig();
  memoryStore = defaults;
  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(defaults, null, 2), "utf-8");
  } catch {
    // Ignore fs errors
  }
  return defaults;
}
