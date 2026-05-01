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

## ADDED Requirements

### Requirement: Increased table density and font size
The StockTable and global screener typography SHALL be updated for improved readability.

#### Scenario: Base font size increased
- **WHEN** the screener is rendered
- **THEN** the global base font SHALL be 14px (up from 13px) and table row padding SHALL be `10px 14px` (up from `8px 12px`)

#### Scenario: Company name sub-line readable
- **WHEN** a company name sub-line is shown beneath the ticker
- **THEN** it SHALL render at 12px (up from 10px) with `--text-muted` color

#### Scenario: Volume vs average column
- **WHEN** the full screener view returns results with `avg_volume` populated
- **THEN** a "VOL/AVG" column SHALL be displayed showing the ratio of current volume to average volume, formatted as `1.2x`, colored green if > 1.2x and red if < 0.8x
