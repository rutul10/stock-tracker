## ADDED Requirements

### Requirement: Selected models reconciled against available models
The system SHALL filter persisted `selectedModels` against the live `availableModels` list on load, removing any models that are no longer installed.

#### Scenario: Stale models filtered out
- **WHEN** `availableModels` loads and `selectedModels` contains models not in `availableModels`
- **THEN** those stale models SHALL be removed from `selectedModels`

#### Scenario: All selected models stale
- **WHEN** `availableModels` loads and none of the persisted `selectedModels` exist in `availableModels`
- **THEN** `selectedModels` SHALL be set to `[availableModels[0]]` (first available model)

#### Scenario: Available models empty
- **WHEN** `availableModels` returns an empty array
- **THEN** `selectedModels` SHALL be set to `[]` and the analyze button SHALL remain disabled
