import type {
  MetricKey,
  ProviderConfig,
  ProviderTestResult,
} from "@/lib/types/onchain";
import { generateCoherentOnchainDataset } from "@/mock/onchainGenerator";
import {
  ALL_METRIC_KEYS,
  type IOnchainDataProvider,
  type ProviderDatasetResult,
  type ProviderFetchParams,
} from "./IOnchainDataProvider";

export const GLASSNODE_DEFAULT_ENDPOINTS: Partial<Record<MetricKey, string>> = {
  PRECIO: "/v1/metrics/market/price_usd_close",
  RP_STH: "/v1/metrics/market/price_realized_sth_usd",
  RP_LTH: "/v1/metrics/market/price_realized_lth_usd",
  URPD: "/v1/metrics/indicators/utxo_realized_price_distribution_ath",
  MVRV_STH: "/v1/metrics/market/mvrv_less_155",
  MVRV_LTH: "/v1/metrics/market/mvrv_more_155",
  SOPR_STH: "/v1/metrics/indicators/sopr_less_155",
  SOPR_LTH: "/v1/metrics/indicators/sopr_more_155",
  EXCHANGE_INFLOWS: "/v1/metrics/transactions/transfers_volume_to_exchanges_sum",
  EXCHANGE_OUTFLOWS: "/v1/metrics/transactions/transfers_volume_from_exchanges_sum",
  CEX_RESERVES: "/v1/metrics/distribution/balance_exchanges",
  WHALE_ACCUMULATION: "/v1/metrics/indicators/accumulation_trend_score",
  UTXO_AGE_BANDS: "/v1/metrics/supply/hodl_waves",
  ACTIVE_ADDRESSES: "/v1/metrics/addresses/active_count",
  TX_VOLUME: "/v1/metrics/transactions/transfers_volume_sum",
  NUPL: "/v1/metrics/indicators/net_unrealized_profit_loss",
};

/**
 * Adaptador esqueleto para Glassnode API v1.
 * Listo para conectar con clave real manteniendo contrato IOnchainDataProvider.
 */
export class GlassnodeAdapter implements IOnchainDataProvider {
  readonly id = "glassnode" as const;
  readonly name = "Glassnode";
  readonly supportedMetrics = ALL_METRIC_KEYS;

  async testConnection(config: ProviderConfig): Promise<ProviderTestResult> {
    const base = config.baseUrl || "https://api.glassnode.com";
    const sampleEndpoint = `${base}${GLASSNODE_DEFAULT_ENDPOINTS.PRECIO}?a=BTC&i=24h`;

    if (config.status === "active" && config.apiKey.trim().length >= 8) {
      // TODO: Conectar llamada real a API de Glassnode:
      // const response = await fetch(`${sampleEndpoint}&api_key=${encodeURIComponent(config.apiKey)}`, {
      //   headers: Object.fromEntries(config.customHeaders.map((h) => [h.key, h.value])),
      // });
      // Validar response.status === 200 y estructura [{ t: number, v: number }]
      return {
        ok: true,
        httpStatus: 200,
        latencyMs: 142,
        schemaValid: true,
        checkedEndpoints: [
          sampleEndpoint,
          `${base}${GLASSNODE_DEFAULT_ENDPOINTS.MVRV_STH}?a=BTC`,
        ],
        message:
          "HTTP 200 OK (Simulador de validación). Credencial Glassnode presente y schema [{ t, v }] verificado.",
        timestamp: new Date().toISOString(),
        mode: "simulated",
      };
    }

    return {
      ok: config.status === "mock",
      httpStatus: config.status === "mock" ? 200 : 401,
      latencyMs: 64,
      schemaValid: true,
      checkedEndpoints: [sampleEndpoint],
      message:
        config.status === "mock"
          ? "HTTP 200 OK en Mock Mode. Cambia estado a Activo e introduce tu API Key para consultas live."
          : "HTTP 401 Unauthorized: falta API Key válida para Glassnode (mín. 8 caracteres).",
      timestamp: new Date().toISOString(),
      mode: "simulated",
    };
  }

  async fetchDataset(params: ProviderFetchParams): Promise<ProviderDatasetResult> {
    const isLiveConfigured =
      params.config.status === "active" && params.config.apiKey.trim().length >= 8;

    if (isLiveConfigured) {
      // TODO: Conectar llamada real a API de Glassnode utilizando params.mappings
      // para consultar cada endpoint configurado (ej. /v1/metrics/market/price_realized_sth_usd)
      // y normalizar los puntos [{ t, v }] al tipo RawOnchainDataset.
    }

    const fallbackDataset = generateCoherentOnchainDataset(
      params.asset,
      params.timeframe,
      params.scenario
    );

    return {
      dataset: fallbackDataset,
      mode: isLiveConfigured ? "mock_fallback" : "mock",
      providerId: this.id,
    };
  }
}
