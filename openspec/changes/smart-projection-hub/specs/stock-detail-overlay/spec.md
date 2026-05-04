## MODIFIED Requirements

### Requirement: Overlay includes a CHAT sub-tab
The stock detail overlay SHALL include a CHAT sub-tab alongside the existing FUNDAMENTALS, OPTIONS MATRIX, AI PROJECTION, and DCF sub-tabs.

#### Scenario: CHAT tab visible when projection has run
- **WHEN** an AI projection result exists for the current symbol
- **THEN** the CHAT tab SHALL be visible and accessible in the overlay sub-tab navigation

#### Scenario: CHAT tab hidden before projection runs
- **WHEN** no projection has been run for the current symbol in this session
- **THEN** the CHAT tab SHALL not appear in the sub-tab nav (not greyed out — absent)

#### Scenario: CHAT tab content renders ProjectionChat component
- **WHEN** the user clicks the CHAT tab
- **THEN** the `ProjectionChat` component SHALL render with the current symbol's projection context pre-loaded and an active text input

#### Scenario: CHAT sub-tab automatically selected after projection completes
- **WHEN** the user runs a projection from the AI PROJECTION sub-tab and the result loads
- **THEN** the active sub-tab SHALL automatically switch to CHAT so the user can immediately ask follow-up questions
