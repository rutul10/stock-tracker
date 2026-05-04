## ADDED Requirements

### Requirement: News tab in main navigation
The system SHALL add a NEWS tab to the main navigation bar between WATCHBOARD and TRACKER.

#### Scenario: Tab visible and switchable
- **WHEN** the app loads
- **THEN** the navigation SHALL display three tabs: WATCHBOARD, NEWS, TRACKER with keyboard shortcut N for NEWS

#### Scenario: Tab renders news feed
- **WHEN** the user clicks the NEWS tab or presses N
- **THEN** the News component SHALL render showing aggregated news articles

### Requirement: Aggregated news from watchlist symbols
The News tab SHALL fetch news for all symbols in the user's combined watchlist (custom watchlist + blue chips + emerging) and display them merged chronologically.

#### Scenario: News loaded for watchlist symbols
- **WHEN** the News tab mounts
- **THEN** the system SHALL fetch news concurrently for up to 15 symbols (priority: custom watchlist → blue chips → emerging) and merge all articles sorted newest-first

#### Scenario: Deduplication by URL
- **WHEN** multiple symbols return the same article URL
- **THEN** the article SHALL appear only once, tagged with the first symbol that returned it

#### Scenario: Symbol count displayed
- **WHEN** news is loaded
- **THEN** a header SHALL show "NEWS · N symbols · cached Xm ago"

### Requirement: Ticker badge per article
Each article in the aggregated feed SHALL display a ticker badge indicating which symbol it relates to.

#### Scenario: Badge displayed
- **WHEN** an article is rendered in the all-news view
- **THEN** a clickable ticker badge (e.g., [NVDA]) SHALL appear before the headline

#### Scenario: Badge opens stock detail
- **WHEN** the user clicks a ticker badge
- **THEN** the stock detail overlay SHALL open for that symbol

### Requirement: Article display format
Each article SHALL display: ticker badge, headline (clickable external link), source name, and relative timestamp.

#### Scenario: Article row rendering
- **WHEN** an article is displayed
- **THEN** it SHALL show [SYMBOL] headline ... source time (e.g., "[V] Visa Expands Crypto Role... SimplyWS 1h")

#### Scenario: Headline opens external article
- **WHEN** the user clicks an article headline
- **THEN** a new browser tab SHALL open with the article's external URL

### Requirement: Filter by symbol or group
The News tab SHALL provide filtering to narrow articles by symbol text or watchlist group.

#### Scenario: Text filter
- **WHEN** the user types a symbol in the filter input
- **THEN** only articles matching that symbol SHALL be displayed

#### Scenario: Group filter buttons
- **WHEN** the user clicks ALL, BLUE CHIPS, or EMERGING filter buttons
- **THEN** articles SHALL be filtered to show only symbols from the selected group

#### Scenario: Clear filter
- **WHEN** the user clicks CLEAR or empties the filter input
- **THEN** all articles SHALL be shown again

### Requirement: Frontend caching to avoid redundant fetches
The News component SHALL skip re-fetching if data was fetched less than 5 minutes ago.

#### Scenario: Tab switch within 5 minutes
- **WHEN** the user switches away from NEWS and back within 5 minutes
- **THEN** the previously fetched articles SHALL be displayed without new API calls

#### Scenario: Manual refresh
- **WHEN** the user clicks the refresh button
- **THEN** the system SHALL re-fetch all symbols regardless of cache age

#### Scenario: Stale data indicator
- **WHEN** cached data is displayed
- **THEN** the header SHALL show how long ago the data was fetched (e.g., "cached 3m ago")

### Requirement: Loading and empty states
The News tab SHALL handle loading and empty states gracefully.

#### Scenario: Loading state
- **WHEN** news is being fetched
- **THEN** a spinner SHALL be displayed

#### Scenario: No watchlist symbols
- **WHEN** the user has no symbols in any watchlist
- **THEN** the system SHALL display "Add symbols to your watchlist to see news here"

#### Scenario: No articles found
- **WHEN** fetches complete but return zero articles
- **THEN** the system SHALL display "No recent news for your watchlist symbols"
