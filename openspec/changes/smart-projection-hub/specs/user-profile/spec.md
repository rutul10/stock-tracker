## ADDED Requirements

### Requirement: User profile settings panel
The system SHALL provide a "My Profile" settings panel accessible via a gear icon in the navigation bar where the user can configure their trading style preferences.

#### Scenario: Profile panel opens
- **WHEN** the user clicks the gear icon in the nav bar
- **THEN** a modal or side panel SHALL open displaying the user profile settings

#### Scenario: Profile fields
- **WHEN** the profile panel is open
- **THEN** it SHALL show three settings: Risk Tolerance (Conservative / Moderate / Aggressive), Preferred DTE (Monthly 30d / Quarterly 90d / Annual 365d), and Max Position Size (free-text dollar amount)

#### Scenario: First-launch prompt
- **WHEN** the app loads and no profile has been set
- **THEN** the profile panel SHALL open automatically with a welcome message "Set your trading style to get personalized recommendations"

### Requirement: Profile persisted to localStorage
The user profile SHALL be stored locally and survive page reloads.

#### Scenario: Profile saves on change
- **WHEN** the user changes any profile setting
- **THEN** the new value SHALL be saved to Zustand store with localStorage persistence immediately (no save button required)

#### Scenario: Profile restored on reload
- **WHEN** the app loads after a prior session
- **THEN** previously saved profile settings SHALL be restored from localStorage

### Requirement: Profile consumed by AI prompts
The user profile SHALL be injected into all AI projection and chat prompts so recommendations are personalized.

#### Scenario: Conservative risk filters recommendations
- **WHEN** risk tolerance is "Conservative"
- **THEN** the projection prompt system instructions SHALL instruct the AI to: avoid recommending naked calls/puts, favor covered calls and cash-secured puts, flag trades with max loss > max position size as unsuitable

#### Scenario: DTE preference filters options
- **WHEN** preferred DTE is "Quarterly" (90d)
- **THEN** the options recommendations in chat and projections SHALL use expiries ≥ 90 DTE as the default suggestion

#### Scenario: Max position size used in sizing advice
- **WHEN** max position size is set to "$5,000"
- **THEN** the AI SHALL reference this when suggesting position sizes ("At $5,000 max, you could buy 14 contracts at $3.50 each")
