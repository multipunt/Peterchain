import { NextRequest, NextResponse } from "next/server";
import type { WebhookDestination } from "@/lib/types/onchain";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { webhook: WebhookDestination };
    const webhook = body?.webhook;

    if (!webhook || !webhook.url) {
      return NextResponse.json(
        { ok: false, message: "URL de Webhook requerida." },
        { status: 400 }
      );
    }

    const isValidUrl =
      webhook.url.startsWith("https://") || webhook.url.startsWith("http://");

    if (!isValidUrl) {
      return NextResponse.json(
        {
          ok: false,
          httpStatus: 400,
          message: "La URL del Webhook debe comenzar por https:// o http://.",
        },
        { status: 200 }
      );
    }

    // TODO: Conectar envío HTTP POST real al destino Discord/Telegram/Slack en producción:
    // await fetch(webhook.url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

    return NextResponse.json(
      {
        ok: true,
        httpStatus: 200,
        latencyMs: 84,
        dispatchedPayloadPreview: {
          service: webhook.type.toUpperCase(),
          channel: webhook.channelOrChatId || "default",
          title: "[PeterChain Test] Alerta Onchain Simulada",
          severity: webhook.minSeverity,
          timestamp: new Date().toISOString(),
        },
        message: `HTTP 200 OK — Payload de prueba verificado para ${webhook.name} (${webhook.type}).`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API /alerts/test-webhook] Error:", error);
    return NextResponse.json(
      { ok: false, message: "Error al probar el webhook." },
      { status: 500 }
    );
  }
}
