## Context

The app is a local-first FastAPI + React trading strategy tool. It currently uses:
- CSS custom properties on `:root` for a fixed dark Bloomberg theme
- A Zustand store for tab state and selected symbol with `persist` middleware for watchlist
- A tab-based navigation system (no React Router) — content is conditionally rendered based on `activeTab`
- TTLCache (in-memory) for screener data; no caching yet for fundamentals or news
- A single Ollama model defined at startup via `OLLAMA_MODEL` env var; `call_ollama()` hardcodes that model

The stock detail use case requires pulling fundamentals, earnings, news, options, and indicators for a symbol — data that currently lives in 3 separate tabs and 2 separate backend services.

## Goals / Non-Goals

**Goals:**
- Theme switching with zero runtime overhead (CSS variable swap via `data-theme` attribute)
- Single-symbol deep-dive without leaving the screener context (overlay, not navigation)
- Rich fundamentals from yfinance with appropriate TTL caching per data freshness
- News from Finnhub with graceful yfinance fallback when no API key is set
- DCF intrinsic value calculated entirely on the frontend — no round-trip
- Parallel AI projections across multiple Ollama models with progressive rendering
- Dynamic model discovery from Ollama at startup / on demand

**Non-Goals:**
- React Router or URL-based navigation
- Real-time streaming from Ollama (stream: false stays)
- Paid data sources beyond the optional Finnhub free tier
- Persisting DCF assumptions between sessions (inputs reset on close)
- Sector median P/E (requires aggregating external data — out of scope for now)

## Decisions

### D1 — Theme: `data-theme` attribute on `<html>`, not CSS class toggle

**Decision:** Set `document.documentElement.setAttribute('data-theme', theme)` and define three `[data-theme]` rule sets in `globals.css`.

**Rationale:** Tailwind and inline `var(--token)` references both respect CSS custom properties from any ancestor selector. A `data-theme` attribute on `<html>` ensures all CSS (including Tailwind utilities that reference vars) picks up the change in one paint. No component tree re-render required.

**Alternatives considered:**
- Tailwind `dark:` class: Requires replacing all `var(--token)` inline styles with Tailwind classes across every component — too invasive.
- Emotion/styled-components theme provider: Adds a runtime dependency and requires wrapping every component — disproportionate for a 3-theme toggle.

**Sand palette (Claude-style warm cream):**
```
--bg:           #faf7f0
--surface:      #f0ebe0
--border:       #ddd5c4
--text-primary: #1c1812
--text-muted:   #8a7b68
--accent-green: #16a34a   (darker, readable on cream)
--accent-red:   #dc2626
--accent-blue:  #2563eb
--nav-accent:   #d97706   (Claude amber — nav branding only)
```

**Light palette:**
```
--bg:           #f5f7fa
--surface:      #ffffff
--border:       #e2e6ed
--text-primary: #111827
--text-muted:   #6b7280
--accent-green: #16a34a
--accent-red:   #dc2626
--accent-blue:  #2563eb
--nav-accent:   var(--accent-green)
```

The `--nav-accent` token is new — used only for "STRATEGY LAB" title and active tab underline so sand/light themes can use amber/green respectively while green/red financial semantics stay universal.

---

### D2 — Stock detail: full-screen overlay via Zustand `detailSymbol` state

**Decision:** Add `detailSymbol: string | null` to the Zustand store. When set, `App.tsx` renders `<StockDetailOverlay />` as a fixed-position layer over the entire app. ESC key and a back button clear it.

**Rationale:** No routing library needed; fits the existing tab-switching pattern; overlay preserves screener state underneath so dismissing is instant.

**Alternatives considered:**
- React Router with `/stock/:symbol` routes: Clean URL, but requires restructuring App.tsx, adding a dependency, and the app is local-only so bookmarkability adds no value.
- New "DETAIL" tab: Confusing UX — a tab that only exists when a symbol is selected.

---

### D3 — Backend data aggregation: one new endpoint per concern, not one mega-endpoint

**Decision:** Two new endpoints rather than one combined `/stock/{symbol}` call:
- `GET /stock/{symbol}/detail` → fundamentals + earnings (yfinance, 1h + 24h TTL respectively)
- `GET /stock/{symbol}/news` → Finnhub news (30min TTL)

**Rationale:** News refreshes independently (has its own refresh button). Fundamentals are stable. Splitting lets the frontend request them in parallel and show each section as it arrives, rather than blocking the whole overlay on the slowest call.

**Caching strategy:**
```
company fundamentals → TTLCache(maxsize=200, ttl=3600)    # 1 hour
earnings data        → TTLCache(maxsize=200, ttl=86400)   # 24 hours
news feed            → TTLCache(maxsize=200, ttl=1800)    # 30 minutes
```
Cache is keyed by symbol (uppercase). All caches are in-memory (cachetools TTLCache) — resets on server restart, which is fine for a local app.

---

### D4 — Finnhub integration: raw httpx calls, no SDK

**Decision:** Call Finnhub's REST API directly via `httpx` (already a dependency) rather than adding the `finnhub-python` SDK.

**Rationale:** We need exactly two Finnhub endpoints. The SDK adds a dependency and abstraction layer for two HTTP calls. The endpoint URLs are stable and well-documented.

**Fallback logic:**
```python
if not FINNHUB_API_KEY:
    return _fetch_news_yfinance(symbol)   # Yahoo Finance RSS via yfinance
return _fetch_news_finnhub(symbol)
```
`FINNHUB_API_KEY` is optional in `.env`. If absent, news degrades to yfinance headlines silently.

