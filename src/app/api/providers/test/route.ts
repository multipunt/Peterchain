import { NextRequest, NextResponse } from "next/server";
import { runProviderConnectionTest } from "@/lib/providers/registry";
import { loadSystemConfig, saveSystemConfig } from "@/lib/store/configStore";
import type { ProviderConfig } from "@/lib/types/onchain";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { provider: ProviderConfig };
    if (!body?.provider?.id) {
      return NextResponse.json(
        { error: "Falta el objeto provider a validar." },
        { status: 400 }
      );
    }

    const result = await runProviderConnectionTest(body.provider);

    // Update lastTestedAt & lastTestResult in store
    const current = loadSystemConfig();
    const updatedProviders = current.providers.map((p) =>
      p.id === body.provider.id
        ? {
            ...p,
            ...body.provider,
            lastTestedAt: result.timestamp,
            lastTestResult: result,
          }
        : p
    );
    saveSystemConfig({ providers: updatedProviders });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[API /providers/test] Error:", error);
    return NextResponse.json(
      { error: "Error ejecutando prueba de conexión del proveedor." },
      { status: 500 }
    );
  }
}
