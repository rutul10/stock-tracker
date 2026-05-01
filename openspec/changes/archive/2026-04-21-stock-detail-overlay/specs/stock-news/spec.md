## ADDED Requirements

### Requirement: News endpoint
The system SHALL expose `GET /stock/{symbol}/news` returning recent news articles for a symbol.

#### Scenario: Finnhub news returned when API key present
- **WHEN** `FINNHUB_API_KEY` is set in the environment and `GET /stock/{symbol}/news` is called
- **THEN** the response SHALL return news from Finnhub's `/company-news` endpoint, containing up to 10 articles with `headline`, `summary`, `source`, `url`, and `datetime` fields

#### Scenario: yfinance fallback when no API key
- **WHEN** `FINNHUB_API_KEY` is not set and `GET /stock/{symbol}/news` is called
- **THEN** the response SHALL return news from yfinance's `ticker.news` (Yahoo Finance RSS) with the same response shape

#### Scenario: News cached 30 minutes
- **WHEN** the same symbol's news is requested within 30 minutes
- **THEN** the cached result SHALL be returned without a new Finnhub/yfinance call

#### Scenario: Cache bypassed on explicit refresh
- **WHEN** `GET /stock/{symbol}/news?refresh=true` is called
- **THEN** the cache entry for that symbol SHALL be invalidated and fresh data fetched

#### Scenario: Finnhub rate limit or error
- **WHEN** Finnhub returns an error response
- **THEN** the backend SHALL fall back to yfinance news and return a 200 with `source: "yfinance"` in the response metadata

### Requirement: News panel in overlay
The stock detail overlay SHALL render a news section displaying recent articles.

#### Scenario: Articles listed with metadata
- **WHEN** news is loaded
- **THEN** each article SHALL display: headline, source name, and relative time (e.g., "2h ago")

#### Scenario: Article is clickable
- **WHEN** the user clicks an article headline
- **THEN** the article URL SHALL open in a new browser tab

#### Scenario: Refresh button
- **WHEN** the user clicks the refresh button in the news section
- **THEN** the frontend SHALL call `GET /stock/{symbol}/news?refresh=true` and update the displayed articles

#### Scenario: Cache age shown
- **WHEN** news is displayed
- **THEN** the panel SHALL show "cached X min ago" or "just updated" based on when the data was last fetched

#### Scenario: No news available
- **WHEN** no articles are returned for a symbol
- **THEN** the panel SHALL display "No recent news found" rather than an empty list
