## MODIFIED Requirements

### Requirement: Overlay layout is sectioned
The overlay overview tab SHALL arrange content as: summary bar, price chart, then a two-column grid with news + collapsible financials (left) and DCF + earnings (right).

#### Scenario: Overview tab layout order
- **WHEN** the overview tab is active
- **THEN** content SHALL render top-to-bottom: summary bar → price chart → two-column grid (left: news, collapsible sections; right: DCF, earnings)

#### Scenario: Company description removed from overview
- **WHEN** the overview tab renders
- **THEN** the company description paragraph SHALL NOT be displayed (it adds vertical space without aiding quick scanning)

## ADDED Requirements

### Requirement: Summary bar displays key metrics
The overview tab SHALL display a 2-line compressed summary bar showing 6-8 hero metrics at the top, always visible without scrolling.

#### Scenario: Summary bar content
- **WHEN** stock detail data is loaded
- **THEN** the summary bar SHALL display: P/E (TTM), P/E (Fwd), Revenue Growth YoY, FCF Margin, EV/EBITDA, Mean PT with upside %, 52-week range, and Consensus rating — all on 1-2 lines

#### Scenario: Color coding in summary
- **WHEN** Revenue Growth is positive
- **THEN** it SHALL be colored green; negative values SHALL be colored red

#### Scenario: Missing data
- **WHEN** a metric is unavailable (null/undefined)
- **THEN** it SHALL display "—" in muted text color

### Requirement: Inline price chart with period toggle
The overview tab SHALL display a line chart of closing prices with selectable time periods: 1W, 1M, 3M.

#### Scenario: Default period
- **WHEN** the overview tab opens
- **THEN** the chart SHALL display 1M (1 month) of price data by default

#### Scenario: Period toggle
- **WHEN** the user clicks 1W, 1M, or 3M buttons above the chart
- **THEN** the chart SHALL fetch and display the corresponding period's closing prices

#### Scenario: Chart renders close prices as line
- **WHEN** price data is loaded
- **THEN** a Recharts LineChart SHALL render with date on x-axis and close price on y-axis, using the accent-green color

#### Scenario: Chart loading state
- **WHEN** price data is being fetched
- **THEN** the chart area SHALL display a spinner at the chart's expected height (no layout shift)

### Requirement: Collapsible financial sections
The financial data (Financials, Valuation, Balance Sheet, Technical, Analyst Consensus) SHALL be displayed in collapsible accordion sections instead of always-expanded lists.

#### Scenario: Default collapsed state
- **WHEN** the overview tab opens
- **THEN** all financial sections SHALL be collapsed by default, showing only the section header

#### Scenario: Expand a section
- **WHEN** the user clicks a section header (e.g., "▶ FINANCIALS")
- **THEN** the section SHALL expand to reveal its data rows with a "▼" indicator

#### Scenario: Collapse a section
- **WHEN** the user clicks an expanded section header
- **THEN** the section SHALL collapse back to header-only

#### Scenario: Multiple sections can be open
- **WHEN** one section is expanded and the user clicks another
- **THEN** both sections SHALL be open simultaneously (not exclusive accordion)

### Requirement: News positioned in left column
In the two-column layout, news articles SHALL appear in the left column above the collapsible financial sections.

#### Scenario: News in left column
- **WHEN** the overview tab renders
- **THEN** the news panel SHALL be in the left column, followed by collapsible financial sections below it

#### Scenario: DCF and earnings in right column
- **WHEN** the overview tab renders
- **THEN** DCF calculator and earnings panel SHALL remain in the right column
