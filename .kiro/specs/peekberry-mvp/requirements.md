# Requirements Document

## Introduction

Peekberry is a Chrome extension with companion admin webapp that enables non-technical users (PMs, presales, professional services) to make ephemeral UI edits on deployed web applications. The MVP focuses on allowing users to select elements on any webpage, issue natural-language commands, and see live visual changes with screenshot export capabilities and basic activity tracking.

## Requirements

### Requirement 1: User Authentication and Account Management

**User Story:** As a non-technical user, I want to create an account and authenticate across both the webapp and Chrome extension, so that I can securely access Peekberry's features and maintain my editing history.

#### Acceptance Criteria

1. WHEN a user visits the Peekberry webapp THEN the system SHALL provide email/password and OAuth/Google authentication options via Clerk
2. WHEN a user successfully authenticates THEN the system SHALL generate and store an auth token
3. WHEN a user installs the Chrome extension THEN the system SHALL prompt them to authenticate via the webapp
4. WHEN authentication is completed THEN the auth token SHALL be synced to the Chrome extension storage
5. WHEN a user accesses the webapp dashboard THEN the system SHALL verify their authentication status
6. IF a user is not authenticated THEN the system SHALL redirect them to the login page

### Requirement 2: Chrome Extension UI and Interaction

**User Story:** As a user browsing any website, I want to access Peekberry through a persistent interface that allows me to interact with page elements, so that I can make visual edits without disrupting my workflow.

#### Acceptance Criteria

1. WHEN a user visits any webpage THEN the Chrome extension SHALL display a persistent bubble in the bottom-right corner
2. WHEN a user clicks the Peekberry bubble THEN the system SHALL open an expandable chat panel
3. WHEN the chat panel is open THEN the system SHALL display a chat input box, element selection tool, edit history, and screenshot button
4. WHEN a user hovers over page elements THEN the system SHALL show visual outlines similar to Chrome DevTools
5. WHEN a user clicks on a page element THEN the system SHALL select it and add it to the chat context
6. WHEN an element is selected THEN the system SHALL capture its DOM identity (ID/class/DOM path) for AI processing

### Requirement 3: AI-Powered Visual Editing

**User Story:** As a user, I want to describe visual changes in natural language and see them applied immediately to selected elements, so that I can experiment with UI modifications without technical knowledge.

#### Acceptance Criteria

1. WHEN a user types a natural-language command with a selected element THEN the system SHALL send the command and element context to the AI service
2. WHEN the AI processes the command THEN the system SHALL return CSS/DOM mutation instructions
3. WHEN mutation instructions are received THEN the Chrome extension SHALL apply changes to the selected element in memory
4. WHEN changes are applied THEN the system SHALL update the visual appearance of the element immediately
5. WHEN edits are made THEN the system SHALL maintain a session-only history of changes
6. IF an AI command cannot be processed THEN the system SHALL provide clear error feedback to the user

### Requirement 4: Edit Management and Control

**User Story:** As a user making experimental changes, I want to undo and redo my edits, so that I can safely explore different visual modifications without fear of breaking the page.

#### Acceptance Criteria

1. WHEN a user makes an edit THEN the system SHALL add it to the undo stack
2. WHEN a user requests undo THEN the system SHALL revert the most recent change and update the redo stack
3. WHEN a user requests redo THEN the system SHALL reapply the most recently undone change
4. WHEN the browser session ends THEN the system SHALL clear all edit history
5. WHEN edits are applied THEN the system SHALL ensure changes remain scoped to selected elements only
6. WHEN a user navigates to a different page THEN the system SHALL clear the current edit session

### Requirement 5: Screenshot Export and Sharing

**User Story:** As a user who has made visual edits, I want to capture and export screenshots of my changes, so that I can share the modified UI with stakeholders and colleagues.

#### Acceptance Criteria

1. WHEN a user clicks the screenshot button THEN the system SHALL capture the current state of the webpage including all applied edits
2. WHEN a screenshot is captured THEN the system SHALL save it to the user's account in the webapp
3. WHEN a screenshot is saved THEN the system SHALL include timestamp and metadata
4. WHEN a user exports a screenshot THEN the system SHALL provide download functionality
5. WHEN screenshots are taken THEN the system SHALL update the user's activity counters
6. IF screenshot capture fails THEN the system SHALL provide clear error messaging

### Requirement 6: Admin Dashboard and Activity Tracking

**User Story:** As a user, I want to view my editing activity and manage my screenshots through a web dashboard, so that I can track my usage and access my saved work.

#### Acceptance Criteria

1. WHEN a user accesses the dashboard THEN the system SHALL display the number of edits made this month
2. WHEN a user accesses the dashboard THEN the system SHALL display the number of screenshots taken
3. WHEN a user views the dashboard THEN the system SHALL show a list of recent screenshots with thumbnails and timestamps
4. WHEN a user clicks on a screenshot THEN the system SHALL allow them to view or download it
5. WHEN a user accesses account settings THEN the system SHALL provide password reset and logout functionality
6. WHEN edit or screenshot activities occur THEN the system SHALL update the corresponding counters in real-time

### Requirement 7: Data Persistence and API Integration

**User Story:** As a user, I want my screenshots and activity data to be reliably stored and accessible across sessions, so that I can maintain a persistent record of my work.

#### Acceptance Criteria

1. WHEN screenshots are captured THEN the system SHALL store them in Supabase with proper user association
2. WHEN activity counters are updated THEN the system SHALL persist the changes to the database
3. WHEN API requests are made THEN the system SHALL include proper authentication headers
4. WHEN the webapp loads THEN the system SHALL fetch user data via REST API endpoints
5. IF API requests fail THEN the system SHALL provide appropriate error handling and retry mechanisms
6. WHEN user data is accessed THEN the system SHALL ensure proper authorization and data isolation

### Requirement 8: Technical Architecture and Performance

**User Story:** As a user, I want the extension and webapp to perform reliably across different websites and browsers, so that I can use Peekberry consistently in my workflow.

#### Acceptance Criteria

1. WHEN the extension loads on any website THEN the system SHALL inject content scripts without interfering with existing functionality
2. WHEN DOM mutations are applied THEN the system SHALL ensure they remain in memory only and don't persist to the original application
3. WHEN the extension communicates with the backend THEN the system SHALL use the background/service worker for API requests
4. WHEN multiple edits are made THEN the system SHALL maintain acceptable performance without memory leaks
5. WHEN the webapp is accessed THEN the system SHALL load within 3 seconds on standard internet connections
6. IF the extension encounters errors THEN the system SHALL fail gracefully without breaking the host website
