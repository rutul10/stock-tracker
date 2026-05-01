## ADDED Requirements

### Requirement: Overlay opens on symbol click
The system SHALL render a full-screen overlay when the user clicks a stock symbol name in any stock table (screener, popular, watchlist).

#### Scenario: Click symbol name opens overlay
- **WHEN** the user clicks a stock symbol or company name in any StockTable row
- **THEN** a full-screen overlay SHALL appear with that symbol's data loaded

#### Scenario: Screener context preserved
- **WHEN** the overlay is open
- **THEN** the screener table underneath SHALL remain mounted (not unmounted) so dismissing the overlay returns to the exact prior state

### Requirement: Overlay dismissed via ESC or back button
The system SHALL provide two ways to close the overlay.

#### Scenario: ESC key dismissal
- **WHEN** the overlay is open and the user presses the ESC key
- **THEN** the overlay SHALL close and `detailSymbol` SHALL be set to `null`

#### Scenario: Back button dismissal
- **WHEN** the user clicks the "← BACK" button in the overlay header
- **THEN** the overlay SHALL close

### Requirement: Overlay header shows symbol summary
The overlay header SHALL display: symbol ticker, company name, current price, day change %, a watchlist toggle button, and the model selector.

#### Scenario: Header data loaded
- **WHEN** the overlay opens
- **THEN** price and change % SHALL be shown immediately using data already present in the screener results (no extra API call required for these fields)

### Requirement: Overlay layout is sectioned
The overlay SHALL arrange its content in clearly delineated sections: Price Chart, Company Overview, Earnings, News, Options Chain (summary), DCF Calculator, and AI Projection.

#### Scenario: All sections visible on open
- **WHEN** the overlay opens
- **THEN** each section SHALL render with a loading state or data, never blank/missing

### Requirement: Overlay scrolls independently
The overlay SHALL have its own scroll context so the user can scroll through the detail content without affecting the screener.

#### Scenario: Overlay scroll
- **WHEN** the user scrolls within the overlay
- **THEN** the background screener table SHALL NOT scroll
