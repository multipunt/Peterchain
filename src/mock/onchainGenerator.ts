import type {
  AccumulationNetworkPoint,
  AssetSymbol,
  MacroCyclePoint,
  MarketScenario,
  PriceStructurePoint,
  SentimentFlowPoint,
  Timeframe,
  UrpdBucket,
} from "@/lib/types/onchain";

export interface RawOnchainDataset {
  asset: AssetSymbol;
  timeframe: Timeframe;
  scenario: MarketScenario;
  priceStructure: PriceStructurePoint[];
  urpd: UrpdBucket[];
  sentimentFlows: SentimentFlowPoint[];
  accumulationNetwork: AccumulationNetworkPoint[];
  macroCycle: MacroCyclePoint[];
}

interface AssetProfile {
  basePrice: number;
  baseRpSth: number;
  baseRpLth: number;
  baseCexReserves: number;
  baseDailyFlow: number;
  baseActiveAddresses: number;
  baseTxVolumeUsdB: number;
  urpdTotalSupplyCluster: number;
}

const ASSET_PROFILES: Record<AssetSymbol, AssetProfile> = {
  BTC: {
    basePrice: 94200,
    baseRpSth: 85800,
    baseRpLth: 36400,
    baseCexReserves: 2_310_000,
    baseDailyFlow: 26500,
    baseActiveAddresses: 912_000,
    baseTxVolumeUsdB: 38.4,
    urpdTotalSupplyCluster: 19_780_000,
  },
  ETH: {
    basePrice: 3480,
    baseRpSth: 3190,
    baseRpLth: 1840,
    baseCexReserves: 14_900_000,
    baseDailyFlow: 310_000,
    baseActiveAddresses: 618_000,
    baseTxVolumeUsdB: 18.7,
    urpdTotalSupplyCluster: 120_400_000,
  },
  SOL: {
    basePrice: 214,
    baseRpSth: 189,
    baseRpLth: 78,
    baseCexReserves: 48_200_000,
    baseDailyFlow: 1_950_000,
    baseActiveAddresses: 3_420_000,
    baseTxVolumeUsdB: 11.2,
    urpdTotalSupplyCluster: 472_000_000,
  },
};

interface TimeframeConfig {
  points: number;
  stepMs: number;
  volatility: number;
  labelFormat: "hour" | "day" | "month" | "year";
}

const TIMEFRAME_CONFIG: Record<Timeframe, TimeframeConfig> = {
  "24h": { points: 48, stepMs: 30 * 60 * 1000, volatility: 0.018, labelFormat: "hour" },
  "7d": { points: 56, stepMs: 3 * 60 * 60 * 1000, volatility: 0.045, labelFormat: "day" },
  "30d": { points: 60, stepMs: 12 * 60 * 60 * 1000, volatility: 0.11, labelFormat: "day" },
  "1y": { points: 73, stepMs: 5 * 24 * 60 * 60 * 1000, volatility: 0.34, labelFormat: "month" },
  cycle: { points: 96, stepMs: 15 * 24 * 60 * 60 * 1000, volatility: 0.68, labelFormat: "year" },
};

/**
 * Deterministic PRNG (Mulberry32) so server and client renders stay coherent
 * while allowing asset/timeframe/scenario variations.
 */
function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function formatDateLabel(ts: number, mode: TimeframeConfig["labelFormat"]): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  if (mode === "hour") {
    return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  }
  if (mode === "day") {
    return `${pad(d.getUTCDate())} ${months[d.getUTCMonth()]}`;
  }
  if (mode === "month") {
    return `${pad(d.getUTCDate())} ${months[d.getUTCMonth()]}`;
  }
  return `${months[d.getUTCMonth()]} '${String(d.getUTCFullYear()).slice(-2)}`;
}

