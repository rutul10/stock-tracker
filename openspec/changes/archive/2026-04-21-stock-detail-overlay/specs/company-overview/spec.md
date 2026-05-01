## ADDED Requirements

### Requirement: Company fundamentals endpoint
The system SHALL expose `GET /stock/{symbol}/detail` returning company overview and earnings data.

#### Scenario: Successful response
- **WHEN** `GET /stock/{symbol}/detail` is called with a valid symbol
- **THEN** the response SHALL include: `name`, `sector`, `industry`, `market_cap`, `description`, `revenue`, `revenue_growth`, `gross_margin`, `ebitda_margin`, `net_margin`, `eps_ttm`, `eps_fwd`, `pe_ttm`, `pe_fwd`, `peg`, `ev_ebitda`, `fcf`, `fcf_margin`, `cash`, `total_debt`, `shares_outstanding`, `week52_low`, `week52_high`, `short_percent`, `analyst_target_mean`, `analyst_target_low`, `analyst_target_high`, `analyst_buy`, `analyst_hold`, `analyst_sell`

#### Scenario: Missing fields degrade gracefully
- **WHEN** yfinance does not provide a field (ETF, foreign ADR, etc.)
- **THEN** that field SHALL be `null` in the response (not an error)

#### Scenario: Response is cached
- **WHEN** the same symbol is requested within 1 hour
- **THEN** the response SHALL be served from cache without a new yfinance call

### Requirement: Company overview panel in overlay
The stock detail overlay SHALL render a company overview section displaying the fundamentals data.

#### Scenario: Metrics displayed in groups
- **WHEN** company data is loaded
- **THEN** metrics SHALL be grouped as: Financials (revenue, margins, EPS), Valuation (P/E, EV/EBITDA, PEG), Balance Sheet (cash, debt), Technical (52w range, short interest), and Analyst Consensus (mean PT, rating breakdown)

#### Scenario: Null fields shown as dash
- **WHEN** a metric value is `null`
- **THEN** the UI SHALL display `—` in place of the value

#### Scenario: FCF calculated from cash flow statement
- **WHEN** yfinance provides operating cash flow and capital expenditures
- **THEN** the backend SHALL compute `FCF = operatingCashFlow - capitalExpenditures` and return it
