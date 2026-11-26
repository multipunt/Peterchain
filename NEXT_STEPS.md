# PeterChain — Next Steps & Production Roadmap

> **Current Status:** Live on Vercel from `https://github.com/multipunt/Peterchain` (`main` branch).
> All 4 analytics panels, the Sandbox/Mock generator, the Adapter/Provider architecture, and the `/admin` Back Office are deployed and operational.

---

## Phase 1 — Persistent Back Office with Supabase (Priority #1)

Right now, `src/lib/store/configStore.ts` saves configuration to `.peterchain-config.json` with an in-memory fallback. On Vercel's serverless runtime, changes made in `/admin` reset on cold starts. Moving persistence to your **Supabase** project solves this cleanly.

### 1.1 Create Supabase Tables
Run this SQL in **Supabase → SQL Editor**:

```sql
-- 1. Data Providers configuration
create table if not exists public.providers (
  id text primary key,
  name text not null,
  description text not null default '',
  protocol text not null default 'REST',
  status text not null default 'mock' check (status in ('active', 'inactive', 'mock')),
  api_key text not null default '',
  base_url text not null default '',
  webhook_url text not null default '',
  custom_headers jsonb not null default '[]'::jsonb,
  polling_interval text not null default '1h' check (polling_interval in ('5m', '1h', '24h')),
  rate_limit_rpm integer not null default 60,
  docs_url text not null default '',
  last_tested_at timestamptz,
  last_test_result jsonb,
  updated_at timestamptz not null default now()
);

-- 2. Metric Mapping Engine
create table if not exists public.metric_mappings (
  metric_key text primary key,
  label text not null,
  category text not null,
  unit text not null,
  provider_id text not null references public.providers(id) on update cascade,
  endpoint_path text not null,
  json_field_path text not null,
  transform_multiplier double precision not null default 1,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

-- 3. Rule Engine Thresholds (singleton row id = 'default')
create table if not exists public.rule_thresholds (
  id text primary key default 'default',
  config jsonb not null,
  updated_at timestamptz not null default now()
);

-- 4. Webhook Notification Destinations
create table if not exists public.webhooks (
  id text primary key,
  name text not null,
  type text not null check (type in ('discord', 'telegram', 'slack', 'custom')),
  url text not null,
  channel_or_chat_id text not null default '',
  min_severity text not null default 'WARNING' check (min_severity in ('INFO', 'BULLISH', 'WARNING', 'CRITICAL')),
  enabled boolean not null default true,
  last_triggered_at timestamptz,
  updated_at timestamptz not null default now()
);

-- 5. Alert History & Deduplication Log
create table if not exists public.alert_history (
  id uuid primary key default gen_random_uuid(),
  rule_id text not null,
  asset text not null,
  title text not null,
  message text not null,
  severity text not null,
  panel integer not null,
  metric_key text not null,
  current_value text not null,
  threshold_value text not null,
  dispatched_webhooks jsonb not null default '[]'::jsonb,
  acknowledged boolean not null default false,
  created_at timestamptz not null default now()
);

-- 6. Onchain Metric Cache (reduces paid API calls)
create table if not exists public.metric_cache (
  cache_key text primary key, -- e.g. "BTC:30d:glassnode:PRECIO"
  payload jsonb not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);
```

### 1.2 Environment Variables (Vercel + `.env.local`)
Add these in **Vercel → Project Settings → Environment Variables**:
- `NEXT_PUBLIC_SUPABASE_URL` — from Supabase Project Settings → API
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public anon key
- `SUPABASE_SERVICE_ROLE_KEY` — server-only key (used exclusively inside Next.js API routes; never expose to the browser)

### 1.3 Code Changes Required
- Add `@supabase/supabase-js` (and `@supabase/ssr` if adding Auth).
- Create `src/lib/supabase/server.ts` for server-side Supabase access.
- Refactor `src/lib/store/configStore.ts` to read/write `providers`, `metric_mappings`, `rule_thresholds`, and `webhooks` in Supabase (auto-seeding the default rows on first boot if tables are empty).

---

## Phase 2 — Protect `/admin` with Supabase Auth & RLS

Before entering real paid API keys into `/admin`, lock down access:

1. **Enable Supabase Auth** (Email/Password or Magic Link) in the Supabase Dashboard.
2. **Add `/login` page** and `src/middleware.ts` to protect `/admin`, `/settings`, and mutating API routes (`PUT /api/config`, `POST /api/config`, `POST /api/providers/test`, `POST /api/alerts/test-webhook`).
3. **Enable Row Level Security (RLS)** on all Supabase tables so:
   - Public dashboard reads only non-sensitive chart data (never exposing `providers.api_key` or `webhooks.url` to unauthenticated clients).
   - Only authenticated admin users can read/write Back Office tables.
