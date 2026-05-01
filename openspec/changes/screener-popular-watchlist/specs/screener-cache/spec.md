## ADDED Requirements

### Requirement: Full screener responses are server-side cached by request params
The system SHALL cache `POST /screener` responses in memory with a TTL of 120 seconds, keyed on the hash of the request body parameters. Repeated identical requests within the TTL SHALL return the cached result.

#### Scenario: Identical screener request hits cache
- **WHEN** the user runs the screener with the same parameters within 120 seconds of a previous run
- **THEN** the cached result is returned without calling yfinance

#### Scenario: Different parameters bypass cache
- **WHEN** the user changes any filter parameter (sort_by, min_volume, sector, etc.) and runs the screener
- **THEN** a fresh yfinance fetch is performed and the new result is cached under the new key

#### Scenario: Cache expiry triggers fresh fetch
- **WHEN** the same screener request is made more than 120 seconds after the last cached fetch
- **THEN** fresh data is fetched from yfinance and the cache entry is refreshed
