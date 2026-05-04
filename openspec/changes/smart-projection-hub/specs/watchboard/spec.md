## ADDED Requirements

### Requirement: Curated watchboard as home view
The system SHALL display a curated watchboard as the default home view when the WATCHBOARD tab is selected, replacing the generic screener as the primary landing experience.

#### Scenario: Watchboard renders on launch
- **WHEN** the app first loads
- **THEN** the WATCHBOARD tab SHALL be active and render two lists: "BLUE CHIPS" and "EMERGING GROWTH"

#### Scenario: Default symbols pre-populated
- **WHEN** the user has not customized either list
- **THEN** BLUE CHIPS SHALL contain: AAPL, MSFT, NVDA, GOOGL, AMZN, META, TSLA, JPM, BRK-B, JNJ, V, UNH, XOM, HD, PG
- **AND** EMERGING GROWTH SHALL contain: PLTR, CRWD, SNOW, DDOG, COIN, SQ, HOOD, RBLX, RIVN, SOFI

### Requirement: Stock cards with Trade Score
Each symbol in the watchboard SHALL render as a card displaying the stock's current price, daily change, and Trade Score.

#### Scenario: Card data displayed
- **WHEN** a watchboard card renders
- **THEN** it SHALL show: ticker symbol, company name (truncated), current price, daily change % (green if positive, red if negative), Trade Score progress bar (0–100%), and a directional label (BULLISH / NEUTRAL / BEARISH) derived from the score

#### Scenario: Loading state per card
- **WHEN** Trade Score data is being fetched for a symbol
- **THEN** the card SHALL show a skeleton/spinner for the score bar while other available data (price, change) renders immediately

#### Scenario: Fetch error per card
- **WHEN** the Trade Score fetch fails for a symbol
- **THEN** that card SHALL show "--" for the score and remain interactive (clickable to open overlay)

### Requirement: Click card to open stock detail overlay
Clicking a watchboard card SHALL open the stock detail overlay for that symbol.

#### Scenario: Card click opens overlay
- **WHEN** the user clicks anywhere on a watchboard card
- **THEN** the stock detail overlay SHALL open with that symbol loaded

### Requirement: Compare pin on cards
Each watchboard card SHALL have a pin button allowing the user to mark it for comparison.

#### Scenario: Pin first stock
- **WHEN** the user clicks the pin icon on a card
- **THEN** that symbol SHALL be set as `compareSymbols[0]` in the store and the card SHALL show a "pinned" indicator

#### Scenario: Pin second stock triggers comparison view
- **WHEN** one symbol is already pinned and the user pins a second different symbol
- **THEN** the comparison view SHALL open immediately with both symbols loaded

#### Scenario: Unpin clears comparison
- **WHEN** the user clicks the pin icon on an already-pinned card
- **THEN** that symbol SHALL be removed from `compareSymbols` and the comparison view SHALL close if open

### Requirement: Add and remove symbols from lists
The user SHALL be able to add symbols to or remove symbols from each watchboard list.

#### Scenario: Add symbol to Blue Chips
- **WHEN** the user types a ticker in the "+ Add symbol" input in the Blue Chips section and presses Enter
- **THEN** that symbol SHALL be appended to the Blue Chips list and a Trade Score card SHALL load for it

#### Scenario: Remove symbol from list
- **WHEN** the user clicks the remove (×) button on a card
- **THEN** that symbol SHALL be removed from its list and its card SHALL disappear

#### Scenario: Additions persist across sessions
- **WHEN** the user adds or removes symbols
- **THEN** the custom lists SHALL be persisted in Zustand localStorage and restored on next app load

### Requirement: Screener accessible as secondary view
The existing screener functionality SHALL remain accessible inside the WATCHBOARD tab as a secondary sub-view.

#### Scenario: Screener sub-view toggle
- **WHEN** the user clicks "SCREENER" in the watchboard sub-view pill selector
- **THEN** the generic screener UI (filters, sortable table) SHALL render in place of the watchboard cards

#### Scenario: Return to watchboard
- **WHEN** the user clicks "WATCHLIST" or "BLUE CHIPS" pill
- **THEN** the watchboard card layout SHALL return
