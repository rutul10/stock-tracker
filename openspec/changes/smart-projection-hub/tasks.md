## 1. Backend — Trade Score Endpoint

- [x] 1.1 Create `backend/routers/trade_score.py` — define `GET /trade-score/{symbol}` route with symbol validation
- [x] 1.2 Implement RSI component scorer in `backend/services/trade_score_engine.py`: normalize RSI(14) to 0–1 using optimal zone 50–70; overbought (>70) and oversold (<30) reduce score
- [x] 1.3 Implement MACD component scorer: 1.0 if MACD above signal line, 0.0 if below
- [x] 1.4 Implement momentum component scorer: 1.0 if price above SMA20 and SMA50; 0.5 if above SMA20 only; 0.0 if below both
- [x] 1.5 Implement IV component scorer: fetch ATM IV from nearest expiry, normalize IV rank to 0–1 (low IV rank = 1.0, high IV rank = 0.0)
- [x] 1.6 Combine four components with equal 0.25 weights; normalize weights if a component is unavailable; return integer score 0–100
- [x] 1.7 Add `direction` field: `bullish` if score ≥ 60, `neutral` if 40–59, `bearish` if < 40
- [x] 1.8 Add `TTLCache(maxsize=100, ttl=300)` on the score computation function; cache keyed by symbol
- [x] 1.9 Handle fetch errors per symbol: return HTTP 404 for unknown symbols; return score with missing components gracefully degraded
- [x] 1.10 Register `trade_score` router in `backend/main.py`

## 2. Backend — Projection Chat Streaming Endpoint

- [x] 2.1 Add `stream=True` path to `backend/services/ollama_client.py` — implement `stream_ollama(prompt, model, messages)` that calls Ollama with `"stream": true` and yields token chunks
- [x] 2.2 Create `backend/routers/projection_chat.py` — define `POST /projection/chat` accepting `{symbol, context, user_profile, messages[]}`
- [x] 2.3 Build chat system prompt in `backend/services/prompt_builder.py`: include symbol, current price, all indicator values, prior projection result, and user profile (risk tolerance, DTE preference)
- [x] 2.4 Enforce 10-turn history cap in the chat route handler: slice `messages[]` to last 10 entries before passing to Ollama
- [x] 2.5 Return `StreamingResponse` with `media_type="text/event-stream"` from the chat endpoint; each chunk as `data: <token>\n\n` SSE format; send `data: [DONE]\n\n` when stream ends
- [x] 2.6 Add SSE headers: `Cache-Control: no-cache`, `X-Accel-Buffering: no`
- [x] 2.7 Handle Ollama unavailable: if connection to Ollama fails, return HTTP 503 with message "AI model unavailable — is Ollama running?"
- [x] 2.8 Register `projection_chat` router in `backend/main.py`

## 3. Backend — Projection Response Extended Fields

- [x] 3.1 Update `backend/services/prompt_builder.py` — extend the JSON schema in `build_projection_prompt()` to require `price_projections` object with `2W`, `1M`, `3M` horizon keys each containing `bear`, `base`, `bull` prices
- [x] 3.2 Add `directional_bias` (bullish/neutral/bearish) and `user_profile` injection to the prompt template
- [x] 3.3 Update `backend/routers/projection.py` — extract and pass through `price_projections` and `directional_bias` from AI response; default to null if model doesn't return them rather than raising an error
- [x] 3.4 Add `user_profile` field to `ProjectionRequest` Pydantic model (optional, dict)

## 4. Backend — Monthly Options Filter

- [x] 4.1 Add `min_dte: int = 30` query parameter to `GET /options/{symbol}` in `backend/routers/options.py`
- [x] 4.2 In `backend/services/market_data.py`, filter `yf.Ticker(symbol).options` dates to only return expiries where `(expiry_date - today).days >= min_dte`
- [x] 4.3 Add fallback: if no expiries meet `min_dte`, return the nearest available expiry with `filter_warning` field in the response

## 5. Zustand Store — New State

