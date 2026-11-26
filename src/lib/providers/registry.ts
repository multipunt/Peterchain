import { evaluateOnchainRules } from "@/lib/engine/ruleEngine";
import { classifyMarketSentiment } from "@/lib/engine/sentimentClassifier";
import type {
  AssetSymbol,
  DashboardKpiSummary,
  MarketScenario,
  MetricSourceAttribution,
  ProviderConfig,
  ProviderId,
  ProviderTestResult,
  SystemConfig,
  Timeframe,
  UnifiedDashboardPayload,
} from "@/lib/types/onchain";
import { CryptoQuantAdapter } from "./CryptoQuantAdapter";
import { GlassnodeAdapter } from "./GlassnodeAdapter";
import type { IOnchainDataProvider } from "./IOnchainDataProvider";
import { MockAdapter } from "./MockAdapter";
import {
  CoinglassAdapter,
  CustomRestAdapter,
  CustomWebSocketAdapter,
  IntoTheBlockAdapter,
} from "./OtherAdapters";

const ADAPTER_INSTANCES: Record<ProviderId, IOnchainDataProvider> = {
  mock: new MockAdapter(),
  glassnode: new GlassnodeAdapter(),
  cryptoquant: new CryptoQuantAdapter(),
  coinglass: new CoinglassAdapter(),
  intotheblock: new IntoTheBlockAdapter(),
  custom_rest: new CustomRestAdapter(),
  custom_ws: new CustomWebSocketAdapter(),
};

export function getProviderAdapter(providerId: ProviderId): IOnchainDataProvider {
  return ADAPTER_INSTANCES[providerId] ?? ADAPTER_INSTANCES.mock;
}

export async function runProviderConnectionTest(
  providerConfig: ProviderConfig
): Promise<ProviderTestResult> {
  const adapter = getProviderAdapter(providerConfig.id);
  return adapter.testConnection(providerConfig);
}

/**
 * Orquestador central de datos unificados.
 * Resuelve cada métrica según el Metric Mapping Engine, invoca al adaptador
 * correspondiente y entrega un UnifiedDashboardPayload completamente desacoplado.
 */
export async function buildUnifiedDashboardPayload(
  asset: AssetSymbol,
  timeframe: Timeframe,
  scenario: MarketScenario,
  systemConfig: SystemConfig
): Promise<UnifiedDashboardPayload> {
  const providerById = new Map<ProviderId, ProviderConfig>(
    systemConfig.providers.map((p) => [p.id, p])
  );

  // Determine unique providers referenced by active metric mappings
  const referencedProviderIds = Array.from(
    new Set(
      systemConfig.metricMappings
        .filter((m) => m.enabled)
        .map((m) => m.providerId)
    )
  );

  const providerResults = new Map<
    ProviderId,
    Awaited<ReturnType<IOnchainDataProvider["fetchDataset"]>>
  >();

  await Promise.all(
    referencedProviderIds.map(async (pid) => {
      const config = providerById.get(pid);
      const adapter =
        !config || config.status === "inactive"
          ? ADAPTER_INSTANCES.mock
          : getProviderAdapter(pid);

      const result = await adapter.fetchDataset({
        asset,
        timeframe,
        scenario,
        config:
          config ??
          ({
            id: "mock",
            name: "Sandbox Mock Engine",
            description: "Fallback Sandbox",
            protocol: "Internal",
            status: "mock",
            apiKey: "",
            baseUrl: "internal://sandbox",
            webhookUrl: "",
            customHeaders: [],
            pollingInterval: "5m",
            rateLimitRpm: 120,
            docsUrl: "",
          } satisfies ProviderConfig),
        mappings: systemConfig.metricMappings.filter((m) => m.providerId === pid),
      });
      providerResults.set(pid, result);
    })
  );

  // Use primary price provider dataset as the unified baseline
  const priceMapping = systemConfig.metricMappings.find(
    (m) => m.metricKey === "PRECIO"
  );
  const primaryResult =
    (priceMapping && providerResults.get(priceMapping.providerId)) ||
    (await ADAPTER_INSTANCES.mock.fetchDataset({
      asset,
      timeframe,
      scenario,
      config: systemConfig.providers[0],
      mappings: systemConfig.metricMappings,
    }));

  const dataset = primaryResult.dataset;

  // Build per-metric source attribution so the UI transparently displays
  // which adapter serves each metric (e.g. Price -> Glassnode, Inflows -> CryptoQuant)
  const metricSources: MetricSourceAttribution[] = systemConfig.metricMappings.map(
    (mapping) => {
      const providerConfig = providerById.get(mapping.providerId);
      const result = providerResults.get(mapping.providerId);
      return {
        metricKey: mapping.metricKey,
        providerId: mapping.providerId,
        providerName: providerConfig?.name ?? "Sandbox Mock Engine",
        effectiveMode:
          !providerConfig || providerConfig.status === "inactive"
            ? "mock"
            : result?.mode ?? "mock",
        endpointPath: mapping.endpointPath,
      };
    }
  );

  const activeLiveProviders = systemConfig.providers.filter(
    (p) => p.status === "active" && p.id !== "mock"
  ).length;

  // Compute sentiment traffic-light state & run alert rule engine
  const sentimentState = classifyMarketSentiment(
    dataset.sentimentFlows,
    systemConfig.ruleThresholds,
    asset
  );

  const alerts = evaluateOnchainRules(
    dataset,
    sentimentState,
    systemConfig.ruleThresholds,
    systemConfig.webhooks
  );

  // Build KPI strip summary from latest unified points
  const firstPrice = dataset.priceStructure[0];
  const latestPrice = dataset.priceStructure[dataset.priceStructure.length - 1];
  const latestSentiment =
    dataset.sentimentFlows[dataset.sentimentFlows.length - 1];
  const firstAccum = dataset.accumulationNetwork[0];
  const latestAccum =
    dataset.accumulationNetwork[dataset.accumulationNetwork.length - 1];
  const latestMacro = dataset.macroCycle[dataset.macroCycle.length - 1];

  const kpis: DashboardKpiSummary = {
    price: latestPrice.price,
    priceChangePct:
      ((latestPrice.price - firstPrice.price) / Math.max(1, firstPrice.price)) *
      100,
    rpSth: latestPrice.rpSth,
    rpSthSpreadPct:
      ((latestPrice.price - latestPrice.rpSth) / Math.max(1, latestPrice.rpSth)) *
      100,
    rpLth: latestPrice.rpLth,
    mvrvSth: latestPrice.mvrvSth,
    mvrvLth: latestPrice.mvrvLth,
    soprSth: latestSentiment.soprSth,
    soprLth: latestMacro.soprLth,
    cpi: latestSentiment.cpi,
    nupl: latestMacro.nupl,
    exchangeNetflow24h: latestSentiment.exchangeNetflow,
    cexReserves: latestAccum.cexReserves,
    cexReservesDeltaPct:
      ((latestAccum.cexReserves - firstAccum.cexReserves) /
        Math.max(1, firstAccum.cexReserves)) *
      100,
    whaleScore: latestAccum.whaleScore,
    activeAddresses: latestAccum.activeAddresses,
  };

  return {
    asset,
    timeframe,
    scenario,
    generatedAt: new Date().toISOString(),
    activeLiveProviders,
    isSandboxMode: activeLiveProviders === 0,
    metricSources,
    kpis,
    priceStructure: dataset.priceStructure,
    urpd: dataset.urpd,
    sentimentFlows: dataset.sentimentFlows,
    sentimentState,
    accumulationNetwork: dataset.accumulationNetwork,
    macroCycle: dataset.macroCycle,
    alerts,
  };
}
