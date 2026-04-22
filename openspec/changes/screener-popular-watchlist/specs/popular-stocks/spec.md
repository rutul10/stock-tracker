## ADDED Requirements

### Requirement: Popular stocks endpoint returns top 10 tickers
The system SHALL expose a `GET /screener/popular` endpoint that returns a fixed list of the 10 most-traded large-cap symbols (AAPL, MSFT, AMZN, NVDA, GOOGL, META, TSLA, AVGO, LLY, JPM) with current price, price change percentage, and volume. The endpoint SHALL NOT make `.info` enrichment calls (no name, sector, market_cap, avg_volume, iv_rank).

#### Scenario: Successful popular stocks fetch
- **WHEN** a client sends `GET /screener/popular`
- **THEN** the system returns HTTP 200 with a JSON body `{ "results": [...] }` containing exactly 10 entries, each with `symbol`, `price`, `change_pct`, and `volume` fields

#### Scenario: Missing fields are null not absent
- **WHEN** a symbol has no volume data for the day
- **THEN** the entry SHALL still be included with `volume: 0` rather than being omitted

### Requirement: Popular stocks response is server-side cached
The system SHALL cache the `GET /screener/popular` response in memory with a TTL of 180 seconds. Repeated calls within the TTL window SHALL return the cached result without making new yfinance API calls.

#### Scenario: Cache hit returns fast
- **WHEN** `GET /screener/popular` is called a second time within 180 seconds of the first call
- **THEN** the response is returned from cache without calling yfinance

#### Scenario: Cache expires and refreshes
- **WHEN** `GET /screener/popular` is called after the 180-second TTL has elapsed
- **THEN** the system fetches fresh data from yfinance and updates the cache

### Requirement: Popular stocks auto-load on Screener tab open
The frontend Screener tab SHALL automatically fetch `GET /screener/popular` when the Popular sub-view is first displayed, without requiring any user action.

#### Scenario: Tab opens to Popular view with data
- **WHEN** the user navigates to the Screener tab for the first time in a session
- **THEN** the Popular sub-view is shown by default and stock data loads automatically

#### Scenario: Subsequent tab visits use cached frontend state
- **WHEN** the user switches away from and back to the Screener tab
- **THEN** previously loaded popular stocks are shown immediately without re-fetching
