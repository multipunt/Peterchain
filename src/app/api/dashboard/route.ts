import { NextRequest, NextResponse } from "next/server";
import { buildUnifiedDashboardPayload } from "@/lib/providers/registry";
import { loadSystemConfig } from "@/lib/store/configStore";
import type {
  AssetSymbol,
  MarketScenario,
  Timeframe,
} from "@/lib/types/onchain";

const VALID_ASSETS: AssetSymbol[] = ["BTC", "ETH", "SOL"];
const VALID_TIMEFRAMES: Timeframe[] = ["24h", "7d", "30d", "1y", "cycle"];
const VALID_SCENARIOS: MarketScenario[] = [
  "auto",
  "healthy_bull",
  "euphoria_top",
  "rp_sth_support",
  "structural_floor",
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assetParam = (searchParams.get("asset") ?? "BTC").toUpperCase() as AssetSymbol;
    const timeframeParam = (searchParams.get("timeframe") ?? "30d") as Timeframe;
    const scenarioParam = (searchParams.get("scenario") ?? "auto") as MarketScenario;

    const asset = VALID_ASSETS.includes(assetParam) ? assetParam : "BTC";
    const timeframe = VALID_TIMEFRAMES.includes(timeframeParam) ? timeframeParam : "30d";
    const scenario = VALID_SCENARIOS.includes(scenarioParam) ? scenarioParam : "auto";

    const config = loadSystemConfig();
    const payload = await buildUnifiedDashboardPayload(
      asset,
      timeframe,
      scenario,
      config
    );

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[API /dashboard] Error:", error);
    return NextResponse.json(
      { error: "No se pudieron obtener los indicadores onchain." },
      { status: 500 }
    );
  }
}
