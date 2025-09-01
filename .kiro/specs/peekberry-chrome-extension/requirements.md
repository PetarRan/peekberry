# Requirements Document

## Introduction

Peekberry is a Chrome extension that empowers non-technical stakeholders (PMs, sales, demo peoples, customer success, presales teams) to make ephemeral UI modifications to live web applications using natural language commands. The tool provides a simplified, AI-driven interface that allows users to experiment with UI changes without requiring developer intervention or code deployment, ultimately accelerating feedback cycles and improving cross-team collaboration.

## Requirements

### Requirement 1

**User Story:** As a non-technical stakeholder, I want to activate Peekberry on any web page so that I can start making UI modifications without needing developer tools knowledge.

#### Acceptance Criteria

1. WHEN the user clicks the Peekberry extension icon THEN the system SHALL inject a floating circular widget with the Peekberry logo onto the current web page
2. WHEN the extension is active THEN the system SHALL make all DOM elements on the page highlightable on hover (excluding the Peekberry widget itself)
3. WHEN the user hovers over any element THEN the system SHALL display a subtle highlight border around that element
4. IF the page is refreshed or navigated THEN the system SHALL maintain the extension's active state

### Requirement 2

**User Story:** As a non-technical user, I want to select specific UI elements so that I can target my modification requests to the right components.

#### Acceptance Criteria

1. WHEN the user clicks on any highlighted element THEN the system SHALL select that element and display contextual information about it
2. WHEN an element is selected THEN the system SHALL show a persistent selection indicator around the element
3. WHEN an element is selected THEN the system SHALL capture relevant context (element type, current styles, text content, dimensions)
4. IF the user clicks on a different element THEN the system SHALL deselect the previous element and select the new one

### Requirement 3

**User Story:** As a non-technical user, I want to communicate my desired changes in natural language so that I don't need to learn CSS or technical terminology.

#### Acceptance Criteria

1. WHEN the user clicks the floating Peekberry circle THEN the system SHALL expand it into a chat-like interface overlay
2. WHEN the chat interface is open THEN the system SHALL provide a text input field for natural language commands
3. WHEN the user types a modification request THEN the system SHALL accept commands like "make this card taller", "center the button", "use our primary font here"
4. WHEN the user submits a command THEN the system SHALL process it through AI to generate appropriate CSS modifications
5. IF no element is selected AND the command is element-specific THEN the system SHALL prompt the user to select an element first
6. IF no element is selected AND the command is page-wide THEN the system SHALL attempt to apply the modification to the entire page or body element

### Requirement 4

**User Story:** As a non-technical user, I want to see my changes applied immediately so that I can iterate quickly on UI modifications.

#### Acceptance Criteria

1. WHEN the AI processes a valid modification command THEN the system SHALL apply the changes to the selected DOM element in real-time
2. WHEN changes are applied THEN the system SHALL make them ephemeral (not persisted to the actual codebase)
3. WHEN changes are applied THEN the system SHALL provide visual feedback confirming the modification
4. IF a command cannot be processed THEN the system SHALL provide clear error messaging and suggestions

### Requirement 5

**User Story:** As a non-technical user, I want to capture my modifications so that I can share my ideas with developers and designers.

#### Acceptance Criteria

1. WHEN the user requests a screenshot THEN the system SHALL capture the current state of the page with modifications applied
2. WHEN the user needs to share with developers THEN the system SHALL provide a simple copy/paste CSS override for the applied changes
3. WHEN the user closes the extension THEN the system SHALL revert all ephemeral changes to the original state

### Requirement 6

**User Story:** As a user, I want to authenticate with Peekberry so that I can access the tool's functionality.

#### Acceptance Criteria

1. WHEN the user first opens Peekberry THEN the system SHALL require authentication through Supabase before allowing any functionality
2. WHEN the user is authenticated THEN the system SHALL persist their session across browser sessions
3. WHEN the user is not authenticated THEN the system SHALL redirect them to the authentication flow
4. IF authentication fails THEN the system SHALL provide clear error messaging and retry options

### Requirement 7

**User Story:** As a user, I want the extension to work on standard web applications so that I can use it on common staging and production environments.

#### Acceptance Criteria

1. WHEN the extension is activated on standard HTML/React and similarly structured websites THEN the system SHALL inject necessary scripts without breaking existing functionality
2. WHEN the page has common CSS frameworks THEN the system SHALL apply modifications without major conflicts
3. IF the website blocks extension injection THEN the system SHALL provide appropriate error messaging

### Requirement 8

**User Story:** As a user, I want an intuitive desktop interface so that I can focus on my modifications rather than learning the tool.

#### Acceptance Criteria

1. WHEN the chat interface is open THEN the system SHALL position it to not obstruct important page content on desktop screens
2. WHEN the user interacts with the interface THEN the system SHALL provide immediate visual feedback
3. WHEN the user performs actions THEN the system SHALL use Material-UI components for consistent styling
