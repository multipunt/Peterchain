import { NextRequest, NextResponse } from "next/server";
import {
  loadSystemConfig,
  resetSystemConfig,
  saveSystemConfig,
} from "@/lib/store/configStore";
import type { SystemConfig } from "@/lib/types/onchain";

export async function GET() {
  const config = loadSystemConfig();
  return NextResponse.json(config, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<SystemConfig>;
    const updated = saveSystemConfig(body);
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("[API /config PUT] Error:", error);
    return NextResponse.json(
      { error: "Payload de configuración inválido." },
      { status: 400 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { action?: string };
    if (body.action === "reset") {
      const defaults = resetSystemConfig();
      return NextResponse.json(defaults, { status: 200 });
    }
    return NextResponse.json(
      { error: "Acción no soportada. Usa { action: 'reset' }." },
      { status: 400 }
    );
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
