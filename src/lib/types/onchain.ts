export type AssetSymbol = "BTC" | "ETH" | "SOL";

export type Timeframe = "24h" | "7d" | "30d" | "1y" | "cycle";

export type MarketScenario =
  | "auto"
  | "healthy_bull"
  | "euphoria_top"
  | "rp_sth_support"
  | "structural_floor";

export type MetricKey =
  | "PRECIO"
  | "RP_STH"
  | "RP_LTH"
  | "URPD"
  | "MVRV_STH"
  | "MVRV_LTH"
  | "SOPR_STH"
  | "SOPR_LTH"
  | "EXCHANGE_INFLOWS"
  | "EXCHANGE_OUTFLOWS"
  | "CPI"
  | "WHALE_ACCUMULATION"
  | "UTXO_AGE_BANDS"
  | "CEX_RESERVES"
  | "ACTIVE_ADDRESSES"
  | "TX_VOLUME"
  | "NUPL";

export type ProviderId =
  | "mock"
  | "glassnode"
  | "cryptoquant"
  | "coinglass"
  | "intotheblock"
  | "custom_rest"
  | "custom_ws";

export type ProviderStatus = "active" | "inactive" | "mock";

export type PollingInterval = "5m" | "1h" | "24h";

export interface CustomHeader {
  key: string;
  value: string;
}

export interface ProviderTestResult {
  ok: boolean;
  httpStatus: number;
  latencyMs: number;
  schemaValid: boolean;
  checkedEndpoints: string[];
  message: string;
  timestamp: string;
  mode: "simulated" | "live";
}

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  description: string;
  protocol: "REST" | "WebSocket" | "Internal";
  status: ProviderStatus;
  apiKey: string;
  baseUrl: string;
  webhookUrl: string;
  customHeaders: CustomHeader[];
  pollingInterval: PollingInterval;
  rateLimitRpm: number;
  docsUrl: string;
  lastTestedAt?: string;
  lastTestResult?: ProviderTestResult;
}

export interface MetricMappingConfig {
  metricKey: MetricKey;
  label: string;
  category:
    | "Precio y Niveles"
    | "Sentimiento y Flujos"
    | "Acumulación y Red"
    | "Ciclo Macro";
  unit: string;
  providerId: ProviderId;
  endpointPath: string;
  jsonFieldPath: string;
  transformMultiplier: number;
  enabled: boolean;
}

export interface RuleThresholdsConfig {
  rpSthProximityPct: number; // e.g., 2.5% proximity to RP STH triggers support/test alert
  mvrvSthOverbought: number; // e.g., 1.35 resistance / overheated
  mvrvLthFloor: number; // e.g., 0.0 structural floor oscillator threshold
  soprSthPeak: number; // e.g., 1.07 profit taking peak
  cpiPeakPct: number; // e.g., 0.14% Coinbase premium spike
  cexMassiveOutflowThreshold: number; // e.g., 14000 BTC (scaled for ETH/SOL)
  nuplEuphoriaThreshold: number; // e.g., 0.72 macro euphoria zone
  whaleAccumulationThreshold: number; // e.g., 0.75 strong whale buying
  enabledRules: {
    rpSthSupport: boolean;
    mvrvSthResistance: boolean;
    mvrvLthFloor: boolean;
    euphoriaRisk: boolean;
    cexMassiveOutflow: boolean;
    nuplMacroZone: boolean;
    whaleAccumulation: boolean;
  };
}

export type AlertSeverity = "CRITICAL" | "WARNING" | "BULLISH" | "INFO";

export type WebhookProviderType = "discord" | "telegram" | "slack" | "custom";

export interface WebhookDestination {
  id: string;
  name: string;
  type: WebhookProviderType;
  url: string;
  channelOrChatId: string;
  minSeverity: AlertSeverity;
  enabled: boolean;
  lastTriggeredAt?: string;
}

export interface SystemConfig {
  providers: ProviderConfig[];
  metricMappings: MetricMappingConfig[];
  ruleThresholds: RuleThresholdsConfig;
  webhooks: WebhookDestination[];
  updatedAt: string;
}

// ============================================================
// UNIFIED DATA LAYER SCHEMAS (CONSUMED BY DASHBOARD UI)
// ============================================================

