# PeterChain — Plataforma Modular de Visualización y Monitoreo Onchain

Aplicación web full-stack en **Next.js (App Router) + React + TypeScript + Tailwind CSS + Recharts + Lucide Icons** para el análisis multipanel de indicadores onchain y la administración desacoplada de proveedores de datos.

## Arquitectura General

- **Patrón Adapter / Provider Interface (`IOnchainDataProvider`)**: la capa visual consume únicamente un contrato unificado (`UnifiedDashboardPayload`) servido por `/api/dashboard`, desacoplando por completo los gráficos de la API subyacente.
- **Modo Sandbox / Mock Data coherente**: `src/mock/onchainGenerator.ts` genera series temporales correlacionadas (Precio, RP STH/LTH, URPD, MVRV STH/LTH, SOPR STH/LTH, Exchange Inflows/Outflows, CPI, Whale Accumulation, UTXO Age Bands, CEX Reserves, Actividad de Red y NUPL) para `BTC`, `ETH` y `SOL` en todos los marcos temporales (`24h`, `7d`, `30d`, `1y`, `Ciclo completo`).
- **Back Office (`/admin` y `/settings`)**:
  1. **Gestor de Proveedores**: plantillas preconfiguradas para *Glassnode*, *CryptoQuant*, *Coinglass*, *IntoTheBlock*, *Custom REST API* y *Custom WebSocket*, con estado (`Activo / Inactivo / Mock Mode`), credenciales, cabeceras personalizadas, polling (`5m / 1h / 24h`) y botón *Test Connection* (`/api/providers/test`).
  2. **Motor de Mapeo de Métricas**: permite asignar cada métrica del sistema (`PRECIO`, `RP_STH`, `MVRV_STH`, `SOPR_STH`, `EXCHANGE_INFLOWS`, `CPI`, etc.) a un proveedor distinto y configurar su endpoint y JSON path.
  3. **Gestor de Umbrales y Alertas**: calibración con sliders/inputs del motor de reglas (`src/lib/engine/ruleEngine.ts`) y configuración + prueba de destinos Webhook (Discord, Telegram, Slack, Custom HTTP).

## Estructura del Proyecto

```text
src/
├── app/
│   ├── page.tsx                         # Dashboard Multipanel
│   ├── admin/page.tsx                   # Back Office de configuración
│   ├── settings/page.tsx                # Alias -> /admin
│   └── api/
│       ├── dashboard/route.ts           # Datos unificados + evaluación de reglas
│       ├── config/route.ts              # Persistencia de proveedores, mapeos y reglas
│       ├── providers/test/route.ts      # Simulador HTTP 200 / validación de schema
│       └── alerts/test-webhook/route.ts # Prueba de despacho Webhook
├── components/
│   ├── dashboard/                       # 4 paneles modulares, KPIs y barra de terminal
│   ├── backoffice/                      # Proveedores, mapeo de métricas y motor de reglas
│   └── ui/                              # Badge, Card, Tabs, Modal, Slider, Switch
├── lib/
│   ├── providers/                       # IOnchainDataProvider + adaptadores + registry
│   ├── engine/                          # ruleEngine.ts & sentimentClassifier.ts
│   ├── store/                           # configStore.ts
│   └── types/                           # onchain.ts (tipado TypeScript completo)
└── mock/
    └── onchainGenerator.ts              # Generador de series temporales y escenarios
```

## Cómo conectar una API real

1. Abre el adaptador correspondiente en `src/lib/providers/` (por ejemplo `GlassnodeAdapter.ts` o `CryptoQuantAdapter.ts`).
2. Localiza los comentarios `// TODO: Conectar llamada real a API` e implementa el `fetch(...)` normalizando los puntos al esquema `RawOnchainDataset`.
3. En `/admin`, cambia el proveedor a **Activo**, introduce tu API Key, ajusta los endpoints en **Mapeo de Métricas** y pulsa **Test Connection**.

## Arranque en local

Requisitos: **Node.js 20+ (LTS)** y **npm** (o pnpm).

```bash
npm install
npm run dev
```

Abre `http://localhost:3000` para el Dashboard y `http://localhost:3000/admin` para el Back Office.
