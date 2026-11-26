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
 * Adaptador Sandbox / Mock interno.
 * Permite navegar y probar el 100% del terminal y el motor de alertas
 * sin necesidad de configurar APIs de pago inmediatamente.
 */
export class MockAdapter implements IOnchainDataProvider {
  readonly id = "mock" as const;
  readonly name = "Sandbox Mock Engine";
  readonly supportedMetrics = ALL_METRIC_KEYS;

  async testConnection(_config: ProviderConfig): Promise<ProviderTestResult> {
    return {
      ok: true,
      httpStatus: 200,
      latencyMs: 12,
      schemaValid: true,
      checkedEndpoints: ["internal://sandbox/onchain-series", "internal://sandbox/urpd"],
      message:
        "Motor Sandbox activo. Series onchain coherentes y validadas contra esquema unificado v1.",
      timestamp: new Date().toISOString(),
      mode: "simulated",
    };
  }

  async fetchDataset(params: ProviderFetchParams): Promise<ProviderDatasetResult> {
    const dataset = generateCoherentOnchainDataset(
      params.asset,
      params.timeframe,
      params.scenario
    );
    return {
      dataset,
      mode: "mock",
      providerId: this.id,
    };
  }
}