export interface PriceStructurePoint {
  timestamp: number;
  dateLabel: string;
  price: number;
  rpSth: number;
  rpLth: number;
  mvrvSth: number;
  mvrvLth: number; // Normalized structural oscillator (0 = structural cost basis floor)
}

export interface UrpdBucket {
  priceBucket: number;
  priceLabel: string;
  volumeNative: number;
  sthVolume: number;
  lthVolume: number;
  sharePct: number;
  isCurrentPrice: boolean;
  zone: "support" | "resistance" | "spot";
}

export interface SentimentFlowPoint {
  timestamp: number;
  dateLabel: string;
  soprSth: number;
  exchangeInflows: number;
  exchangeOutflows: number;
  exchangeNetflow: number;
  cpi: number; // Percentage, e.g. +0.12 means +0.12% Coinbase Premium
}

export type SentimentRegimeId =
  | "EUPHORIA"
  | "OVEROPTIMISM"
  | "HEALTHY_BULL"
  | "APATHY_ACCUMULATION";

export interface SentimentSignalItem {
  key: "cpi" | "soprSth" | "netInflows";
  label: string;
  valueFormatted: string;
  status: "danger" | "warn" | "bull" | "neutral";
  detail: string;
}

export interface MarketSentimentState {
  regime: SentimentRegimeId;
  label: string;
  shortLabel: string;
  description: string;
  trafficColor: "red" | "amber" | "emerald" | "cyan";
  convictionScore: number; // 0-100
  signals: SentimentSignalItem[];
}

export interface AccumulationNetworkPoint {
  timestamp: number;
  dateLabel: string;
  whaleScore: number; // 0 to 1 (>1,000 BTC cohort trend score)
  whaleBalanceDelta: number; // Daily cohort net delta
  cexReserves: number; // Total native coins on CEX
  activeAddresses: number;
  txVolumeUsdBillions: number;
  // UTXO Age Bands (% share of supply, sums to ~100%)
  ageBand_lt1m: number;
  ageBand_1m_3m: number;
  ageBand_3m_6m: number;
  ageBand_6m_1y: number;
  ageBand_1y_2y: number;
  ageBand_gt2y: number;
}

export interface MacroCyclePoint {
  timestamp: number;
  dateLabel: string;
  price: number;
  nupl: number; // -0.2 to +0.85
  soprLth: number; // 0.6 to 3.2
  macroPhase:
    | "Capitulación"
    | "Esperanza / Miedo"
    | "Optimismo"
    | "Creencia"
    | "Euforia / Codicia";
}

export interface OnchainAlert {
  id: string;
  ruleId: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  panel: 1 | 2 | 3 | 4;
  metricKey: MetricKey;
  currentValue: string;
  thresholdValue: string;
  timestamp: string;
  dispatchedWebhooks: string[];
}

export interface DashboardKpiSummary {
  price: number;
  priceChangePct: number;
  rpSth: number;
  rpSthSpreadPct: number;
  rpLth: number;
  mvrvSth: number;
  mvrvLth: number;
  soprSth: number;
  soprLth: number;
  cpi: number;
  nupl: number;
  exchangeNetflow24h: number;
  cexReserves: number;
  cexReservesDeltaPct: number;
  whaleScore: number;
  activeAddresses: number;
}

export interface MetricSourceAttribution {
  metricKey: MetricKey;
  providerId: ProviderId;
  providerName: string;
  effectiveMode: "live" | "mock_fallback" | "mock";
  endpointPath: string;
}

export interface UnifiedDashboardPayload {
  asset: AssetSymbol;
  timeframe: Timeframe;
  scenario: MarketScenario;
  generatedAt: string;
  activeLiveProviders: number;
  isSandboxMode: boolean;
  metricSources: MetricSourceAttribution[];
  kpis: DashboardKpiSummary;
  priceStructure: PriceStructurePoint[];
  urpd: UrpdBucket[];
  sentimentFlows: SentimentFlowPoint[];
  sentimentState: MarketSentimentState;
  accumulationNetwork: AccumulationNetworkPoint[];
  macroCycle: MacroCyclePoint[];
  alerts: OnchainAlert[];
}
