## ADDED Requirements

### Requirement: Minimum DTE filter on options endpoints
All options-returning endpoints SHALL accept a `min_dte` query parameter that filters out expiry dates with fewer days to expiration than the specified minimum.

#### Scenario: Default min_dte of 30
- **WHEN** `GET /options/{symbol}` is called without a `min_dte` parameter
- **THEN** the response SHALL only include expiry dates with DTE ≥ 30 (weekly options excluded by default)

#### Scenario: Explicit min_dte override
- **WHEN** `GET /options/{symbol}?min_dte=90` is called
- **THEN** only expiries with DTE ≥ 90 SHALL be returned

#### Scenario: Advanced mode disables filter
- **WHEN** `GET /options/{symbol}?min_dte=0` is called
- **THEN** all available expiry dates SHALL be returned including weeklies

#### Scenario: No qualifying expiries fallback
- **WHEN** no expiry dates exist with DTE ≥ `min_dte`
- **THEN** the response SHALL return the nearest available expiry with a warning field `"filter_warning": "No expiries meet min_dte; returning nearest available"`

### Requirement: Options UI defaults to monthly view
The options chain UI within the stock detail overlay SHALL default to showing only monthly+ expiries.

#### Scenario: Expiry selector pre-filtered
- **WHEN** the OPTIONS MATRIX sub-tab opens
- **THEN** the expiry dropdown/selector SHALL only list expiries ≥ 30 DTE by default

#### Scenario: Show Weeklies toggle
- **WHEN** the user clicks "SHOW WEEKLIES" toggle in the options UI
- **THEN** the expiry selector SHALL reload with all available expiries including sub-30-DTE options

#### Scenario: Toggle state not persisted
- **WHEN** the user enables weeklies and then closes and reopens the overlay
- **THEN** the options view SHALL revert to monthly+ default (the toggle is per-session only)

### Requirement: Safe-player strategy labels surfaced by default
The options view SHALL label common conservative strategies and de-emphasize speculative short-term trades.

#### Scenario: Strategy badges on recommended options
- **WHEN** an AI-recommended option is displayed in the comparison OPTIONS view
- **THEN** it SHALL include a strategy label: "COVERED CALL", "CASH-SECURED PUT", "LEAP", or "LONG CALL/PUT" — never "WEEKLY GAMBLE" or speculative framing

#### Scenario: Conservative strategies listed first
- **WHEN** the chat AI suggests option strategies in response to a user question
- **THEN** covered calls and cash-secured puts SHALL be mentioned before long calls/puts for a user with Conservative or Moderate risk tolerance