---

### D5 — Multi-model projection: parallel frontend requests, no backend change to orchestrate

**Decision:** The frontend fires `N` concurrent `POST /projection` requests (one per checked model), each with an explicit `model` field. Results are stored per-model in component state and rendered as each `Promise` resolves.

**Rationale:** Backend orchestration (a single endpoint that internally fans out) adds complexity and blocks on the slowest model. Frontend parallelism with per-model loading states gives a better UX — you see Plutus's result the moment it's ready without waiting for DeepSeek-R1's chain-of-thought.

**Backend change:** `POST /projection` gains an optional `model: string` field. If omitted, falls back to `OLLAMA_MODEL` env var (backwards compatible). `call_ollama()` signature gains a `model` parameter.

---

### D6 — DCF calculator: pure frontend, no backend round-trip

**Decision:** The DCF formula runs entirely in the browser. Inputs are React state (sliders/number inputs); intrinsic value updates on every input change via `useMemo`.

**Rationale:** No latency, no caching needed, works offline. The calculated intrinsic value + user assumptions are appended to the AI projection prompt as a context block — the backend receives them as part of an enriched `notes` field or dedicated DCF fields on the projection request.

**Formula:**
```
FCF_0     = operatingCashFlow - capitalExpenditures  (from yfinance cashflow)
FCF_n     = FCF_0 × (1 + cagr)^n × (1 + marginExpansion × n/5)
TV        = FCF_5 × (1 + tgr) / (wacc - tgr)
PV        = Σ FCF_n/(1+wacc)^n  [n=1..5]  +  TV/(1+wacc)^5
IV/share  = PV / sharesOutstanding
```

FCF_0 and sharesOutstanding come from the `/stock/{symbol}/detail` response. All other inputs are user-controlled.

---

### D7 — Model discovery: `GET /models` queries Ollama `/api/tags`

**Decision:** New `GET /models` endpoint calls `http://localhost:11434/api/tags` and returns `{ models: string[] }`. Frontend fetches this once on mount (useModels hook) and builds the toggle group dynamically.

**Rationale:** Hardcoding model names in the frontend would require a code change each time the user pulls a new Ollama model. Dynamic discovery means new models appear in the UI automatically.

**Error handling:** If Ollama is unreachable, return `{ models: [] }` with a 200 (not 503) — the frontend shows "No models available" gracefully rather than an error banner.

---

### D8 — Prompt enrichment for detail-page projection

**Decision:** `build_projection_prompt` gains three new optional context blocks appended after existing technical indicators:

```
NEWS CONTEXT (last 5 headlines):
- "Goldman upgrades AAPL to Buy" (2h ago)
...

EARNINGS CONTEXT:
- Next earnings: Apr 30, 2026 | EPS est: $1.95 | Rev est: $93.2B
- Last 4 quarters: beat / beat / beat / miss

DCF CONTEXT (user assumptions):
- Revenue CAGR: 14% | Margin expansion: +2% | Terminal growth: 3.5% | WACC: 9%
- Calculated intrinsic value: $423 vs current $415 (upside: +1.9%)
```

These are injected only when available. The projection request body gains optional fields: `news_context`, `earnings_context`, `dcf_context`.

## Risks / Trade-offs

**[yfinance fundamentals inconsistency]** → `ticker.info` field availability varies by symbol (ETFs, foreign ADRs, small caps often missing margins/EPS). Mitigation: all fields extracted with `.get(key, None)` and displayed as `—` in the UI when absent.

**[Finnhub rate limit on free tier]** → 60 calls/min is generous for a local app with one user, but aggressive refresh-clicking could hit it. Mitigation: 30-min TTL cache means Finnhub is called at most once per symbol per 30 minutes. Refresh button on the overlay bypasses cache intentionally (on user action only).

**[Ollama model load time]** → DeepSeek-R1 chain-of-thought can take 30–90 seconds for a detailed prompt. With multi-model parallel requests, two slow models could hold the UI in "loading" state for a long time. Mitigation: per-model loading spinner with elapsed time counter; auto-analyze is opt-in (off by default).

**[FCF calculation accuracy]** → yfinance `cashflow` statement can be missing or stale for some symbols. DCF falls back to `N/A` with a note in the UI rather than showing a misleading `$0` intrinsic value.

**[Sand theme on financial colors]** → Green/red must remain readable on `#faf7f0` cream. Darker shades `#16a34a` (green) and `#dc2626` (red) have WCAG AA contrast on cream backgrounds. The original `#00ff88` neon green would fail — swap only for sand/light themes.

## Migration Plan

1. Deploy backend changes (new router, services, projection model param) — fully backwards compatible; existing projection calls without `model` field continue to work.
2. Deploy frontend changes — theme defaults to `dark` so existing users see no change until they toggle.
3. Add `FINNHUB_API_KEY` to `.env` optionally — news degrades gracefully without it.
4. No database migrations required.
5. No rollback complexity — all new endpoints are additive; no existing endpoints change behavior.

## Open Questions

- **Sector Median P/E**: Deferred. Could approximate later by averaging P/E of same-sector stocks from the screener pool. Not blocking.
- **DCF assumption persistence**: Currently resets on overlay close. Could add to Zustand persist (per symbol) in a future iteration if users want to save their assumptions.