- [x] 5.1 Add `compareSymbols: [string, string] | null` to `frontend/src/store/index.ts`; add `setCompareSymbols` and `clearCompareSymbols` actions
- [x] 5.2 Add `userProfile: { riskTolerance: 'conservative' | 'moderate' | 'aggressive'; preferredDte: 'monthly' | 'quarterly' | 'annual'; maxPositionSize: string }` with defaults; persist to localStorage via Zustand persist middleware
- [x] 5.3 Add `profileModalOpen: boolean` and `setProfileModalOpen` action
- [x] 5.4 Add `customBlueChips: string[]` and `customEmerging: string[]` to store with localStorage persistence; initialize to empty arrays (defaults come from constants file)

## 6. Frontend — Constants and Types

- [x] 6.1 Create `frontend/src/constants/watchlists.ts` — export `DEFAULT_BLUE_CHIPS: string[]` (15 symbols) and `DEFAULT_EMERGING: string[]` (10 symbols) as defined in design.md
- [x] 6.2 Create `frontend/src/api/types.ts` additions: `TradeScore`, `ComparisonData`, `ChatMessage`, `UserProfile` types matching backend response shapes
- [x] 6.3 Create `frontend/src/hooks/useTradeScore.ts` — fetches `GET /trade-score/{symbol}`; returns `{ score, direction, components, loading, error }`
- [x] 6.4 Create `frontend/src/hooks/useWatchboardScores.ts` — calls `useTradeScore` for all symbols in both lists; returns per-symbol score map; scores load independently

## 7. Frontend — User Profile Modal

- [x] 7.1 Create `frontend/src/components/UserProfile/UserProfileModal.tsx` — modal with three settings: Risk Tolerance (3 buttons), Preferred DTE (3 buttons), Max Position Size (text input)
- [x] 7.2 Add gear icon button to the nav bar in `frontend/src/App.tsx` that opens `UserProfileModal`
- [x] 7.3 On first app load (profile not yet set), auto-open `UserProfileModal` with welcome message
- [x] 7.4 Ensure profile changes write immediately to Zustand store (no save button)

## 8. Frontend — Watchboard Tab

- [x] 8.1 Create `frontend/src/components/Watchboard/StockCard.tsx` — renders ticker, company name (truncated to 20 chars), price, change % (green/red), Trade Score progress bar, direction label, pin button, remove button
- [x] 8.2 Implement Trade Score progress bar: fills 0–100% with color gradient (red at 0, yellow at 50, green at 100); direction label below bar
- [x] 8.3 Implement pin button: heart/pin icon, toggles `compareSymbols` in store; highlights when pinned; triggers comparison view when second stock is pinned
- [x] 8.4 Create `frontend/src/components/Watchboard/WatchboardList.tsx` — renders a named list (title + "Add symbol" input + grid of `StockCard`); accepts `symbols[]`, `title`, `onAdd`, `onRemove` props
- [x] 8.5 Create `frontend/src/components/Watchboard/Watchboard.tsx` — renders two `WatchboardList` side by side (Blue Chips | Emerging Growth); merges DEFAULT lists with custom store arrays; passes score data from `useWatchboardScores`
- [x] 8.6 Add "Add symbol" input per list: validates symbol (alphabetic, 1–10 chars), calls `addToCustomBlueChips` or `addToCustomEmerging` on Enter
- [x] 8.7 Update `frontend/src/App.tsx` — change TABS from 5 to 2: `WATCHBOARD` (key S) and `TRACKER` (key T); render `<Watchboard />` for watchboard tab; remove Options, Indicators, Projector tabs from nav
- [x] 8.8 Keep sub-view pill selector inside Watchboard: POPULAR | WATCHLIST | SCREENER | BLUE CHIPS | EMERGING (BLUE CHIPS is default)

## 9. Frontend — Comparison View

