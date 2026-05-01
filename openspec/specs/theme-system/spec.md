## ADDED Requirements

### Requirement: Three themes available
The system SHALL provide three visual themes: `dark` (default Bloomberg terminal), `light` (clean white), and `sand` (Claude-style warm cream).

#### Scenario: Default theme on first load
- **WHEN** a user opens the app for the first time
- **THEN** the `dark` theme SHALL be active

#### Scenario: All themes render with correct palette
- **WHEN** any theme is selected
- **THEN** the `--bg`, `--surface`, `--border`, `--text-primary`, `--text-muted`, `--accent-green`, `--accent-red`, `--accent-blue`, and `--nav-accent` CSS custom properties SHALL reflect the active theme's values with no fallback to another theme's colors

### Requirement: Theme toggle in status bar
The system SHALL render a theme toggle control in the top status bar that allows switching between all three themes.

#### Scenario: Toggle is always visible
- **WHEN** the app is in any tab or overlay state
- **THEN** the theme toggle SHALL be visible in the status bar

#### Scenario: Active theme is indicated
- **WHEN** a theme is active
- **THEN** its toggle button SHALL be visually distinguished from the inactive buttons

#### Scenario: Switching theme
- **WHEN** the user clicks a different theme button
- **THEN** the entire UI SHALL update to that theme in a single paint with no flash of unstyled content

### Requirement: Theme persisted to localStorage
The system SHALL persist the selected theme across page reloads via Zustand's persist middleware.

#### Scenario: Reload preserves theme
- **WHEN** the user selects the `sand` theme and reloads the page
- **THEN** the `sand` theme SHALL be active without requiring re-selection

### Requirement: Financial colors remain consistent across themes
Green (positive) and red (negative) price indicators SHALL maintain WCAG AA contrast ratio on all theme backgrounds.

#### Scenario: Green on sand background
- **WHEN** the `sand` theme is active
- **THEN** positive price changes SHALL use `#16a34a` (not `#00ff88`) to ensure readability on cream

#### Scenario: Green on dark background
- **WHEN** the `dark` theme is active
- **THEN** positive price changes SHALL use `#00ff88` (the existing neon accent)
