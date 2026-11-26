import type {
  AssetSymbol,
  MarketScenario,
  MetricKey,
  MetricMappingConfig,
  ProviderConfig,
  ProviderId,
  ProviderTestResult,
  Timeframe,
} from "@/lib/types/onchain";
import type { RawOnchainDataset } from "@/mock/onchainGenerator";

export interface ProviderFetchParams {
  asset: AssetSymbol;
  timeframe: Timeframe;
  scenario: MarketScenario;
  config: ProviderConfig;
  mappings: MetricMappingConfig[];
}

export interface ProviderDatasetResult {
  dataset: RawOnchainDataset;
  mode: "live" | "mock_fallback" | "mock";
  providerId: ProviderId;
}

/**
 * Contrato de interfaz desacoplado (Adapter / Provider Pattern).
 * Cualquier proveedor onchain (Glassnode, CryptoQuant, Coinglass, nodo propio, etc.)
 * debe implementar esta interfaz para devolver datos normalizados al esquema unificado.
 */
export interface IOnchainDataProvider {
  readonly id: ProviderId;
  readonly name: string;
  readonly supportedMetrics: MetricKey[];

  /**
   * Valida conectividad, credenciales y compatibilidad de schema del proveedor.
   */
  testConnection(config: ProviderConfig): Promise<ProviderTestResult>;

  /**
   * Obtiene y normaliza las series temporales onchain al formato unificado del sistema.
   */
  fetchDataset(params: ProviderFetchParams): Promise<ProviderDatasetResult>;
}

export const ALL_METRIC_KEYS: MetricKey[] = [
  "PRECIO",
  "RP_STH",
  "RP_LTH",
  "URPD",
  "MVRV_STH",
  "MVRV_LTH",
  "SOPR_STH",
  "SOPR_LTH",
  "EXCHANGE_INFLOWS",
  "EXCHANGE_OUTFLOWS",
  "CPI",
  "WHALE_ACCUMULATION",
  "UTXO_AGE_BANDS",
  "CEX_RESERVES",
  "ACTIVE_ADDRESSES",
  "TX_VOLUME",
  "NUPL",
];