4. **Encrypt API keys at rest** using **Supabase Vault** or store sensitive keys in Vercel Environment Variables referenced by name (e.g. `env:GLASSNODE_API_KEY`).

---

## Phase 3 — Connect Real Onchain Data Providers

Each adapter in `src/lib/providers/` already has explicit `// TODO: Conectar llamada real a API` markers:

| Adapter | File | Best Metrics to Connect First |
|---|---|---|
| **Glassnode** | `src/lib/providers/GlassnodeAdapter.ts` | `PRECIO`, `RP_STH`, `RP_LTH`, `URPD`, `MVRV_STH`, `MVRV_LTH`, `NUPL`, `UTXO_AGE_BANDS` |
| **CryptoQuant** | `src/lib/providers/CryptoQuantAdapter.ts` | `EXCHANGE_INFLOWS`, `EXCHANGE_OUTFLOWS`, `CEX_RESERVES`, `SOPR_STH`, `SOPR_LTH`, `CPI` |
| **Coinglass** | `src/lib/providers/OtherAdapters.ts` | `CPI`, exchange balances |
| **IntoTheBlock** | `src/lib/providers/OtherAdapters.ts` | `WHALE_ACCUMULATION`, `ACTIVE_ADDRESSES` |
| **Custom REST** | `src/lib/providers/OtherAdapters.ts` | Self-hosted Bitcoin Core / Esplora / custom indexer |

### Implementation Checklist
- [ ] Implement real HTTP `fetch` calls inside `testConnection()` and `fetchDataset()` / per-metric fetcher for your chosen provider(s).
- [ ] Wire `metric_cache` in Supabase using each provider's configured `pollingInterval` (`5m`, `1h`, `24h`) so page loads stay fast and never exceed rate limits.
- [ ] Keep automatic fallback to `MockAdapter` for any metric whose provider is still in `Mock Mode` or temporarily unreachable, and show a clear badge in the UI.

---

## Phase 4 — Automated Background Alerts & Real Webhook Dispatch

Currently, rules are evaluated on demand when `/api/dashboard` is loaded. To send proactive alerts 24/7:

1. **Create `src/app/api/cron/evaluate/route.ts`**:
   - Protected by `CRON_SECRET` header.
   - Fetches latest live metrics for configured assets (`BTC`, `ETH`, `SOL`), runs `evaluateOnchainRules()`, checks `alert_history` for recent duplicates (e.g. 60-minute cooldown per `rule_id + asset`), stores new alerts, and dispatches webhooks.
2. **Schedule the job**:
   - Add a `vercel.json` Cron Job (e.g. every 5 or 15 minutes), **or** trigger it via **Supabase `pg_cron` + Edge Functions**.
3. **Enable live webhook HTTP POSTs**:
   - Format payloads per platform (Discord Embed, Telegram `sendMessage` with `chat_id`, Slack Block Kit) in a shared `src/lib/engine/webhookDispatcher.ts` and wire it into both the cron job and `src/app/api/alerts/test-webhook/route.ts`.

---

## Phase 5 — Developer Experience & Hardening

- [ ] **Local Node.js Setup (optional):** Install Node.js LTS locally (`winget install OpenJS.NodeJS.LTS`) so you can run `npm run dev`, `npm run typecheck`, and `npm run build` before pushing to GitHub.
- [ ] **Automated Tests:** Add Vitest unit tests covering `src/lib/engine/ruleEngine.ts` and `src/lib/engine/sentimentClassifier.ts` across all 4 market regimes (`EUPHORIA`, `OVEROPTIMISM`, `HEALTHY_BULL`, `APATHY_ACCUMULATION`).
- [ ] **Upgrade ESLint (optional):** Move ESLint config to the latest supported version whenever `eslint-config-next` updates to clear the remaining `npm warn deprecated eslint` install notice.
- [ ] **Real-time WebSocket Feeds (optional):** If using `CustomWebSocketAdapter` in production, connect directly from the browser (or via Supabase Realtime broadcast fed by a lightweight Node/Deno worker) since Vercel serverless functions do not maintain persistent WebSocket connections.

---

## Recommended Next Session Kickoff

When you're ready to start **Phase 1 (Supabase)**, just share:
1. Whether you want to set up the Supabase SQL tables via the Dashboard SQL Editor (or with a Supabase MCP/CLI connection).
2. Whether you want **Auth protection on `/admin`** right away alongside persistence.
3. Which **first real onchain API** (or free public endpoint like CoinGecko/Binance/Mempool.space for spot price + network stats) you want to connect first.
