## MODIFIED Requirements

### Requirement: Screener tab displays three sub-views via pill toggle
The Screener tab SHALL present three sub-views — **Popular**, **Watchlist**, and **Screener** — toggled via a pill/segment control at the top of the tab. The **Popular** sub-view SHALL be the default shown on first load. Each sub-view SHALL render the same `StockTable` component with data sourced from its respective endpoint.

#### Scenario: Default view is Popular on first open
- **WHEN** the user opens the Screener tab for the first time in a session
- **THEN** the Popular sub-view is active and stock data is shown automatically

#### Scenario: Toggling to Screener shows existing filter UI
- **WHEN** the user clicks the "SCREENER" pill
- **THEN** the existing filter form (sort, sector, min vol, min price, limit, RUN SCREEN button) is shown and the Popular/Watchlist tables are hidden

#### Scenario: Toggling between sub-views preserves loaded data
- **WHEN** the user loads the Popular view, switches to Screener, then switches back to Popular
- **THEN** the Popular data is still shown without re-fetching (using frontend cached state)

#### Scenario: Screener sub-view still requires user action to fetch
- **WHEN** the user switches to the Screener sub-view
- **THEN** no automatic fetch occurs; the user must click "RUN SCREEN" to load results
