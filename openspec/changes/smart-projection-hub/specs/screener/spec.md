## MODIFIED Requirements

### Requirement: Screener is a secondary view inside the WATCHBOARD tab
The generic screener (filters, sortable table) SHALL be demoted from the default home view to a secondary sub-view within the WATCHBOARD tab, accessible via a pill selector.

#### Scenario: Screener not shown on app launch
- **WHEN** the app first loads
- **THEN** the WATCHBOARD tab SHALL show the curated watchboard cards by default, not the screener form

#### Scenario: Screener reachable via pill selector
- **WHEN** the user clicks "SCREENER" in the WATCHBOARD tab's sub-view pill selector
- **THEN** the screener filters and sortable table SHALL render in place of the watchboard cards

#### Scenario: Screener results open stock overlay
- **WHEN** the user clicks a symbol in screener results
- **THEN** the stock detail overlay SHALL open for that symbol (behavior unchanged from prior spec)

#### Scenario: Return to watchboard from screener
- **WHEN** the user clicks "WATCHLIST" or any other pill in the sub-view selector
- **THEN** the watchboard card layout SHALL render and the screener form SHALL unmount
