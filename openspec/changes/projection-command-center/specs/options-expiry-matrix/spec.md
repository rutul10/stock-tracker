## ADDED Requirements

### Requirement: Options expiry matrix in forecast response
`GET /forecast/{symbol}` SHALL include an `options_matrix` array where each element represents one standard horizon mapped to the nearest real expiry date.

#### Scenario: Standard horizons covered
- **WHEN** options are available for the symbol
- **THEN** `options_matrix` SHALL contain rows for each of the following horizons that have a matching real expiry: 1W (7d), 2W (14d), 3W (21d), 1M (30d), 2M (60d), 3M (90d), 6M (180d), 9M (270d), 12M (365d)

#### Scenario: Horizon-to-expiry mapping
- **WHEN** mapping a standard horizon to a real expiry
- **THEN** the system SHALL select the nearest available yfinance expiry date that is greater than or equal to the horizon's target date (today + N days)

#### Scenario: Missing horizon rows omitted
- **WHEN** no yfinance expiry exists at or beyond a given horizon (e.g., no LEAPS listed yet)
- **THEN** that horizon row SHALL be omitted from the matrix without error

#### Scenario: Symbol with no options
- **WHEN** `ticker.options` returns an empty list (e.g., OTC stocks)
- **THEN** `options_matrix` SHALL be an empty array and the response SHALL include `"options_available": false`

### Requirement: Per-row options metrics
Each row in `options_matrix` SHALL contain computed metrics derived from ATM options data for that expiry.

#### Scenario: Row fields populated
- **WHEN** options data is successfully fetched for an expiry
- **THEN** each matrix row SHALL include: `horizon` (e.g., "1W"), `expiry` (YYYY-MM-DD), `days_to_expiry` (integer), `iv` (annualized IV as decimal), `expected_move_plus` (price), `expected_move_minus` (price), `atm_strike` (nearest strike to current price), `straddle_cost` (ATM call ask + ATM put ask), and `ai_strategy` (string)

#### Scenario: ATM strike selection
- **WHEN** computing ATM metrics
- **THEN** the ATM strike SHALL be the available strike closest to the current price of the underlying

#### Scenario: IV computed from ATM average
- **WHEN** both ATM call and ATM put are available
- **THEN** `iv` SHALL be the average of the ATM call's `impliedVolatility` and the ATM put's `impliedVolatility`

#### Scenario: Expected move calculation
- **WHEN** IV is available
- **THEN** `expected_move_plus` = `current_price + (current_price × iv × √(days_to_expiry / 252))` and `expected_move_minus` = `current_price - (current_price × iv × √(days_to_expiry / 252))`

#### Scenario: Straddle cost
- **WHEN** ATM call ask and ATM put ask are both available
- **THEN** `straddle_cost` = ATM call ask + ATM put ask

#### Scenario: Fetch error for a specific expiry
- **WHEN** the yfinance options fetch for a specific expiry fails (network error or timeout)
- **THEN** that row SHALL be omitted from the matrix; other rows SHALL be unaffected

### Requirement: AI strategy recommendation per horizon
Each matrix row SHALL include an AI-generated strategy recommendation for that expiry.

#### Scenario: Strategy present in row
- **WHEN** the AI forecast completes
- **THEN** each `options_matrix` row SHALL include `ai_strategy` as a short string (e.g., "Buy 195C", "Sell 185/200 strangle", "LEAPS 200C")

#### Scenario: Strategy reflects directional bias
- **WHEN** the AI directional bias is bullish
- **THEN** short-term strategies (1W–3W) SHALL lean toward calls or call spreads; long-term strategies (6M–12M) SHALL lean toward LEAPS calls or bullish spreads

#### Scenario: Strategy reflects neutral bias
- **WHEN** the AI directional bias is neutral
- **THEN** strategies SHALL lean toward premium-selling (strangles, iron condors) or cash-secured puts

### Requirement: Full chain drill-down on row click
Clicking an options matrix row SHALL load the full options chain for that expiry in the OPTIONS MATRIX sub-tab.

#### Scenario: Row click triggers chain fetch
- **WHEN** the user clicks a row in the options matrix
- **THEN** the OPTIONS MATRIX sub-tab SHALL fetch and render the full calls and puts chain for that expiry (reusing the existing `GET /options/{symbol}?expiration=<date>` endpoint)

#### Scenario: Back to matrix navigation
- **WHEN** the full chain is displayed and the user clicks a "← MATRIX" back button
- **THEN** the options matrix view SHALL be restored

#### Scenario: Loading state during chain fetch
- **WHEN** the full chain is being fetched
- **THEN** the sub-tab SHALL display a loading spinner; the previously visible matrix SHALL remain visible behind or above the spinner until the chain loads
