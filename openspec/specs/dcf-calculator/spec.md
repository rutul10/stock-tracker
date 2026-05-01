## ADDED Requirements

### Requirement: DCF inputs
The DCF calculator SHALL expose four user-adjustable inputs: Revenue CAGR (5yr), Margin Expansion (over 5yr), Terminal Growth Rate, and WACC.

#### Scenario: Default input values
- **WHEN** the overlay opens
- **THEN** the DCF inputs SHALL default to: CAGR 10%, margin expansion 1%, terminal growth 3%, WACC 10%

#### Scenario: Input ranges enforced
- **WHEN** the user adjusts an input
- **THEN** the system SHALL enforce: CAGR 0–30%, margin expansion 0–10%, terminal growth 0–6%, WACC 6–20%

### Requirement: Real-time intrinsic value calculation
The DCF calculator SHALL compute intrinsic value per share in the browser on every input change with no backend call.

#### Scenario: Calculation updates on input change
- **WHEN** any DCF input is changed
- **THEN** the displayed intrinsic value, upside/downside %, and fill bar SHALL update within a single render cycle

#### Scenario: DCF formula
- **WHEN** calculating intrinsic value, the system SHALL use:
  - `FCF_n = FCF_0 × (1 + cagr)^n × (1 + marginExpansion × n/5)` for n = 1..5
  - `TV = FCF_5 × (1 + tgr) / (wacc - tgr)`
  - `PV = Σ(FCF_n / (1+wacc)^n) + TV/(1+wacc)^5`
  - `IV_per_share = PV / sharesOutstanding`

#### Scenario: FCF base value unavailable
- **WHEN** FCF_0 cannot be calculated from yfinance data
- **THEN** the calculator SHALL display "Insufficient financial data for DCF" and hide the intrinsic value output

### Requirement: Upside/downside indicator
The calculator SHALL display the calculated intrinsic value versus the current market price.

#### Scenario: Upside shown in green
- **WHEN** the calculated intrinsic value exceeds the current price
- **THEN** the upside percentage SHALL be displayed in `--accent-green`

#### Scenario: Downside shown in red
- **WHEN** the calculated intrinsic value is below the current price
- **THEN** the downside percentage SHALL be displayed in `--accent-red`

### Requirement: DCF context passed to AI projection
The system SHALL include DCF assumptions and calculated intrinsic value in the AI projection prompt when the DCF calculator has valid output.

#### Scenario: DCF context in projection request
- **WHEN** the user triggers AI projection from the overlay
- **THEN** the projection request SHALL include: cagr, margin_expansion, terminal_growth, wacc, calculated_iv, and upside_pct as a structured `dcf_context` block

#### Scenario: AI projection prompt includes DCF section
- **WHEN** `dcf_context` is present in the projection request
- **THEN** `build_projection_prompt` SHALL append a "DCF CONTEXT" section to the prompt with the user's assumptions and calculated intrinsic value
