## ADDED Requirements

### Requirement: Model toggle group in AI projection panel
The AI projection panel SHALL display a toggle group listing all available Ollama models, allowing the user to select one or more models to run.

#### Scenario: Models populated from discovery
- **WHEN** the stock detail overlay opens
- **THEN** the model toggle group SHALL display all models returned by `GET /models`

#### Scenario: Individual model selection
- **WHEN** the user toggles a model button
- **THEN** that model SHALL be included or excluded from the next projection run

#### Scenario: Select all toggle
- **WHEN** the user clicks "SELECT ALL"
- **THEN** all available models SHALL be checked

#### Scenario: At least one model required
- **WHEN** the user attempts to run projection with no models selected
- **THEN** the Analyze button SHALL be disabled and labeled "SELECT A MODEL"

### Requirement: Parallel projection requests
The system SHALL fire one `POST /projection` request per selected model simultaneously and render results as each completes.

#### Scenario: Parallel execution
- **WHEN** two models are selected and the user clicks Analyze
- **THEN** both requests SHALL be initiated concurrently (not sequentially)

#### Scenario: Progressive rendering
- **WHEN** the first model's response arrives while the second is still running
- **THEN** the first model's result card SHALL render immediately without waiting for the second

#### Scenario: Per-model loading state
- **WHEN** a model's projection is in flight
- **THEN** its result card SHALL show a spinner with an elapsed time counter

#### Scenario: Per-model error state
- **WHEN** one model returns an error (e.g., timeout)
- **THEN** only that model's card SHALL show an error; the other model's result SHALL display normally

### Requirement: Side-by-side result cards
Results for multiple models SHALL be displayed in a side-by-side layout.

#### Scenario: Two-model side-by-side
- **WHEN** two model results are available
- **THEN** they SHALL appear in two columns of equal width

#### Scenario: Single model full width
- **WHEN** only one model is selected
- **THEN** its result card SHALL use the full width of the projection panel

#### Scenario: Result card content
- **WHEN** a model's projection result is displayed
- **THEN** the card SHALL show: model name badge, probability % with fill bar, confidence level, AI reasoning text, supporting factors list, and key risks list

### Requirement: Auto-analyze toggle
The AI projection panel SHALL include an "AUTO ANALYZE" toggle. When enabled, projections run automatically for all checked models when the overlay opens.

#### Scenario: Auto-analyze off by default
- **WHEN** the overlay first opens
- **THEN** the AUTO ANALYZE toggle SHALL be off and no projection SHALL run automatically

#### Scenario: Auto-analyze fires on open
- **WHEN** AUTO ANALYZE is toggled on and the overlay is opened for a symbol
- **THEN** projections SHALL fire for all currently checked models without requiring a button click

#### Scenario: Auto-analyze toggle state persisted
- **WHEN** the user enables AUTO ANALYZE
- **THEN** that preference SHALL persist in Zustand (localStorage) across sessions

### Requirement: Explicit model field on projection endpoint
`POST /projection` SHALL accept an optional `model` field specifying which Ollama model to use.

#### Scenario: Explicit model used
- **WHEN** `POST /projection` is called with `model: "plutus"`
- **THEN** the backend SHALL call Ollama with `"model": "plutus"` and return `model_used: "plutus"` in the response

#### Scenario: Default model fallback
- **WHEN** `POST /projection` is called without a `model` field
- **THEN** the backend SHALL use the `OLLAMA_MODEL` environment variable (backwards compatible)
