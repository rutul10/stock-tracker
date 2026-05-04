## ADDED Requirements

### Requirement: Trade Score endpoint
The system SHALL expose `GET /trade-score/{symbol}` returning a numeric score (0–100) derived from technical indicators and IV-implied move without requiring an Ollama call.

#### Scenario: Successful score response
- **WHEN** `GET /trade-score/{symbol}` is called with a valid symbol
- **THEN** the response SHALL include: `symbol`, `score` (integer 0–100), `direction` (one of: `bullish`, `neutral`, `bearish`), `components` object with individual factor scores (`rsi`, `macd`, `momentum`, `iv`), and `computed_at` timestamp

#### Scenario: Score direction thresholds
- **WHEN** `score` is ≥ 60
- **THEN** `direction` SHALL be `bullish`
- **WHEN** `score` is between 40 and 59 inclusive
- **THEN** `direction` SHALL be `neutral`
- **WHEN** `score` is < 40
- **THEN** `direction` SHALL be `bearish`

#### Scenario: Score cached per symbol
- **WHEN** `GET /trade-score/{symbol}` is called within 5 minutes of a prior call for the same symbol
- **THEN** the cached result SHALL be returned without re-fetching indicators from yfinance

#### Scenario: Unknown symbol returns 404
- **WHEN** `GET /trade-score/{symbol}` is called with a symbol that yfinance cannot resolve
- **THEN** the endpoint SHALL return HTTP 404 with a descriptive error message

### Requirement: Trade Score computation formula
The Trade Score SHALL be computed as a weighted sum of four normalized components.

#### Scenario: RSI component
- **WHEN** RSI(14) is between 50 and 70 (optimal bullish zone)
- **THEN** the RSI component score SHALL be highest (approaching 1.0)
- **WHEN** RSI is above 70 (overbought) or below 30 (oversold)
- **THEN** the RSI component score SHALL be reduced toward 0

#### Scenario: MACD component
- **WHEN** MACD line is above the signal line
- **THEN** the MACD component score SHALL be 1.0
- **WHEN** MACD is below signal
- **THEN** the MACD component score SHALL be 0.0

#### Scenario: Momentum component
- **WHEN** current price is above both SMA20 and SMA50
- **THEN** the momentum component score SHALL be 1.0
- **WHEN** price is above SMA20 but below SMA50
- **THEN** the momentum component score SHALL be 0.5
- **WHEN** price is below both SMAs
- **THEN** the momentum component score SHALL be 0.0

#### Scenario: IV component
- **WHEN** implied volatility rank (IV%) is below 30 (cheap options)
- **THEN** the IV component score SHALL be 1.0 (favorable entry)
- **WHEN** IV rank is above 70 (expensive options)
- **THEN** the IV component score SHALL be 0.0

#### Scenario: Weighted combination
- **WHEN** all four components are computed
- **THEN** the final score SHALL be `round((rsi * 0.25 + macd * 0.25 + momentum * 0.25 + iv * 0.25) * 100)`

#### Scenario: Missing indicator graceful degradation
- **WHEN** a component cannot be computed (e.g., insufficient price history for IV)
- **THEN** that component SHALL be excluded and the remaining weights SHALL be normalized to sum to 1.0

### Requirement: Batch trade scores for watchboard
The backend SHALL support fetching Trade Scores for multiple symbols efficiently.

#### Scenario: Parallel fetch
- **WHEN** the watchboard loads with 15+ symbols
- **THEN** all `GET /trade-score/{symbol}` fetches SHALL be initiated in parallel by the frontend; each card SHALL update independently as its score resolves

#### Scenario: Individual failure does not block others
- **WHEN** one symbol's score fetch returns an error
- **THEN** the remaining symbols' scores SHALL still load and display normally
