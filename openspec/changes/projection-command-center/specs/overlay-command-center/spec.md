## ADDED Requirements

### Requirement: Main navigation reduced to two tabs
The main application navigation SHALL contain exactly two tabs: MARKET and TRACKER. The OPTIONS, CHART, and PROJECT tabs SHALL be removed.

#### Scenario: Only two tabs rendered
- **WHEN** the application loads
- **THEN** the navigation bar SHALL display only MARKET and TRACKER tab buttons

#### Scenario: Stale activeTab migrated on load
- **WHEN** the Zustand store initializes and `activeTab` in localStorage is one of the removed tab IDs (options, indicators, projector)
- **THEN** `activeTab` SHALL be reset to `"market"` before the first render

#### Scenario: Keyboard shortcuts updated
- **WHEN** the user presses a keyboard shortcut
- **THEN** `S` SHALL activate MARKET, `T` SHALL activate TRACKER; the O, C, P shortcuts SHALL be retired and have no effect

### Requirement: MARKET tab with symbol search
The MARKET tab SHALL display a symbol search bar above the existing Popular / Watchlist / Screener sub-view selector.

#### Scenario: Symbol search bar visible
- **WHEN** the MARKET tab is active
- **THEN** a search input with placeholder "Search symbol (e.g. NVDA)..." SHALL be displayed at the top of the tab, above the sub-view pills

#### Scenario: Enter key opens overlay
- **WHEN** the user types a ticker symbol into the search bar and presses Enter
- **THEN** the stock detail overlay SHALL open for that symbol, regardless of whether that symbol appears in the current screener results

#### Scenario: Empty search ignored
- **WHEN** the user presses Enter with an empty search field
- **THEN** no overlay SHALL open and no error SHALL be shown

#### Scenario: Search is exact ticker only
- **WHEN** the user types a partial company name or ISIN
- **THEN** no fuzzy lookup is performed; the symbol is passed as-is to the overlay

### Requirement: Overlay persistent chart zone
The stock detail overlay SHALL display a price chart in a persistent top zone that is always visible regardless of which sub-tab is active.

#### Scenario: Chart visible on open
- **WHEN** the stock detail overlay opens for any symbol
- **THEN** a price chart SHALL be rendered in the top zone before any sub-tab content loads

#### Scenario: Chart period controls
- **WHEN** the chart zone is displayed
- **THEN** period selector buttons SHALL be available: 1W, 1M, 3M, 6M, 1Y; default SHALL be 3M

#### Scenario: Chart type
- **WHEN** the chart renders
- **THEN** it SHALL display a Recharts ComposedChart with candlestick bars (or line if OHLC unavailable), SMA20 and SMA50 overlays, Bollinger Band shading, and a RSI sub-chart below the main chart

#### Scenario: Chart loading state
- **WHEN** price data is being fetched
- **THEN** the chart zone SHALL show a skeleton/spinner; the sub-tabs SHALL still render their loading states independently

### Requirement: Quick Stats side panel
The overlay SHALL display a compact Quick Stats card to the right of the chart, always visible in the top zone.

#### Scenario: Quick Stats fields
- **WHEN** the overlay detail data is loaded
- **THEN** the Quick Stats panel SHALL display: 52W Low / High, vs 200-DMA (%), Short Interest (%), Analyst Mean PT, PT Range, Upside to PT (%), Analyst Consensus rating, Next Earnings date, and Next Earnings EPS estimate

#### Scenario: Quick Stats loading state
- **WHEN** detail data is still loading
- **THEN** each Quick Stats field SHALL show a placeholder dash or skeleton

#### Scenario: Quick Stats unavailable fields
- **WHEN** a field (e.g., earnings date) is not available for the symbol
- **THEN** that field SHALL display "—" (em dash)

### Requirement: Four-tab sub-nav within overlay
Below the chart zone, the overlay SHALL display four sub-tabs: FUNDAMENTALS, OPTIONS MATRIX, AI PROJECTION, and DCF.

