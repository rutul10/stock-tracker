## Why

The app is built like a Bloomberg terminal for expert traders, but the primary user is a newcomer trading real money who needs guidance, not raw data. The current 5-tab navigation forces manual context-switching with no workflow, the projector requires filling in 7+ fields the user doesn't yet know, and there is no way to compare two stocks or have a follow-up conversation with the AI about a projection. The user trades only blue-chip and high-quality emerging companies, prefers monthly/quarterly/annual options (never weeklies), and needs the app to guide decisions rather than assume expertise.

## What Changes

- **Replace the generic screener with a curated Watchboard** — two pre-built lists (Blue Chips, Emerging Growth) with a Trade Score shown on each card before the user clicks anything; user can customize the lists.
- **Add multi-view stock comparison** — pin any two stocks and compare them across four views: Verdict (plain-English winner), Projection Cone (visual price targets), Indicator Breakdown (plain-English labels, not raw numbers), and Options Head-to-Head (best monthly+ trade for each).
- **Add LLM Chat panel on projections** — after a projection loads, a conversational panel opens where the user can ask follow-up questions; the AI has full context (indicators, news, options, trade setup) and knows the user's safe-player profile.
- **Add monthly+ options filter** — all options views default to 30/60/90/365 DTE; weekly options are hidden by default with an "advanced" toggle to show them.
- **Add user trading profile** — a one-time "My Style" setting (risk tolerance, DTE preference, max per trade) that automatically filters recommendations throughout the app.
- **Simplify navigation from 5 tabs to 2** — WATCHBOARD (replaces Screener + Options + Chart + Projector) and TRACKER; all symbol-specific analysis lives inside the stock detail overlay.

## Capabilities

### New Capabilities
- `watchboard`: Curated two-column landing page (Blue Chips / Emerging Growth) with Trade Score badges computed on load; user-editable symbol lists; replaces the generic screener as the home view.
- `stock-comparison`: Side-by-side comparison of two stocks across four views — Verdict, Projection Cone, Indicator Breakdown, Options Head-to-Head — reachable by pinning any two stocks from the watchboard or search.
- `projection-chat`: Conversational LLM panel attached to any AI projection result; streams follow-up Q&A with the AI using the full analysis context; user profile (safe player, DTE preference) injected into system prompt.
- `trade-score`: Pre-computed per-symbol probability score (0–100%) derived from technical indicators + IV-implied move + AI directional bias; shown as a progress bar on watchboard cards and in comparison views.
- `user-profile`: One-time settings panel for risk tolerance (conservative/moderate/aggressive), preferred DTE (monthly/quarterly/annual), and max position size; persisted to localStorage; consumed by projection-chat and options filtering throughout.
- `monthly-options-filter`: All options views default to 30 DTE minimum; expiry matrix and options chain hide weeklies; safe-player recommended strategies (covered calls, CSPs, LEAPS) surface by default.

### Modified Capabilities
- `screener`: Requirements change — the SCREENER sub-view becomes a secondary view inside the WATCHBOARD tab (not the default home); the primary view is the curated watchboard cards. The POST /screener API is unchanged.
- `multi-model-projection`: Requirements change — projection response must include `price_projections` (bear/base/bull for 2W/1M/3M horizons aligned to safe-player timeframes) and `directional_bias` as structured fields; these become required output, not optional.
- `stock-detail-overlay`: Requirements change — overlay gains a Chat sub-tab (the projection-chat capability); existing FUNDAMENTALS/OPTIONS/AI PROJECTION/DCF sub-tabs remain.

## Impact

**Backend**
- New endpoint: `GET /trade-score/{symbol}` — fast computation of technical + IV-implied score, no Ollama required, cached 5 min
- New endpoint: `POST /projection/chat` — streaming LLM conversation endpoint; accepts `symbol`, `context` (indicators snapshot), `user_profile`, and `messages[]` array; uses Ollama streaming API
- Modified: `backend/services/prompt_builder.py` — inject user profile (risk tolerance, DTE preference) into projection and chat prompts; extend JSON schema to require `price_projections` and `directional_bias`
- Modified: `backend/routers/projection.py` — pass through new structured fields
- New dependency: none (uses existing yfinance + pandas-ta + Ollama)

**Frontend**
- New: `frontend/src/components/Watchboard/` — `Watchboard.tsx`, `StockCard.tsx`, `CompareBar.tsx`
- New: `frontend/src/components/Comparison/` — `ComparisonView.tsx`, `VerdictPanel.tsx`, `ProjectionConeChart.tsx`, `IndicatorBreakdown.tsx`, `OptionsHeadToHead.tsx`
- New: `frontend/src/components/StockDetail/ProjectionChat.tsx` — streaming chat panel using EventSource or chunked fetch
- New: `frontend/src/components/UserProfile/UserProfileModal.tsx` — one-time setup modal + settings gear icon
- Modified: `frontend/src/App.tsx` — nav reduced to 2 tabs (WATCHBOARD, TRACKER)
- Modified: `frontend/src/store/index.ts` — add `compareSymbols[]`, `userProfile`, `pinnedSymbol` state
- Modified: `frontend/src/components/StockDetail/StockDetailOverlay.tsx` — add CHAT sub-tab

**OpenAPI**
- New path: `GET /trade-score/{symbol}`
- New path: `POST /projection/chat` (streaming)
