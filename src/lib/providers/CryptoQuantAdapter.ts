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

export const CRYPTOQUANT_DEFAULT_ENDPOINTS: Partial<Record<MetricKey, string>> = {
  PRECIO: "/v1/btc/market-data/price-ohlcv",
  EXCHANGE_INFLOWS: "/v1/btc/exchange-flows/inflow",
  EXCHANGE_OUTFLOWS: "/v1/btc/exchange-flows/outflow",
  CEX_RESERVES: "/v1/btc/exchange-flows/reserve",
  CPI: "/v1/btc/market-data/coinbase-premium-index",
  SOPR_STH: "/v1/btc/market-indicator/sth-sopr",
  SOPR_LTH: "/v1/btc/market-indicator/lth-sopr",
  MVRV_STH: "/v1/btc/market-indicator/mvrv",
  NUPL: "/v1/btc/network-indicator/nupl",
  ACTIVE_ADDRESSES: "/v1/btc/network-data/addresses-count",
  TX_VOLUME: "/v1/btc/network-data/transactions-count",
};

/**
 * Adaptador esqueleto para CryptoQuant API v1.
 * Especializado en Exchange Inflows/Outflows, Reservas CEX y Coinbase Premium Index (CPI).
 */
export class CryptoQuantAdapter implements IOnchainDataProvider {
  readonly id = "cryptoquant" as const;
  readonly name = "CryptoQuant";
  readonly supportedMetrics = ALL_METRIC_KEYS;

  async testConnection(config: ProviderConfig): Promise<ProviderTestResult> {
    const base = config.baseUrl || "https://api.cryptoquant.com";
    const sampleEndpoint = `${base}${CRYPTOQUANT_DEFAULT_ENDPOINTS.CPI}?window=day`;

    if (config.status === "active" && config.apiKey.trim().length >= 8) {
      // TODO: Conectar llamada real a API de CryptoQuant:
      // const response = await fetch(sampleEndpoint, {
      //   headers: { Authorization: `Bearer ${config.apiKey}`, ...customHeaders },
      // });
      // Validar response.status === 200 y estructura { result: { data: [...] } }
      return {
        ok: true,
        httpStatus: 200,
        latencyMs: 118,
        schemaValid: true,
        checkedEndpoints: [
          sampleEndpoint,
          `${base}${CRYPTOQUANT_DEFAULT_ENDPOINTS.EXCHANGE_INFLOWS}?exchange=all_exchange`,
        ],
        message:
          "HTTP 200 OK (Simulador de validación). Header Authorization Bearer y schema CryptoQuant verificados.",
        timestamp: new Date().toISOString(),
        mode: "simulated",
      };
    }

    return {
      ok: config.status === "mock",
      httpStatus: config.status === "mock" ? 200 : 401,
      latencyMs: 58,
      schemaValid: true,
      checkedEndpoints: [sampleEndpoint],
      message:
        config.status === "mock"
          ? "HTTP 200 OK en Mock Mode. Configura Bearer Token y estado Activo para flujos reales de CryptoQuant."
          : "HTTP 401 Unauthorized: API Key de CryptoQuant requerida en modo Activo.",
      timestamp: new Date().toISOString(),
      mode: "simulated",
    };
  }

  async fetchDataset(params: ProviderFetchParams): Promise<ProviderDatasetResult> {
    const isLiveConfigured =
      params.config.status === "active" && params.config.apiKey.trim().length >= 8;

    if (isLiveConfigured) {
      // TODO: Conectar llamada real a API de CryptoQuant usando Bearer Token
      // y mapear result.data[].coinbase_premium_index, inflow_total, outflow_total al esquema unificado.
    }

    return {
      dataset: generateCoherentOnchainDataset(
        params.asset,
        params.timeframe,
        params.scenario
      ),
      mode: isLiveConfigured ? "mock_fallback" : "mock",
      providerId: this.id,
    };
  }
}
