## ADDED Requirements

### Requirement: Price forecast endpoint
The system SHALL expose a `GET /forecast/{symbol}` endpoint that returns a complete price forecast for the given symbol, including stock price projections, options expiry matrix, expected move calculations, support/resistance levels, directional bias, and a catalyst flag.

#### Scenario: Successful forecast response
- **WHEN** `GET /forecast/{symbol}` is called with a valid symbol
- **THEN** the response SHALL include `stock_projections`, `options_matrix`, `expected_move`, `key_levels`, `directional_bias`, `bias_confidence`, and `catalyst`

#### Scenario: Invalid symbol
- **WHEN** `GET /forecast/{symbol}` is called with a symbol that has no yfinance data
- **THEN** the endpoint SHALL return HTTP 404 with a descriptive message

#### Scenario: Ollama unavailable
- **WHEN** Ollama is not reachable during a forecast request
- **THEN** the endpoint SHALL return HTTP 503 with `{"detail": "AI model unavailable — run: ollama serve"}` and SHALL NOT return partial data

### Requirement: Stock price projections (bear/base/bull)
The forecast response SHALL include AI-generated bear, base, and bull price targets for 1-week, 2-week, and 1-month horizons.

#### Scenario: All three horizons present
- **WHEN** the forecast completes successfully
- **THEN** `stock_projections` SHALL contain keys `1_week`, `2_weeks`, and `1_month`, each with `bear`, `base`, and `bull` as numeric values

#### Scenario: AI targets anchored to quant range
- **WHEN** the AI prompt is built for price forecast
- **THEN** the prompt SHALL include the IV-implied ±move and ATR-based range for each horizon so the model can anchor its targets to market-implied volatility

#### Scenario: Targets are prices, not percentages
- **WHEN** the forecast response is returned
- **THEN** `bear`, `base`, and `bull` values SHALL be absolute price levels (e.g., `185.00`), not percentage changes

### Requirement: IV-implied expected move calculation
The system SHALL compute the options-market-implied expected move for each horizon using the formula: `price × IV × √(days / 252)`.

#### Scenario: Expected move per horizon
- **WHEN** ATM implied volatility is available for the nearest expiry
- **THEN** `expected_move` in the response SHALL contain `1_week`, `2_weeks`, and `1_month` keys, each with a `plus` and `minus` price level and a `range_pct` percentage

#### Scenario: Expected move fallback to ATR
- **WHEN** no options data is available for the symbol (e.g., no listed options)
- **THEN** `expected_move` SHALL be computed from ATR(14) using multipliers: 1W = 1.0×ATR, 2W = 1.5×ATR, 1M = 3.0×ATR, and the response SHALL include `"source": "atr"` to indicate the fallback

### Requirement: Key support and resistance levels
The forecast response SHALL include key price levels derived from technical indicators.

#### Scenario: Support levels computed
- **WHEN** indicators are available
- **THEN** `key_levels.support` SHALL be an array of up to 4 levels drawn from: SMA20, SMA50, recent swing lows (lowest close in past 10 bars), and BB lower band, sorted descending (nearest support first)

#### Scenario: Resistance levels computed
- **WHEN** indicators are available
- **THEN** `key_levels.resistance` SHALL be an array of up to 4 levels drawn from: SMA20 (if above current price), SMA50 (if above), recent swing highs (highest close in past 10 bars), and BB upper band, sorted ascending (nearest resistance first)

### Requirement: Directional bias and catalyst flag
The forecast SHALL surface the AI's directional view and flag any known catalyst (earnings, ex-div) falling within the projection window.

#### Scenario: Directional bias in response
- **WHEN** the forecast completes
- **THEN** `directional_bias` SHALL be one of `"bullish"`, `"bearish"`, or `"neutral"`, and `bias_confidence` SHALL be one of `"low"`, `"medium"`, `"high"`

#### Scenario: Earnings in 1-month window flagged
- **WHEN** the symbol has a known next earnings date within 30 calendar days
- **THEN** `catalyst.type` SHALL be `"earnings"`, `catalyst.date` SHALL be the earnings date string, and `catalyst.in_window` SHALL be `true`

#### Scenario: No catalyst in window
- **WHEN** no earnings date is within 30 days
- **THEN** `catalyst.in_window` SHALL be `false` and `catalyst.type` SHALL be `null`

### Requirement: Forecast caching
The forecast result SHALL be cached server-side to prevent redundant yfinance and Ollama calls.

#### Scenario: Cache hit returns fast
- **WHEN** `GET /forecast/{symbol}` is called for the same symbol within 5 minutes of a prior call
- **THEN** the cached result SHALL be returned without calling yfinance or Ollama again

#### Scenario: Cache miss triggers fresh computation
- **WHEN** `GET /forecast/{symbol}` is called and no cache entry exists (or it has expired)
- **THEN** the full computation SHALL run and the result SHALL be cached for 5 minutes
