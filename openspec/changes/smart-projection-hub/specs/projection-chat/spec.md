## ADDED Requirements

### Requirement: Chat panel attached to AI projection result
The system SHALL render a conversational chat panel below the AI projection result within the stock detail overlay's AI PROJECTION sub-tab.

#### Scenario: Chat panel visible after projection loads
- **WHEN** an AI projection result is displayed in the overlay
- **THEN** a chat panel SHALL render below the result card with a text input and a prompt "Ask anything about this analysis..."

#### Scenario: Chat panel hidden before projection runs
- **WHEN** no projection has been run yet for the current symbol
- **THEN** the chat input SHALL not be visible; only the projection form SHALL show

### Requirement: Streaming LLM chat responses
The system SHALL stream AI responses word-by-word via Server-Sent Events so the user sees output appearing progressively.

#### Scenario: User sends a message
- **WHEN** the user types a question and presses Enter or clicks Send
- **THEN** the question SHALL appear in the chat history as a user bubble, the input SHALL clear, and the backend SHALL begin streaming a response

#### Scenario: Response streams progressively
- **WHEN** the backend is streaming a response
- **THEN** the assistant bubble SHALL appear immediately with an animated cursor, and words SHALL append as they arrive from the stream

#### Scenario: Stream completes
- **WHEN** the Ollama stream ends
- **THEN** the animated cursor SHALL disappear and the full response text SHALL be finalized in the chat history

#### Scenario: Streaming error handling
- **WHEN** the Ollama stream fails mid-response
- **THEN** the partial response SHALL remain visible and an error indicator SHALL appear; the user SHALL be able to retry

### Requirement: Chat context pre-loaded with analysis data
The backend chat endpoint SHALL receive the full analysis context so the AI can answer without fetching additional data.

#### Scenario: Context injected into system prompt
- **WHEN** the first chat message is sent for a symbol
- **THEN** the backend SHALL construct a system prompt including: symbol, current price, all technical indicator values, the previous projection result (probability, reasoning, risks, factors), and the user profile (risk tolerance, DTE preference)

#### Scenario: User profile shapes recommendations
- **WHEN** the user profile specifies DTE preference "monthly" and risk tolerance "conservative"
- **THEN** the AI SHALL only recommend options with ≥ 30 DTE and SHALL NOT suggest naked short-term speculative trades in its chat responses

#### Scenario: Multi-turn conversation
- **WHEN** the user asks a follow-up question referencing a prior answer
- **THEN** the backend SHALL receive the full `messages[]` history (system + all prior user and assistant turns) so the AI has conversational context

### Requirement: Conversation history capped to prevent context overflow
The system SHALL limit the conversation history sent to Ollama to prevent exceeding the model's context window.

#### Scenario: History cap enforced
- **WHEN** the conversation has more than 10 turns (5 user + 5 assistant)
- **THEN** the oldest turns SHALL be dropped from the messages array sent to Ollama; the system prompt SHALL always be included

#### Scenario: Cap indicator shown to user
- **WHEN** conversation history is truncated
- **THEN** a faint note SHALL appear in the chat: "Older messages not included in AI context"

### Requirement: Chat endpoint for streaming projection Q&A
The system SHALL expose `POST /projection/chat` accepting the symbol, context snapshot, user profile, and message history, returning an SSE stream.

#### Scenario: Endpoint accepts correct payload
- **WHEN** `POST /projection/chat` is called with `{symbol, context, user_profile, messages[]}`
- **THEN** the endpoint SHALL return `Content-Type: text/event-stream` with data chunks as Ollama tokens arrive

#### Scenario: Ollama unavailable returns 503
- **WHEN** Ollama is not running and `POST /projection/chat` is called
- **THEN** the endpoint SHALL return HTTP 503 with message "AI model unavailable — is Ollama running?"

#### Scenario: Conversation not persisted
- **WHEN** the user closes the stock detail overlay
- **THEN** the chat history SHALL be discarded; it is NOT saved to SQLite; the next time the overlay opens for any symbol, chat starts fresh
