## ADDED Requirements

### Requirement: User can add symbols to a persistent watchlist
The system SHALL allow users to add any ticker symbol to a personal watchlist. The watchlist SHALL be persisted to browser `localStorage` so it survives page refreshes. The watchlist SHALL store symbols as an array of uppercase strings.

#### Scenario: Add symbol from Popular view
- **WHEN** the user clicks the `[+]` button on a row in the Popular sub-view
- **THEN** that symbol is added to the watchlist and the button state reflects it is already watched

#### Scenario: Add symbol via input field in Watchlist view
- **WHEN** the user types a ticker symbol into the "Add Symbol" input in the Watchlist sub-view and submits
- **THEN** the symbol is added to the watchlist (uppercased) and the input is cleared

#### Scenario: Duplicate symbols are ignored
- **WHEN** the user attempts to add a symbol already in the watchlist
- **THEN** the symbol is not added again and the watchlist remains unchanged

#### Scenario: Watchlist persists across page refreshes
- **WHEN** the user adds symbols to the watchlist and reloads the page
- **THEN** the watchlist contains the same symbols as before the reload

### Requirement: User can remove symbols from the watchlist
The system SHALL allow users to remove any symbol from the watchlist via a remove control on each watchlist row.

#### Scenario: Remove symbol from Watchlist view
- **WHEN** the user clicks the remove (`×`) button on a watchlist row
- **THEN** the symbol is removed from the watchlist and the row disappears from the table

### Requirement: Watchlist view fetches live data for saved symbols
The system SHALL expose a `POST /screener/watchlist` endpoint accepting `{ "symbols": ["AAPL", ...] }` and returning the same lightweight data shape as popular stocks (symbol, price, change_pct, volume) for each valid symbol. The frontend Watchlist sub-view SHALL call this endpoint when the view is shown.

#### Scenario: Watchlist data loads for saved symbols
- **WHEN** the user navigates to the Watchlist sub-view with symbols in their watchlist
- **THEN** current price, change%, and volume are displayed for each symbol

#### Scenario: Empty watchlist shows prompt
- **WHEN** the user opens the Watchlist sub-view with no symbols saved
- **THEN** the view shows a prompt instructing the user to add symbols

#### Scenario: Invalid symbol shows error row
- **WHEN** a symbol in the watchlist returns no data from yfinance
- **THEN** the row for that symbol shows "—" for all data fields rather than crashing
