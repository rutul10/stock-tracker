## ADDED Requirements

### Requirement: Model discovery endpoint
The system SHALL expose `GET /models` that returns a list of Ollama model names currently installed on the user's machine.

#### Scenario: Models returned
- **WHEN** Ollama is running and `GET /models` is called
- **THEN** the response SHALL be `{ "models": ["deepseek-r1", "plutus"] }` (or any installed models)

#### Scenario: Ollama unreachable
- **WHEN** Ollama is not running and `GET /models` is called
- **THEN** the response SHALL be `{ "models": [] }` with HTTP 200 (not 503) so the frontend degrades gracefully

#### Scenario: Model names normalized
- **WHEN** Ollama returns model names with tags (e.g., `"deepseek-r1:latest"`)
- **THEN** the backend SHALL strip the tag and return only the base name (`"deepseek-r1"`)

### Requirement: Frontend fetches models on mount
The `useModels` hook SHALL fetch `GET /models` once when the stock detail overlay first mounts and cache the result for the overlay's lifetime.

#### Scenario: Models available in toggle group
- **WHEN** `GET /models` returns model names
- **THEN** the multi-model toggle group SHALL render one toggle button per model

#### Scenario: No models available
- **WHEN** `GET /models` returns an empty array
- **THEN** the projection panel SHALL display "No Ollama models found. Start Ollama and pull a model." with the Analyze button disabled

#### Scenario: Model list not refetched on re-open
- **WHEN** the user closes and reopens the overlay
- **THEN** the frontend SHALL use the cached model list from the store rather than re-fetching
