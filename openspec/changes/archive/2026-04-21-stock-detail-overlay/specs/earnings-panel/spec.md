## ADDED Requirements

### Requirement: Earnings data in detail endpoint
`GET /stock/{symbol}/detail` SHALL include an `earnings` object with upcoming and historical earnings data.

#### Scenario: Upcoming earnings included
- **WHEN** yfinance provides a future earnings date
- **THEN** the response `earnings.next_date`, `earnings.eps_estimate`, and `earnings.revenue_estimate` SHALL be populated

#### Scenario: Historical beat/miss history included
- **WHEN** yfinance provides earnings history
- **THEN** `earnings.history` SHALL contain the last 4 quarters as an array of `{ date, eps_actual, eps_estimate, beat }` where `beat` is a boolean

#### Scenario: Earnings data cached 24 hours
- **WHEN** the same symbol's detail is requested within 24 hours
- **THEN** earnings data SHALL be served from cache (earnings calendar does not change intraday)

### Requirement: Earnings panel in overlay
The stock detail overlay SHALL render an earnings section.

#### Scenario: Next earnings date displayed
- **WHEN** an upcoming earnings date is known
- **THEN** the panel SHALL display: date, EPS estimate, revenue estimate

#### Scenario: Beat/miss history displayed
- **WHEN** historical earnings data is available
- **THEN** the panel SHALL display the last 4 quarters as checkmarks/crosses (✅ beat / ❌ miss) with the most recent quarter first

#### Scenario: No earnings data
- **WHEN** yfinance returns no earnings data (e.g., ETFs)
- **THEN** the panel SHALL display "No earnings data available" instead of an error

#### Scenario: Last quarter detail
- **WHEN** the most recent quarter's earnings are shown
- **THEN** actual EPS, estimated EPS, and the surprise % SHALL be displayed alongside the beat/miss indicator
