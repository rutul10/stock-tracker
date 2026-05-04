## MODIFIED Requirements

### Requirement: Projection response includes structured price projections
`POST /projection` SHALL return structured `price_projections` and `directional_bias` fields as required output, not optional fields.

#### Scenario: price_projections always present
- **WHEN** `POST /projection` succeeds
- **THEN** the response SHALL include `price_projections` with bear/base/bull price targets for at least the 2W and 1M horizons; these fields SHALL NOT be null or absent

#### Scenario: price_projections horizons aligned to safe-player timeframes
- **WHEN** the response includes `price_projections`
- **THEN** the horizons SHALL be `2W`, `1M`, and `3M` (not 1W, which is a weekly-options horizon)

#### Scenario: directional_bias always present
- **WHEN** `POST /projection` succeeds
- **THEN** the response SHALL include `directional_bias` as one of: `bullish`, `neutral`, `bearish`; this field SHALL NOT be null or absent

#### Scenario: Prompt instructs structured output
- **WHEN** the projection prompt is built
- **THEN** the JSON schema in the prompt SHALL explicitly require `price_projections` with 2W/1M/3M horizons and `directional_bias`; the AI SHALL be told these fields are mandatory

### Requirement: User profile injected into projection prompt
The projection prompt SHALL include the user's risk tolerance and DTE preference so the AI tailors its reasoning and recommendations.

#### Scenario: Conservative profile shapes reasoning
- **WHEN** `POST /projection` is called with `user_profile: {risk_tolerance: "conservative", preferred_dte: "monthly"}`
- **THEN** the AI reasoning in the response SHALL explicitly consider monthly-timeframe options and SHALL NOT recommend sub-30-DTE strategies in `key_risks` or `supporting_factors`

#### Scenario: No user profile falls back to neutral framing
- **WHEN** `POST /projection` is called without a `user_profile` field
- **THEN** the prompt SHALL use neutral framing (behavior unchanged from prior spec)
