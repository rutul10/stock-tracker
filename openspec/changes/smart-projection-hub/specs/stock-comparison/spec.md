## ADDED Requirements

### Requirement: Comparison view triggered by pinning two stocks
The system SHALL render a full-screen comparison view when the user pins two different symbols from the watchboard.

#### Scenario: Comparison opens on second pin
- **WHEN** one symbol is already pinned and the user pins a second symbol
- **THEN** the comparison view SHALL overlay the watchboard at full viewport height and width with both symbols loaded

#### Scenario: Comparison dismissed
- **WHEN** the user clicks "×" or presses ESC while the comparison view is open
- **THEN** the comparison view SHALL close and both pins SHALL be cleared

#### Scenario: Comparison state in store
- **WHEN** two symbols are pinned
- **THEN** `compareSymbols: [string, string]` in the Zustand store SHALL contain both tickers and the comparison view SHALL render

### Requirement: Four comparison views selectable via tabs
The comparison view SHALL offer four distinct views accessed via tab buttons at the top.

#### Scenario: Default view is Verdict
- **WHEN** the comparison view first opens
- **THEN** the VERDICT tab SHALL be active

#### Scenario: Tab navigation
- **WHEN** the user clicks PROJECTION, BREAKDOWN, or OPTIONS tabs
- **THEN** the corresponding view SHALL render in the main content area without reloading data

### Requirement: Verdict view — plain-English winner summary
The VERDICT view SHALL display a side-by-side summary using plain English labels, not raw indicator values.

#### Scenario: Verdict layout
- **WHEN** the VERDICT view is active and both stocks have loaded
- **THEN** the view SHALL show two columns (one per symbol) each containing: Trade Score bar, Momentum label (Strong ▲▲ / Building ▲ / Neutral → / Weakening ▼ / Weak ▼▼), Trend label (Bullish / Neutral / Bearish), Volatility Risk label (Low 🟢 / Medium 🟡 / High 🔴), and 2-week price outlook range (e.g., "$172–$181")

#### Scenario: AI verdict recommendation
- **WHEN** both stocks are loaded
- **THEN** the VERDICT view SHALL show a single-sentence AI recommendation below the columns (e.g., "NVDA has stronger momentum but higher risk; AAPL is the safer play for a monthly options buyer.")

#### Scenario: Loading state
- **WHEN** data for one stock is still loading
- **THEN** that column SHALL show skeleton loaders while the other column displays data if ready

### Requirement: Projection view — visual price cone for both stocks
The PROJECTION view SHALL display a visual chart showing bear/base/bull price targets over 2 and 4 weeks for both stocks.

#### Scenario: Projection cone chart rendered
- **WHEN** the PROJECTION view is active and price projections are available
- **THEN** a Recharts ComposedChart SHALL render two sets of Area series (one per symbol) showing bear (lower bound), base (midline), and bull (upper bound) prices over time on a shared x-axis (today → +2W → +4W)

#### Scenario: Stock labels on chart
- **WHEN** two stocks are shown on the same projection chart
- **THEN** each stock's cone SHALL be distinguishable by color (blue for stock A, orange for stock B) with a legend

#### Scenario: Data table below chart
- **WHEN** the PROJECTION view is active
- **THEN** a table below the chart SHALL show exact bear/base/bull prices for each stock at the 2W and 4W horizons

### Requirement: Indicator Breakdown view — plain-English factor table
The BREAKDOWN view SHALL show a comparison table with plain-English labels for each technical factor.

#### Scenario: Breakdown table structure
- **WHEN** the BREAKDOWN view is active
- **THEN** a table SHALL render with rows: Momentum (RSI-based), Trend (SMA crossover), Volatility (ATR), Options Activity (IV rank + volume ratio), and Overall Score — with columns: Factor, Stock A value (plain English), Stock B value (plain English), and Winner (which stock wins this factor)

#### Scenario: Plain-English values
- **WHEN** the RSI for a stock is 68
- **THEN** the Momentum cell SHALL display "Strong ▲" not "68"

#### Scenario: Winner column
- **WHEN** a factor clearly favors one stock
- **THEN** the Winner cell SHALL show the favored ticker in accent-green; if roughly equal, it SHALL show "—"

### Requirement: Options Head-to-Head view — best monthly trade per stock
The OPTIONS view SHALL show the AI-recommended monthly options trade for each stock side by side.

#### Scenario: Recommended trade displayed per stock
- **WHEN** the OPTIONS view is active and the user profile has a DTE preference set
- **THEN** each stock's column SHALL show: recommended option (e.g., "$175 Call, Jul 18"), probability of profit %, cost per contract, break-even price, max loss, and risk level label

#### Scenario: DTE filter applied to recommendations
- **WHEN** the user's profile DTE preference is "monthly" (30 DTE)
- **THEN** recommended options SHALL use the nearest expiry ≥ 30 DTE; if "quarterly" then ≥ 90 DTE

#### Scenario: Safer pick highlighted
- **WHEN** one stock's recommended option has lower cost AND comparable probability
- **THEN** that column SHALL be highlighted with a "SAFER PICK" badge
