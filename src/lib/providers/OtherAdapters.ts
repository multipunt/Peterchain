import type {
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

/**
 * Adaptador esqueleto para Coinglass Open API v3 (CPI, Exchange Balances, Derivatives Sentiment).
 */
export class CoinglassAdapter implements IOnchainDataProvider {
  readonly id = "coinglass" as const;
  readonly name = "Coinglass";
  readonly supportedMetrics = ALL_METRIC_KEYS;

  async testConnection(config: ProviderConfig): Promise<ProviderTestResult> {
    const base = config.baseUrl || "https://open-api-v3.coinglass.com";
    const endpoint = `${base}/api/coinbase-premium-index?symbol=BTC`;

    if (config.status === "active" && config.apiKey.trim().length >= 8) {
      // TODO: Conectar llamada real a API de Coinglass:
      // const response = await fetch(endpoint, {
      //   headers: { "CG-API-KEY": config.apiKey, ...customHeaders },
      // });
      return {
        ok: true,
        httpStatus: 200,
        latencyMs: 96,
        schemaValid: true,
        checkedEndpoints: [endpoint, `${base}/api/exchange/balance/list`],
        message:
          "HTTP 200 OK (Simulador de validación). Header CG-API-KEY y schema Coinglass v3 verificados.",
        timestamp: new Date().toISOString(),
        mode: "simulated",
      };
    }

    return {
      ok: config.status === "mock",
      httpStatus: config.status === "mock" ? 200 : 401,
      latencyMs: 52,
      schemaValid: true,
      checkedEndpoints: [endpoint],
      message:
        config.status === "mock"
          ? "HTTP 200 OK en Mock Mode. Introduce CG-API-KEY para habilitar consultas reales."
          : "HTTP 401 Unauthorized: falta CG-API-KEY válida.",
      timestamp: new Date().toISOString(),
      mode: "simulated",
    };
  }

  async fetchDataset(params: ProviderFetchParams): Promise<ProviderDatasetResult> {
    const isLiveConfigured =
      params.config.status === "active" && params.config.apiKey.trim().length >= 8;

    if (isLiveConfigured) {
      // TODO: Conectar llamada real a API de Coinglass y normalizar respuesta { code: "0", data: [...] }
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

/**
 * Adaptador esqueleto para IntoTheBlock (Whale Accumulation, Concentration & Active Addresses).
 */
export class IntoTheBlockAdapter implements IOnchainDataProvider {
  readonly id = "intotheblock" as const;
  readonly name = "IntoTheBlock";
  readonly supportedMetrics = ALL_METRIC_KEYS;

  async testConnection(config: ProviderConfig): Promise<ProviderTestResult> {
    const base = config.baseUrl || "https://api.intotheblock.com";
    const endpoint = `${base}/v1/assets/btc/whales/accumulation`;

    if (config.status === "active" && config.apiKey.trim().length >= 8) {
      // TODO: Conectar llamada real a API de IntoTheBlock con X-API-KEY
      return {
        ok: true,
        httpStatus: 200,
        latencyMs: 134,
        schemaValid: true,
        checkedEndpoints: [endpoint, `${base}/v1/assets/btc/addresses/stats`],
        message:
          "HTTP 200 OK (Simulador de validación). Esquema de cohortes IntoTheBlock validado.",
        timestamp: new Date().toISOString(),
        mode: "simulated",
      };
    }

    return {
      ok: config.status === "mock",
      httpStatus: config.status === "mock" ? 200 : 401,
      latencyMs: 61,
      schemaValid: true,
      checkedEndpoints: [endpoint],
      message:
        config.status === "mock"
          ? "HTTP 200 OK en Mock Mode. Listo para activar con clave de IntoTheBlock."
          : "HTTP 401 Unauthorized: falta API Key de IntoTheBlock.",
      timestamp: new Date().toISOString(),
      mode: "simulated",
    };
  }

  async fetchDataset(params: ProviderFetchParams): Promise<ProviderDatasetResult> {
    const isLiveConfigured =
      params.config.status === "active" && params.config.apiKey.trim().length >= 8;

    if (isLiveConfigured) {
      // TODO: Conectar llamada real a API de IntoTheBlock para cohortes de ballenas y direcciones activas
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

/**
 * Adaptador genérico para nodos propios o Custom REST API.
 */
export class CustomRestAdapter implements IOnchainDataProvider {
  readonly id = "custom_rest" as const;
  readonly name = "Custom REST API";
  readonly supportedMetrics = ALL_METRIC_KEYS;

  async testConnection(config: ProviderConfig): Promise<ProviderTestResult> {
    const base = config.baseUrl || "https://node.mi-infraestructura.io/api";
    const endpoint = `${base}/health`;

    if (config.status === "active" && config.baseUrl.startsWith("http")) {
      // TODO: Conectar llamada real a API REST personalizada:
      // const headers = Object.fromEntries(config.customHeaders.map((h) => [h.key, h.value]));
      // const res = await fetch(endpoint, { headers });
      return {
        ok: true,
        httpStatus: 200,
        latencyMs: 47,
        schemaValid: true,
        checkedEndpoints: [endpoint],
        message:
          "HTTP 200 OK (Simulador de validación). Endpoint REST personalizado y cabeceras listos.",
        timestamp: new Date().toISOString(),
        mode: "simulated",
      };
    }

    return {
      ok: config.status === "mock",
      httpStatus: config.status === "mock" ? 200 : 400,
      latencyMs: 39,
      schemaValid: true,
      checkedEndpoints: [endpoint],
      message:
        config.status === "mock"
          ? "HTTP 200 OK en Mock Mode. Define tu Endpoint Base y activa el proveedor para conectar un nodo propio."
          : "HTTP 400 Bad Request: verifica que el Endpoint Base comience por http:// o https://.",
      timestamp: new Date().toISOString(),
      mode: "simulated",
    };
  }

  async fetchDataset(params: ProviderFetchParams): Promise<ProviderDatasetResult> {
    const isLiveConfigured =
      params.config.status === "active" && params.config.baseUrl.startsWith("http");

    if (isLiveConfigured) {
      // TODO: Conectar llamada real a API REST personalizada usando params.mappings[].endpointPath y jsonFieldPath
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

/**
 * Adaptador esqueleto para feeds en tiempo real vía WebSocket (Custom WebSocket / Nodo propio).
 */
export class CustomWebSocketAdapter implements IOnchainDataProvider {
  readonly id = "custom_ws" as const;
  readonly name = "Custom WebSocket";
  readonly supportedMetrics = ALL_METRIC_KEYS;

  async testConnection(config: ProviderConfig): Promise<ProviderTestResult> {
    const base = config.baseUrl || "wss://stream.mi-nodo-onchain.io/v1/ws";
    const validWs = base.startsWith("ws://") || base.startsWith("wss://");

    if (config.status === "active" && validWs) {
      // TODO: Conectar llamada real a WebSocket:
      // Abrir handshake WS con backoff exponencial, suscribirse a canales de métricas
      // y verificar primer frame JSON con schema { metric, ts, value }.
      return {
        ok: true,
        httpStatus: 200,
        latencyMs: 28,
        schemaValid: true,
        checkedEndpoints: [base],
        message:
          "Handshake WS 101 -> 200 OK (Simulador de validación). Frame de suscripción verificado.",
        timestamp: new Date().toISOString(),
        mode: "simulated",
      };
    }

    return {
      ok: config.status === "mock",
      httpStatus: config.status === "mock" ? 200 : 400,
      latencyMs: 31,
      schemaValid: true,
      checkedEndpoints: [base],
      message:
        config.status === "mock"
          ? "Conexión WS simulada en Mock Mode. Especifica URL wss:// y activa para streaming live."
          : "Error de URL WebSocket: debe comenzar por ws:// o wss://.",
      timestamp: new Date().toISOString(),
      mode: "simulated",
    };
  }

  async fetchDataset(params: ProviderFetchParams): Promise<ProviderDatasetResult> {
    const isLiveConfigured =
      params.config.status === "active" &&
      (params.config.baseUrl.startsWith("ws://") ||
        params.config.baseUrl.startsWith("wss://"));

    if (isLiveConfigured) {
      // TODO: Conectar llamada real a API / WebSocket stream y volcar buffer de ticks en el esquema unificado
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
