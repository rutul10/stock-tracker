## ADDED Requirements

### Requirement: Extended projection response with price forecast fields
`POST /projection` SHALL return additional structured fields for price projections, directional bias, key levels, and per-expiry options strategies when the AI model produces them.

#### Scenario: New fields present in response
- **WHEN** `POST /projection` returns successfully and the AI model includes price forecast data
- **THEN** the response SHALL include `price_projections` (object), `directional_bias` (string), `bias_confidence` (string), `key_support` (array of numbers), `key_resistance` (array of numbers), and `options_strategies` (object)

#### Scenario: Backwards compatibility for missing fields
- **WHEN** the AI model does not return price forecast fields (e.g., older model or malformed response)
- **THEN** `price_projections`, `key_support`, `key_resistance`, and `options_strategies` SHALL default to `null` and the response SHALL still be valid

#### Scenario: price_projections structure
- **WHEN** `price_projections` is present in the response
- **THEN** it SHALL contain keys `1_week`, `2_weeks`, `1_month`, each with `bear`, `base`, and `bull` as numeric price values

#### Scenario: options_strategies structure
- **WHEN** `options_strategies` is present in the response
- **THEN** it SHALL contain keys matching available horizons (e.g., `"1_week"`, `"1_month"`, `"3_months"`) each with a `strategy` string and a `reasoning` string

### Requirement: Extended AI prompt with price forecast instructions
The AI prompt built by `prompt_builder.py` SHALL include instructions for the model to return price projections, directional bias, key levels, and per-expiry options strategies as part of its JSON output.

#### Scenario: Prompt includes price projection instructions
- **WHEN** `build_projection_prompt()` is called
- **THEN** the returned prompt string SHALL instruct the AI to include `price_projections`, `directional_bias`, `bias_confidence`, `key_support`, `key_resistance`, and `options_strategies` in its JSON response

#### Scenario: Prompt includes IV-implied move as anchor
- **WHEN** options summary data is available (ATM IV present)
- **THEN** the prompt SHALL include the computed IV-implied ±move for 1W, 2W, and 1M as context for price target calibration

#### Scenario: Prompt includes ATR-based range as anchor
- **WHEN** ATR indicator data is available
- **THEN** the prompt SHALL include ATR-based range estimates (1×ATR for 1W, 1.5×ATR for 2W, 3×ATR for 1M) alongside IV-implied moves

### Requirement: Result card displays price forecast
When a model's result card is rendered in the MultiModelProjection component, it SHALL display the price projections and key levels if present.

#### Scenario: Price projections table in result card
- **WHEN** a result card's `price_projections` is non-null
- **THEN** the card SHALL display a compact 3×3 table (rows: 1W, 2W, 1M; columns: BEAR, BASE, BULL) with price values in monospace font, color-coded: bear=red, base=blue, bull=green

#### Scenario: Key levels displayed in result card
- **WHEN** `key_support` and `key_resistance` are non-null
- **THEN** the card SHALL display up to 3 support levels and 3 resistance levels as colored chips below the projections table

#### Scenario: No price projections
- **WHEN** `price_projections` is null in the result
- **THEN** the result card SHALL render as before (probability bar, reasoning, risks, factors) without a projections table section
