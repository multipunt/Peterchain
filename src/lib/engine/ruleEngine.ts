import type {
  AlertSeverity,
  AssetSymbol,
  MarketSentimentState,
  OnchainAlert,
  RuleThresholdsConfig,
  WebhookDestination,
} from "@/lib/types/onchain";
import { formatCompactNumber, formatCurrency, formatPct, formatRatio } from "@/lib/utils";
import type { RawOnchainDataset } from "@/mock/onchainGenerator";

const SEVERITY_RANK: Record<AlertSeverity, number> = {
  INFO: 1,
  BULLISH: 2,
  WARNING: 3,
  CRITICAL: 4,
};

function resolveMatchingWebhooks(
  severity: AlertSeverity,
  webhooks: WebhookDestination[]
): string[] {
  return webhooks
    .filter(
      (wh) => wh.enabled && SEVERITY_RANK[severity] >= SEVERITY_RANK[wh.minSeverity]
    )
    .map((wh) => wh.name);
}

/**
 * Motor de evaluación de reglas onchain en tiempo real.
 * Evalúa las métricas unificadas frente a los umbrales configurados en Back Office
 * y genera tarjetas de alerta listas para el Feed en vivo y despacho de Webhooks.
 */
export function evaluateOnchainRules(
  dataset: RawOnchainDataset,
  sentimentState: MarketSentimentState,
  thresholds: RuleThresholdsConfig,
  webhooks: WebhookDestination[]
): OnchainAlert[] {
  const alerts: OnchainAlert[] = [];
  const asset: AssetSymbol = dataset.asset;

  const latestPrice = dataset.priceStructure[dataset.priceStructure.length - 1];
  const latestSentiment = dataset.sentimentFlows[dataset.sentimentFlows.length - 1];
  const latestAccum =
    dataset.accumulationNetwork[dataset.accumulationNetwork.length - 1];
  const latestMacro = dataset.macroCycle[dataset.macroCycle.length - 1];

  // Scale BTC outflow threshold proportionally for ETH/SOL native coin counts
  const outflowAssetMultiplier = asset === "BTC" ? 1 : asset === "ETH" ? 12 : 70;
  const scaledOutflowThreshold =
    thresholds.cexMassiveOutflowThreshold * outflowAssetMultiplier;

  const nowIso = new Date().toISOString();
  const makeTimestamp = (minutesAgo: number) =>
    new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();

  // Rule 1: Soporte Confirmado / Proximidad a Realized Price STH
  const rpSthSpreadPct =
    ((latestPrice.price - latestPrice.rpSth) / Math.max(1, latestPrice.rpSth)) * 100;
  if (
    thresholds.enabledRules.rpSthSupport &&
    Math.abs(rpSthSpreadPct) <= thresholds.rpSthProximityPct
  ) {
    const severity: AlertSeverity = rpSthSpreadPct >= 0 ? "BULLISH" : "WARNING";
    alerts.push({
      id: `alert-rp-sth-${asset}`,
      ruleId: "rpSthSupport",
      title:
        rpSthSpreadPct >= 0
          ? "Soporte Confirmado en RP STH"
          : "Ruptura Temporal bajo RP STH",
      message:
        rpSthSpreadPct >= 0
          ? `El precio spot (${formatCurrency(
              latestPrice.price
            )}) defiende la base de coste de Short-Term Holders (${formatCurrency(
              latestPrice.rpSth
            )}) dentro del rango de ${thresholds.rpSthProximityPct}%.`
          : `El precio cotiza ${formatPct(
              Math.abs(rpSthSpreadPct),
              false
            )} por debajo del RP STH (${formatCurrency(
              latestPrice.rpSth
            )}). Vigilar recuperación de soporte.`,
      severity,
      panel: 1,
      metricKey: "RP_STH",
      currentValue: `${formatCurrency(latestPrice.price)} (${formatPct(rpSthSpreadPct)})`,
      thresholdValue: `±${thresholds.rpSthProximityPct.toFixed(1)}% vs RP STH`,
      timestamp: makeTimestamp(2),
      dispatchedWebhooks: resolveMatchingWebhooks(severity, webhooks),
    });
  }

  // Rule 2: Riesgo de Rechazo en Resistencia (MVRV STH > threshold)
  if (
    thresholds.enabledRules.mvrvSthResistance &&
    latestPrice.mvrvSth >= thresholds.mvrvSthOverbought
  ) {
    const severity: AlertSeverity = "CRITICAL";
    alerts.push({
      id: `alert-mvrv-sth-${asset}`,
      ruleId: "mvrvSthResistance",
      title: "Riesgo de Rechazo en Resistencia",
      message: `MVRV STH ha alcanzado ${formatRatio(
        latestPrice.mvrvSth,
        2
      )}, superando el umbral crítico de sobrecompra (${thresholds.mvrvSthOverbought.toFixed(
        2
      )}). Beneficio latente STH en zona de distribución.`,
      severity,
      panel: 1,
      metricKey: "MVRV_STH",
      currentValue: formatRatio(latestPrice.mvrvSth, 3),
      thresholdValue: `> ${thresholds.mvrvSthOverbought.toFixed(2)}`,
      timestamp: makeTimestamp(4),
      dispatchedWebhooks: resolveMatchingWebhooks(severity, webhooks),
    });
  } else if (
    thresholds.enabledRules.mvrvSthResistance &&
    latestPrice.mvrvSth >= thresholds.mvrvSthOverbought * 0.9
  ) {
    const severity: AlertSeverity = "WARNING";
    alerts.push({
      id: `alert-mvrv-sth-near-${asset}`,
      ruleId: "mvrvSthResistance",
      title: "Aproximación a Resistencia MVRV STH",
      message: `MVRV STH (${formatRatio(
        latestPrice.mvrvSth,
        2
      )}) se acerca al nivel crítico de ${thresholds.mvrvSthOverbought.toFixed(
        2
      )}. Monitorear aceleración de inflows a CEX.`,
      severity,
      panel: 1,
      metricKey: "MVRV_STH",
      currentValue: formatRatio(latestPrice.mvrvSth, 3),
      thresholdValue: `> ${thresholds.mvrvSthOverbought.toFixed(2)}`,
      timestamp: makeTimestamp(9),
      dispatchedWebhooks: resolveMatchingWebhooks(severity, webhooks),
    });
  }

  // Rule 3: Suelo Estructural MVRV LTH < threshold
  if (
    thresholds.enabledRules.mvrvLthFloor &&
    latestPrice.mvrvLth <= thresholds.mvrvLthFloor
  ) {
    const severity: AlertSeverity = "BULLISH";
    alerts.push({
      id: `alert-mvrv-lth-floor-${asset}`,
      ruleId: "mvrvLthFloor",
      title: "Zona de Suelo Estructural (MVRV LTH < 0)",
      message: `El oscilador MVRV LTH cayó a ${formatRatio(
        latestPrice.mvrvLth,
        2
      )}, situando el precio bajo la base de coste de Long-Term Holders (${formatCurrency(
        latestPrice.rpLth
      )}). Oportunidad generacional de ciclo.`,
      severity,
      panel: 1,
      metricKey: "MVRV_LTH",
      currentValue: formatRatio(latestPrice.mvrvLth, 3),
      thresholdValue: `<= ${thresholds.mvrvLthFloor.toFixed(2)}`,
      timestamp: makeTimestamp(3),
      dispatchedWebhooks: resolveMatchingWebhooks(severity, webhooks),
    });
  }

  // Rule 4: Alerta de Emergencia — Retiradas masivas de CEX
  const recentNetflows = dataset.sentimentFlows.slice(-4);
  const peakOutflowMag = Math.max(
    ...recentNetflows.map((p) => (p.exchangeNetflow < 0 ? Math.abs(p.exchangeNetflow) : 0))
  );
  // Adjust threshold slightly on intraday timeframes so meaningful shocks still surface
  const tfMultiplier =
    dataset.timeframe === "24h" ? 0.06 : dataset.timeframe === "7d" ? 0.2 : 1.0;
  const effectiveOutflowThreshold = scaledOutflowThreshold * tfMultiplier;

  if (
    thresholds.enabledRules.cexMassiveOutflow &&
    peakOutflowMag >= effectiveOutflowThreshold * 0.55
  ) {
    const isExtreme = peakOutflowMag >= effectiveOutflowThreshold;
    const severity: AlertSeverity = isExtreme ? "CRITICAL" : "BULLISH";
    alerts.push({
      id: `alert-cex-outflow-${asset}`,
      ruleId: "cexMassiveOutflow",
      title: "Alerta de Emergencia: Retiradas masivas de CEX",
      message: `Se registró una salida neta acelerada de ${formatCompactNumber(
        peakOutflowMag,
        1
      )} ${asset} desde exchanges hacia autocustodia. Reducción aguda de oferta líquida disponible.`,
      severity,
      panel: 2,
      metricKey: "EXCHANGE_OUTFLOWS",
      currentValue: `-${formatCompactNumber(peakOutflowMag, 1)} ${asset}`,
      thresholdValue: `> ${formatCompactNumber(effectiveOutflowThreshold, 1)} ${asset}`,
      timestamp: makeTimestamp(5),
      dispatchedWebhooks: resolveMatchingWebhooks(severity, webhooks),
    });
  }

  // Rule 5: Sentimiento / Punto de Euforia
  if (
    thresholds.enabledRules.euphoriaRisk &&
    (sentimentState.regime === "EUPHORIA" || sentimentState.regime === "OVEROPTIMISM")
  ) {
    const severity: AlertSeverity =
      sentimentState.regime === "EUPHORIA" ? "CRITICAL" : "WARNING";
    alerts.push({
      id: `alert-euphoria-${asset}`,
      ruleId: "euphoriaRisk",
      title:
        sentimentState.regime === "EUPHORIA"
          ? "Punto de Euforia: Riesgo de Distribución"
          : "Sobreoptimismo: Venta de Grandes Tenedores",
      message: `SOPR STH en ${formatRatio(
        latestSentiment.soprSth,
        3
      )} y CPI en ${formatPct(
        latestSentiment.cpi,
        true,
        3
      )}. Señal combinada de presión de venta táctica.`,
      severity,
      panel: 2,
      metricKey: "SOPR_STH",
      currentValue: `SOPR ${formatRatio(latestSentiment.soprSth, 3)} | CPI ${formatPct(
        latestSentiment.cpi
      )}`,
      thresholdValue: `SOPR > ${thresholds.soprSthPeak.toFixed(2)}`,
      timestamp: makeTimestamp(1),
      dispatchedWebhooks: resolveMatchingWebhooks(severity, webhooks),
    });
  }

  // Rule 6: Acumulación de Ballenas (>1,000 BTC cohort)
  if (
    thresholds.enabledRules.whaleAccumulation &&
    latestAccum.whaleScore >= thresholds.whaleAccumulationThreshold
  ) {
    const severity: AlertSeverity = "BULLISH";
    alerts.push({
      id: `alert-whale-acc-${asset}`,
      ruleId: "whaleAccumulation",
      title: "Acumulación Fuerte de Ballenas (>1,000 BTC)",
      message: `El índice Whale Accumulation Trend marca ${formatRatio(
        latestAccum.whaleScore,
        2
      )} con un delta neto positivo de +${formatCompactNumber(
        Math.max(0, latestAccum.whaleBalanceDelta),
        0
      )} ${asset}.`,
      severity,
      panel: 3,
      metricKey: "WHALE_ACCUMULATION",
      currentValue: formatRatio(latestAccum.whaleScore, 2),
      thresholdValue: `>= ${thresholds.whaleAccumulationThreshold.toFixed(2)}`,
      timestamp: makeTimestamp(14),
      dispatchedWebhooks: resolveMatchingWebhooks(severity, webhooks),
    });
  }

  // Rule 7: Ciclo Macro NUPL
  if (
    thresholds.enabledRules.nuplMacroZone &&
    latestMacro.nupl >= thresholds.nuplEuphoriaThreshold
  ) {
    const severity: AlertSeverity = "CRITICAL";
    alerts.push({
      id: `alert-nupl-macro-${asset}`,
      ruleId: "nuplMacroZone",
      title: "Ciclo Macro en Zona de Euforia (NUPL)",
      message: `NUPL superó ${thresholds.nuplEuphoriaThreshold.toFixed(
        2
      )} (actual: ${formatRatio(
        latestMacro.nupl,
        3
      )}) con SOPR LTH en ${formatRatio(
        latestMacro.soprLth,
        2
      )}. Fase histórica de distribución de ciclo tardío.`,
      severity,
      panel: 4,
      metricKey: "NUPL",
      currentValue: formatRatio(latestMacro.nupl, 3),
      thresholdValue: `>= ${thresholds.nuplEuphoriaThreshold.toFixed(2)}`,
      timestamp: makeTimestamp(6),
      dispatchedWebhooks: resolveMatchingWebhooks(severity, webhooks),
    });
  }

  // Always include a clean baseline informational heartbeat if few rules fired
  if (alerts.length < 3) {
    const severity: AlertSeverity = "INFO";
    alerts.push({
      id: `alert-regime-status-${asset}`,
      ruleId: "regimeMonitor",
      title: `Régimen Activo: ${sentimentState.label}`,
      message: `Soporte STH en ${formatCurrency(
        latestPrice.rpSth
      )} (${formatPct(rpSthSpreadPct)} vs spot) y fase macro NUPL en "${
        latestMacro.macroPhase
      }" (${formatRatio(latestMacro.nupl, 2)}).`,
      severity,
      panel: 4,
      metricKey: "NUPL",
      currentValue: `${latestMacro.macroPhase} (${formatRatio(latestMacro.nupl, 2)})`,
      thresholdValue: `NUPL < ${thresholds.nuplEuphoriaThreshold.toFixed(2)}`,
      timestamp: nowIso,
      dispatchedWebhooks: resolveMatchingWebhooks(severity, webhooks),
    });
  }

  // Sort by severity descending, then timestamp descending
  return alerts.sort(
    (a, b) =>
      SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] ||
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
