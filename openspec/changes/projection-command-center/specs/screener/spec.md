## ADDED Requirements

### Requirement: MARKET tab symbol search bar
The Screener / MARKET tab SHALL display a symbol search input above the Popular / Watchlist / Screener sub-view pills.

#### Scenario: Search bar rendered at top of MARKET tab
- **WHEN** the MARKET tab is active
- **THEN** a text input with placeholder "Search symbol (e.g. NVDA)..." SHALL be the first visible element, above the sub-view pill selector

#### Scenario: Enter opens stock detail overlay
- **WHEN** the user types a non-empty string into the search bar and presses Enter or clicks a search icon button
- **THEN** `detailSymbol` in the Zustand store SHALL be set to the uppercased trimmed input value, opening the stock detail overlay for that symbol

#### Scenario: Case normalization
- **WHEN** the user types "aapl" or "Aapl" and presses Enter
- **THEN** the overlay SHALL open for "AAPL" (uppercased)

#### Scenario: Empty input ignored
- **WHEN** the user presses Enter with a blank search field
- **THEN** no action SHALL be taken and no overlay SHALL open

#### Scenario: Search field cleared after open
- **WHEN** the overlay opens via the search bar
- **THEN** the search input SHALL be cleared so it is ready for the next search

## MODIFIED Requirements

### Requirement: Symbol cell triggers stock detail overlay
The symbol cell in every StockTable row SHALL render the ticker as a clickable element that opens the stock detail overlay, distinct from the row-level click that selects a symbol.

#### Scenario: Clicking symbol name opens overlay
- **WHEN** the user clicks the ticker text or company name within a StockTable row
- **THEN** `detailSymbol` in the Zustand store SHALL be set to that symbol, causing the overlay to open

#### Scenario: Row-level click still selects symbol
- **WHEN** the user clicks anywhere else in the row (price, volume, sector cells)
- **THEN** `selectedSymbol` SHALL be updated as before, without opening the overlay

#### Scenario: Symbol link styled distinctly
- **WHEN** the symbol cell renders
- **THEN** the ticker text SHALL be styled with `--accent-blue` color and an underline on hover to signal clickability
