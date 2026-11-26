import type {
  AssetSymbol,
  MarketSentimentState,
  RuleThresholdsConfig,
  SentimentFlowPoint,
} from "@/lib/types/onchain";
import { formatCompactNumber, formatPct, formatRatio } from "@/lib/utils";

/**
 * Clasificador semafórico de estado de mercado (Panel 2):
 * 1. Punto de Euforia (CPI pico + SOPR STH pico + Inflows disparados)
 * 2. Sobreoptimismo / Venta de grandes
 * 3. Continuación alcista saludable (SOPR alto con inflows bajos / outflows netos)
 * 4. Apatía / Zona de acumulación
 */
export function classifyMarketSentiment(
  series: SentimentFlowPoint[],
  thresholds: RuleThresholdsConfig,
  asset: AssetSymbol
): MarketSentimentState {
  const latest = series[series.length - 1];
  const avgInflow =
    series.reduce((sum, p) => sum + p.exchangeInflows, 0) / Math.max(1, series.length);

  const cpiHigh = latest.cpi >= thresholds.cpiPeakPct;
  const cpiPositive = latest.cpi > 0.02;
  const soprHigh = latest.soprSth >= thresholds.soprSthPeak;
  const soprHealthy = latest.soprSth >= 1.015 && latest.soprSth < thresholds.soprSthPeak;
  const inflowsSpiking =
    latest.exchangeNetflow > avgInflow * 0.16 && latest.exchangeInflows > avgInflow * 1.12;
  const inflowsLowOrOutflow = latest.exchangeNetflow <= avgInflow * 0.05;

  const signals: MarketSentimentState["signals"] = [
    {
      key: "cpi",
      label: "Coinbase Premium (CPI)",
      valueFormatted: formatPct(latest.cpi, true, 3),
      status: cpiHigh ? "danger" : cpiPositive ? "bull" : latest.cpi < -0.05 ? "neutral" : "warn",
      detail: cpiHigh
        ? `Pico institucional (> ${thresholds.cpiPeakPct.toFixed(2)}%)`
        : cpiPositive
        ? "Demanda spot US positiva"
        : "Prima débil / descuento spot US",
    },
    {
      key: "soprSth",
      label: "SOPR STH",
      valueFormatted: formatRatio(latest.soprSth, 4),
      status: soprHigh
        ? "danger"
        : soprHealthy
        ? "bull"
        : latest.soprSth < 0.995
        ? "neutral"
        : "warn",
      detail: soprHigh
        ? `Toma de beneficios extrema (> ${thresholds.soprSthPeak.toFixed(2)})`
        : latest.soprSth >= 1.0
        ? "STH realizando beneficios sostenibles"
        : "STH vendiendo en pérdidas / capitulación",
    },
    {
      key: "netInflows",
      label: "Flujo Neto CEX",
      valueFormatted: `${latest.exchangeNetflow > 0 ? "+" : ""}${formatCompactNumber(
        latest.exchangeNetflow,
        1
      )} ${asset}`,
      status: inflowsSpiking ? "danger" : inflowsLowOrOutflow ? "bull" : "warn",
      detail: inflowsSpiking
        ? "Inflows disparados hacia exchanges"
        : latest.exchangeNetflow < 0
        ? "Retiradas netas (presión compradora)"
        : "Presión vendedora moderada",
    },
  ];

  // 1. Punto de Euforia
  if (cpiHigh && soprHigh && inflowsSpiking) {
    return {
      regime: "EUPHORIA",
      label: "Punto de Euforia",
      shortLabel: "EUFORIA",
      description:
        "Convergencia crítica: CPI en pico institucional, SOPR STH sobrecalentado e Inflows disparados hacia exchanges. Alta probabilidad de techo local o barrido de apalancamiento.",
      trafficColor: "red",
      convictionScore: 92,
      signals,
    };
  }

  // 2. Sobreoptimismo / Venta de grandes
  if ((soprHigh && inflowsSpiking) || (cpiHigh && inflowsSpiking) || (soprHigh && cpiHigh)) {
    return {
      regime: "OVEROPTIMISM",
      label: "Sobreoptimismo / Venta de grandes",
      shortLabel: "SOBREOPTIMISMO",
      description:
        "Toma agresiva de beneficios o entrada significativa de monedas a CEX en medio de prima elevada. Distribución táctica de grandes tenedores en curso.",
      trafficColor: "amber",
      convictionScore: 76,
      signals,
    };
  }

  // 3. Continuación alcista saludable
  if (latest.soprSth >= 1.01 && inflowsLowOrOutflow) {
    return {
      regime: "HEALTHY_BULL",
      label: "Continuación alcista saludable",
      shortLabel: "ALCISTA SALUDABLE",
      description:
        "SOPR STH en zona rentable acompañado de inflows bajos o salidas netas de exchanges. El mercado absorbe beneficios sin presión de venta estructural.",
      trafficColor: "emerald",
      convictionScore: 84,
      signals,
    };
  }

  // 4. Apatía / Zona de acumulación
  return {
    regime: "APATHY_ACCUMULATION",
    label: "Apatía / Zona de acumulación",
    shortLabel: "ACUMULACIÓN",
    description:
      "Sentimiento enfriado con SOPR cercano o inferior a 1.0 y prima de Coinbase contenida. Históricamente favorable para acumulación escalonada.",
    trafficColor: "cyan",
    convictionScore: 71,
    signals,
  };
}