- [x] 9.1 Create `frontend/src/components/Comparison/ComparisonView.tsx` — full-screen overlay (position: fixed, z-index above stock detail overlay) rendered when `compareSymbols` is set in store; ESC or × closes it
- [x] 9.2 Add 4 tab buttons at top of ComparisonView: VERDICT, PROJECTION, BREAKDOWN, OPTIONS; store active tab in local component state; default to VERDICT
- [x] 9.3 Create `frontend/src/components/Comparison/VerdictPanel.tsx` — two columns (one per symbol) showing: Trade Score bar, Momentum label (mapped from RSI range), Trend label (mapped from SMA position), Volatility Risk label (mapped from ATR percentile), 2-week price outlook range; single-sentence AI recommendation fetched from projection data
- [x] 9.4 Create `frontend/src/components/Comparison/ProjectionConeChart.tsx` — Recharts ComposedChart with Area series for bear/base/bull for each symbol; x-axis: Today / +2W / +4W; blue for symbol A, orange for symbol B; data table below chart
- [x] 9.5 Create `frontend/src/components/Comparison/IndicatorBreakdown.tsx` — table with rows: Momentum, Trend, Volatility, Options Activity, Overall Score; columns: Factor, Stock A (plain English), Stock B (plain English), Winner; Winner cell uses accent-green for the favored ticker
- [x] 9.6 Create `frontend/src/components/Comparison/OptionsHeadToHead.tsx` — two columns showing AI-recommended monthly+ option trade per symbol (option label, prob of profit %, cost/contract, break-even, max loss, risk level badge, SAFER PICK badge when applicable)
- [x] 9.7 Create `frontend/src/hooks/useComparison.ts` — fetches trade score, indicators, and projection data for both symbols; exposes per-symbol loading states; derives plain-English labels from raw indicator values

## 10. Frontend — Projection Chat Panel

- [x] 10.1 Create `frontend/src/components/StockDetail/ProjectionChat.tsx` — chat panel with scrollable message history (user bubbles right-aligned, assistant bubbles left-aligned) and a fixed-bottom text input + send button
- [x] 10.2 Implement SSE streaming in `ProjectionChat`: use `fetch` with `ReadableStream` to call `POST /projection/chat`; append tokens to the current assistant bubble as they arrive; show animated cursor during stream
- [x] 10.3 Implement message history state in `ProjectionChat` (local component state, not persisted); include system context (symbol + projection result + user profile) assembled before first send
- [x] 10.4 Show history truncation notice when messages array exceeds 10 turns: faint text "Older messages not included in AI context" at top of chat
- [x] 10.5 Show streaming error state: if SSE stream errors, display error indicator on the assistant bubble with a retry button
- [x] 10.6 Auto-scroll to the latest message as new tokens append

## 11. Frontend — Stock Detail Overlay Updates

- [x] 11.1 Update `frontend/src/components/StockDetail/StockDetailOverlay.tsx` — add CHAT to the sub-tab nav; only show CHAT tab when a projection result exists in component state
- [x] 11.2 Auto-switch to CHAT sub-tab when a new projection result is received (after the AI PROJECTION tab run completes)
- [x] 11.3 Pass `projectionResult` and `userProfile` props (or via context) from overlay into `ProjectionChat`
- [x] 11.4 Pass `min_dte` derived from `userProfile.preferredDte` into all options fetch calls within the overlay (monthly=30, quarterly=90, annual=365)

## 12. Frontend — Options UI DTE Filter

- [x] 12.1 Add "SHOW WEEKLIES" toggle button in the options chain/matrix UI; default off (min_dte=30 applied)
- [x] 12.2 When toggle is off, pass `min_dte=30` (or user profile DTE) in options API calls; when on, pass `min_dte=0`
- [x] 12.3 Display `filter_warning` from backend (if present) as an inline notice in the options UI

## 13. Verification

- [ ] 13.1 Verify `GET /trade-score/AAPL` returns score, direction, and components within 2 seconds
- [ ] 13.2 Verify watchboard loads with all 25 default symbols and scores populate independently (no full-page block)
- [ ] 13.3 Verify pinning two stocks opens the comparison view and all 4 tabs render correctly
- [ ] 13.4 Verify `POST /projection/chat` streams tokens progressively (first token visible within 3 seconds of send)
- [ ] 13.5 Verify CHAT tab appears after projection runs and auto-switches to it
- [ ] 13.6 Verify `GET /options/AAPL` without `min_dte` excludes sub-30-DTE expiries
- [ ] 13.7 Verify user profile settings persist across browser refresh
- [ ] 13.8 Verify first-launch profile modal appears when no profile is set
- [ ] 13.9 Verify app nav shows only WATCHBOARD and TRACKER tabs
- [ ] 13.10 Verify `POST /projection` response includes `price_projections` with 2W/1M/3M horizons and `directional_bias`