function classifyMacroPhase(nupl: number): MacroCyclePoint["macroPhase"] {
  if (nupl < 0) return "Capitulación";
  if (nupl < 0.25) return "Esperanza / Miedo";
  if (nupl < 0.5) return "Optimismo";
  if (nupl < 0.72) return "Creencia";
  return "Euforia / Codicia";
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function round(v: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(v * factor) / factor;
}

/**
 * Generates mathematically correlated, realistic onchain time series across
 * all 4 dashboard panels. Adapts cleanly to asset, timeframe, and scenario.
 */
export function generateCoherentOnchainDataset(
  asset: AssetSymbol,
  timeframe: Timeframe,
  scenario: MarketScenario = "auto"
): RawOnchainDataset {
  const profile = ASSET_PROFILES[asset];
  const tf = TIMEFRAME_CONFIG[timeframe];
  const rand = createSeededRandom(hashSeed(`${asset}-${timeframe}-${scenario}-v1`));

  // Anchor to current UTC hour so refreshes remain smooth
  const now = Math.floor(Date.now() / (15 * 60 * 1000)) * (15 * 60 * 1000);
  const startTs = now - (tf.points - 1) * tf.stepMs;

  // Scenario modifiers controlling tail-end market regime
  const scenarioBias = {
    auto: {
      priceTargetMult: 1.0,
      rpSthRatio: 0.915,
      cpiBias: 0.055,
      inflowBias: -0.22, // net outflow (bullish)
      soprBias: 1.038,
      whaleBias: 0.78,
      nuplEnd: 0.58,
    },
    healthy_bull: {
      priceTargetMult: 1.04,
      rpSthRatio: 0.89,
      cpiBias: 0.075,
      inflowBias: -0.35, // strong CEX withdrawals
      soprBias: 1.045,
      whaleBias: 0.86,
      nuplEnd: 0.61,
    },
    euphoria_top: {
      priceTargetMult: 1.29,
      rpSthRatio: 0.71, // MVRV STH > 1.40
      cpiBias: 0.21, // CPI spike
      inflowBias: 0.44, // heavy exchange inflows
      soprBias: 1.13, // SOPR STH peak
      whaleBias: 0.24, // whales distributing
      nuplEnd: 0.78, // macro euphoria
    },
    rp_sth_support: {
      priceTargetMult: 0.925,
      rpSthRatio: 0.988, // Price sitting right on RP STH (~1.2% spread)
      cpiBias: 0.015,
      inflowBias: -0.18,
      soprBias: 1.004,
      whaleBias: 0.81,
      nuplEnd: 0.48,
    },
    structural_floor: {
      priceTargetMult: 0.37,
      rpSthRatio: 1.18, // Price below RP STH & near/below RP LTH
      cpiBias: -0.14,
      inflowBias: -0.08,
      soprBias: 0.94,
      whaleBias: 0.91,
      nuplEnd: -0.09,
    },
  }[scenario];

  const priceStructure: PriceStructurePoint[] = [];
  const sentimentFlows: SentimentFlowPoint[] = [];
  const accumulationNetwork: AccumulationNetworkPoint[] = [];
  const macroCycle: MacroCyclePoint[] = [];

  let cumulativeReserves = profile.baseCexReserves;
  let smoothPrice =
    timeframe === "cycle"
      ? profile.basePrice * 0.24
      : timeframe === "1y"
      ? profile.basePrice * 0.56
      : profile.basePrice * (0.94 * scenarioBias.priceTargetMult);

  let smoothRpSth =
    timeframe === "cycle"
      ? profile.basePrice * 0.28
      : timeframe === "1y"
      ? profile.baseRpSth * 0.66
      : profile.baseRpSth;

  let smoothRpLth =
    timeframe === "cycle"
      ? profile.baseRpLth * 0.54
      : timeframe === "1y"
      ? profile.baseRpLth * 0.78
      : profile.baseRpLth * 0.97;

  const endPriceTarget = profile.basePrice * scenarioBias.priceTargetMult;

  for (let i = 0; i < tf.points; i++) {
    const progress = i / Math.max(1, tf.points - 1);
    const ts = startTs + i * tf.stepMs;
    const dateLabel = formatDateLabel(ts, tf.labelFormat);

    // Construct realistic multi-harmonic price curve
    let targetAtPoint: number;
    if (timeframe === "cycle") {
      // Full 4-year cycle shape: bear bottom -> recovery -> mid-cycle consolidation -> bull expansion
      const bearDip = -0.18 * Math.exp(-Math.pow((progress - 0.18) / 0.12, 2));
      const rally = Math.pow(progress, 1.45) * 0.95;
      const midWave = 0.085 * Math.sin(progress * Math.PI * 5.2);
      const localNoise = (rand() - 0.5) * 0.06;
      const cycleCurve = clamp(0.24 + bearDip + rally + midWave + localNoise, 0.16, 1.32);
      targetAtPoint = endPriceTarget * (cycleCurve / 1.12);
    } else {
      const drift =
        smoothPrice + (endPriceTarget - smoothPrice) * (0.06 + progress * 0.16);
      const wave =
        Math.sin(progress * Math.PI * 3.5 + 0.6) * endPriceTarget * tf.volatility * 0.28;
      const microNoise = (rand() - 0.5) * endPriceTarget * tf.volatility * 0.24;
      targetAtPoint = Math.max(profile.basePrice * 0.15, drift + wave * 0.14 + microNoise);
    }

    // Smoothly converge final points to scenario targets
    const tailPull = Math.pow(progress, 4);
    smoothPrice = smoothPrice * 0.65 + targetAtPoint * 0.35;
    const price = round(
      smoothPrice * (1 - tailPull * 0.45) + endPriceTarget * (tailPull * 0.45),
      asset === "BTC" ? 0 : 2
    );

    // Realized Price STH lags spot price moderately
    const targetRpSth = price * scenarioBias.rpSthRatio;
    smoothRpSth = smoothRpSth * 0.88 + targetRpSth * 0.12;
    const rpSth = round(
      smoothRpSth * (1 - tailPull * 0.35) +
        endPriceTarget * scenarioBias.rpSthRatio * (tailPull * 0.35),
      asset === "BTC" ? 0 : 2
    );

    // Realized Price LTH moves slowly and rises during bull expansion
    const targetRpLth =
      scenario === "structural_floor"
        ? endPriceTarget * 1.07 // puts MVRV LTH oscillator < 0
        : profile.baseRpLth * (timeframe === "cycle" ? 0.54 + progress * 0.46 : 0.97 + progress * 0.03);
    smoothRpLth = smoothRpLth * 0.94 + targetRpLth * 0.06;
    const rpLth = round(smoothRpLth, asset === "BTC" ? 0 : 2);

    // MVRV STH = Spot / RP_STH (1.0 = breakeven, >1.35 = overheated resistance)
    const mvrvSth = round(price / Math.max(1, rpSth), 3);

    // MVRV LTH structural oscillator: (Spot - RP_LTH) / RP_LTH
    // Values < 0 mean Spot is below LTH Realized Price (historic structural floor!)
    const mvrvLth = round((price - rpLth) / Math.max(1, rpLth), 3);

    priceStructure.push({
      timestamp: ts,
      dateLabel,
      price,
      rpSth,
      rpLth,
      mvrvSth,
      mvrvLth,
    });

    // ---- Panel 2: Sentiment & Selling Pressure ----
    const momentum = (mvrvSth - 1) * 0.62;
    const soprRaw =
      1.0 +
      momentum * 0.36 +
      (scenarioBias.soprBias - 1.0) * (0.35 + 0.65 * tailPull) +
      (rand() - 0.5) * 0.025;
    const soprSth = round(clamp(soprRaw, 0.88, 1.24), 4);

    // Coinbase Premium Index (%)
    const cpiRaw =
      scenarioBias.cpiBias * (0.4 + 0.6 * progress) +
      Math.sin(progress * Math.PI * 4) * 0.045 +
      (rand() - 0.5) * 0.035;
    const cpi = round(clamp(cpiRaw, -0.28, 0.34), 3);

    // Exchange Inflows & Outflows (native coins)
    const flowScale =
      timeframe === "24h" ? 0.05 : timeframe === "7d" ? 0.16 : 1.0;
    const baseFlow = profile.baseDailyFlow * flowScale;
    const activityBoost = 0.8 + Math.abs(mvrvSth - 1) * 1.1 + rand() * 0.35;
    const bias = scenarioBias.inflowBias * (0.35 + 0.65 * tailPull);

    // At the tail of healthy_bull or auto, inject a noticeable institutional CEX withdrawal event
    const withdrawalPulse =
      (scenario === "auto" || scenario === "healthy_bull") && i >= tf.points - 3
        ? 0.42
        : 0;

    const exchangeInflows = round(
      baseFlow * activityBoost * clamp(1 + bias * 0.65 + (rand() - 0.5) * 0.22, 0.45, 2.2),
      0
    );
    const exchangeOutflows = round(
      baseFlow *
        activityBoost *
        clamp(1 - bias * 0.65 + withdrawalPulse + (rand() - 0.5) * 0.22, 0.45, 2.4),
      0
    );
    const exchangeNetflow = round(exchangeInflows - exchangeOutflows, 0);

    sentimentFlows.push({
      timestamp: ts,
      dateLabel,
      soprSth,
      exchangeInflows,
      exchangeOutflows,
      exchangeNetflow,
      cpi,
    });

    // ---- Panel 3: Accumulation, Network & Coin Dynamics ----
    const whaleScore = round(
      clamp(
        0.52 +
          (scenarioBias.whaleBias - 0.52) * (0.4 + 0.6 * progress) +
          Math.sin(progress * Math.PI * 3.1) * 0.11 +
          (rand() - 0.5) * 0.06,
        0.08,
        0.98
      ),
      3
    );

    const whaleBalanceDelta = round(
      (whaleScore - 0.48) * profile.baseDailyFlow * 0.55 + (rand() - 0.5) * profile.baseDailyFlow * 0.08,
      0
    );

    cumulativeReserves = Math.max(
      profile.baseCexReserves * 0.68,
      cumulativeReserves + exchangeNetflow * 0.35
    );

    const activeAddresses = Math.round(
      profile.baseActiveAddresses *
        (0.84 + 0.22 * progress + Math.abs(cpi) * 0.9 + (rand() - 0.5) * 0.12)
    );
    const txVolumeUsdBillions = round(
      profile.baseTxVolumeUsdB *
        (0.72 + 0.38 * Math.min(1.5, mvrvSth) + (rand() - 0.5) * 0.2),
      2
    );

    // UTXO Age Bands (younger coins expand during euphoria, mature coins dominate during apathy/accumulation)
    const heatFactor = clamp((mvrvSth - 0.85) / 0.65, 0, 1);
    const lt1m = round(6.5 + heatFactor * 8.2 + (rand() - 0.5) * 0.5, 1);
    const m1_3 = round(8.0 + heatFactor * 6.4 + (rand() - 0.5) * 0.5, 1);
    const m3_6 = round(10.5 + heatFactor * 3.2 + (rand() - 0.5) * 0.4, 1);
    const m6_1y = round(14.0 - heatFactor * 2.1 + (rand() - 0.5) * 0.4, 1);
    const y1_2 = round(21.5 - heatFactor * 5.8 + (rand() - 0.5) * 0.4, 1);
    const gt2y = round(Math.max(18, 100 - (lt1m + m1_3 + m3_6 + m6_1y + y1_2)), 1);

    accumulationNetwork.push({
      timestamp: ts,
      dateLabel,
      whaleScore,
      whaleBalanceDelta,
      cexReserves: Math.round(cumulativeReserves),
      activeAddresses,
      txVolumeUsdBillions,
      ageBand_lt1m: lt1m,
      ageBand_1m_3m: m1_3,
      ageBand_3m_6m: m3_6,
      ageBand_6m_1y: m6_1y,
      ageBand_1y_2y: y1_2,
      ageBand_gt2y: gt2y,
    });

    // ---- Panel 4: Macro Cycle (NUPL & SOPR LTH) ----
    const structuralNupl = (price - (rpLth * 0.62 + rpSth * 0.38)) / Math.max(1, price);
    const nupl = round(
      clamp(
        structuralNupl * (1 - tailPull * 0.35) + scenarioBias.nuplEnd * (tailPull * 0.35),
        -0.25,
        0.86
      ),
      3
    );

    const soprLth = round(
      clamp(
        0.92 + Math.max(-0.2, nupl) * 1.95 + (mvrvSth > 1.28 ? 0.35 : 0) + (rand() - 0.5) * 0.08,
        0.65,
        3.15
      ),
      3
    );

    macroCycle.push({
      timestamp: ts,
      dateLabel,
      price,
      nupl,
      soprLth,
      macroPhase: classifyMacroPhase(nupl),
    });
  }

  // ---- URPD (UTXO Realized Price Distribution) Horizontal Histogram ----
  const latest = priceStructure[priceStructure.length - 1];
  const minBucketPrice = latest.price * 0.62;
  const maxBucketPrice = latest.price * 1.24;
  const bucketCount = 18;
  const bucketStep = (maxBucketPrice - minBucketPrice) / (bucketCount - 1);

  const rawBuckets: Array<{
    priceBucket: number;
    sthVolume: number;
    lthVolume: number;
  }> = [];

  for (let b = 0; b < bucketCount; b++) {
    const p = minBucketPrice + b * bucketStep;
    const distSpot = Math.abs(p - latest.price) / latest.price;
    const distRpSth = Math.abs(p - latest.rpSth) / latest.price;
    const distLowerShelf = Math.abs(p - latest.price * 0.78) / latest.price;
    const distResistance = Math.abs(p - latest.price * 1.12) / latest.price;

    // Concentrated liquidity clusters at Spot, RP STH, lower accumulation shelf, and overhead resistance
    const spotCluster = Math.exp(-Math.pow(distSpot / 0.045, 2)) * 1.05;
    const sthSupportWall = Math.exp(-Math.pow(distRpSth / 0.055, 2)) * 1.25;
    const lthShelf = Math.exp(-Math.pow(distLowerShelf / 0.07, 2)) * 0.88;
    const overheadWall = Math.exp(-Math.pow(distResistance / 0.05, 2)) * 0.62;

    const totalWeight =
      0.14 + spotCluster + sthSupportWall + lthShelf + overheadWall + rand() * 0.18;
    const totalVol = profile.urpdTotalSupplyCluster * 0.018 * totalWeight;

    // Below RP STH has higher LTH share; near/above spot has higher STH share
    const sthRatio = clamp(0.18 + (p / latest.price - 0.65) * 1.05, 0.12, 0.86);
    rawBuckets.push({
      priceBucket: round(p, asset === "BTC" ? 0 : 1),
      sthVolume: round(totalVol * sthRatio, 0),
      lthVolume: round(totalVol * (1 - sthRatio), 0),
    });
  }

  const grandTotalUrpd = rawBuckets.reduce(
    (acc, item) => acc + item.sthVolume + item.lthVolume,
    0
  );

  // Identify closest bucket to current spot price
  let closestIdx = 0;
  let minDiff = Infinity;
  rawBuckets.forEach((b, idx) => {
    const diff = Math.abs(b.priceBucket - latest.price);
    if (diff < minDiff) {
      minDiff = diff;
      closestIdx = idx;
    }
  });

  const urpd: UrpdBucket[] = rawBuckets
    .map((b, idx) => {
      const vol = b.sthVolume + b.lthVolume;
      const isCurrentPrice = idx === closestIdx;
      const zone: UrpdBucket["zone"] = isCurrentPrice
        ? "spot"
        : b.priceBucket < latest.price
        ? "support"
        : "resistance";
      return {
        priceBucket: b.priceBucket,
        priceLabel:
          asset === "BTC"
            ? `$${(b.priceBucket / 1000).toFixed(1)}k`
            : `$${b.priceBucket.toFixed(0)}`,
        volumeNative: vol,
        sthVolume: b.sthVolume,
        lthVolume: b.lthVolume,
        sharePct: round((vol / Math.max(1, grandTotalUrpd)) * 100, 2),
        isCurrentPrice,
        zone,
      };
    })
    .reverse(); // Highest price at top like an orderbook/volume profile

  return {
    asset,
    timeframe,
    scenario,
    priceStructure,
    urpd,
    sentimentFlows,
    accumulationNetwork,
    macroCycle,
  };
}