#### Scenario: Default sub-tab on open
- **WHEN** the overlay opens for any symbol
- **THEN** the FUNDAMENTALS sub-tab SHALL be active by default

#### Scenario: Sub-tab switching
- **WHEN** the user clicks a sub-tab label
- **THEN** the corresponding panel SHALL render in the content area below

#### Scenario: Sub-tab state resets between symbols
- **WHEN** the user closes the overlay and opens it for a different symbol
- **THEN** the active sub-tab SHALL reset to FUNDAMENTALS

### Requirement: FUNDAMENTALS sub-tab layout
The FUNDAMENTALS sub-tab SHALL consolidate all company data (financials, valuation, balance sheet, technical, analyst) into a single scrollable table, with news accessible via a collapsible section at the bottom.

#### Scenario: Financials section
- **WHEN** FUNDAMENTALS is active and detail data is loaded
- **THEN** the following rows SHALL be displayed: Revenue (TTM), Revenue Growth YoY, Gross Margin, EBITDA Margin, Net Margin, EPS (TTM), EPS (Fwd), FCF, FCF Margin

#### Scenario: Valuation section
- **WHEN** FUNDAMENTALS is active
- **THEN** P/E (TTM), P/E (Fwd), PEG Ratio, EV/EBITDA, P/FCF SHALL be displayed as a labeled section

#### Scenario: Balance sheet section
- **WHEN** FUNDAMENTALS is active
- **THEN** Cash, Total Debt, Net Cash, Shares Outstanding SHALL be displayed

#### Scenario: Technical section
- **WHEN** FUNDAMENTALS is active
- **THEN** 52W Low, 52W High, vs 200-DMA SHALL be displayed

#### Scenario: Analyst section
- **WHEN** FUNDAMENTALS is active
- **THEN** Mean PT, PT Range, Upside to PT, Number of Analysts, Consensus SHALL be displayed

#### Scenario: News collapsible
- **WHEN** FUNDAMENTALS is active
- **THEN** a "NEWS" collapsible section SHALL appear at the bottom; clicking it SHALL expand to show the news headlines list (from NewsPanel)

### Requirement: NEWS drawer in overlay header
The overlay header SHALL include a NEWS button that toggles a slide-out news drawer, providing access to headlines without occupying permanent column space.

#### Scenario: NEWS button in header
- **WHEN** the overlay is open
- **THEN** a NEWS button SHALL be visible in the overlay header bar

#### Scenario: Drawer opens on click
- **WHEN** the user clicks NEWS
- **THEN** a side drawer SHALL slide in from the right displaying the NewsPanel headlines; the rest of the overlay SHALL remain visible behind the drawer

#### Scenario: Drawer closes on overlay click or ESC
- **WHEN** the news drawer is open and the user clicks outside it or presses ESC
- **THEN** the drawer SHALL close

### Requirement: AI PROJECTION sub-tab houses forecast and multi-model projection
The AI PROJECTION sub-tab SHALL display the price forecast panel (auto-loaded) at the top, followed by the existing multi-model trade projection form and results.

#### Scenario: Forecast auto-loads on overlay open
- **WHEN** the overlay opens and AI PROJECTION sub-tab is visited (or the tab is navigated to)
- **THEN** `GET /forecast/{symbol}` SHALL be called automatically without requiring user interaction

#### Scenario: Forecast panel above trade projection form
- **WHEN** AI PROJECTION sub-tab is active
- **THEN** the PriceForecastPanel (bear/base/bull table, expected move, key levels, catalyst) SHALL be rendered above the existing MultiModelProjection form and result cards

#### Scenario: Trade projection form still accessible
- **WHEN** AI PROJECTION sub-tab is active
- **THEN** the MultiModelProjection component (model toggle, trade type/direction form, Analyze button, result cards) SHALL still be present and functional below the forecast panel
