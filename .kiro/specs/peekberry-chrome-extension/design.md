# Design Document

## Overview

Peekberry is a Chrome extension that provides a simplified, AI-driven interface for non-technical stakeholders to make ephemeral UI modifications to live web applications. The design focuses on a clean, intuitive user experience that bridges the gap between natural language commands and CSS modifications.

## Architecture

### Chrome Extension Architecture

The extension follows the standard Chrome extension architecture with three main components:

- **Popup**: Authentication interface and extension settings
- **Content Script**: DOM manipulation, element highlighting, and UI overlay
- **Background Script**: Extension lifecycle management and API communication

### Technology Stack

- **Frontend**: React with Material-UI components
- **Build Tool**: Vite for fast development and optimized builds
- **Authentication**: Supabase for user management
- **AI Integration**: API integration for natural language processing
- **Styling**: Material-UI theme system (no Tailwind)

### Data Flow

1. User activates extension → Content script injects floating widget
2. User selects element → Content script captures DOM context
3. User inputs command → Background script processes via AI API
4. AI returns CSS modifications → Content script applies changes
5. User exports results → Generate screenshot/CSS overrides

## Components and Interfaces

### Core Components

#### 1. Floating Widget (`FloatingWidget.tsx`)

- **Purpose**: Entry point for user interaction
- **Appearance**: Circular button with Peekberry logo
- **States**:
  - Collapsed: Small floating circle
  - Expanded: Chat-like interface overlay
- **Position**: Fixed positioning, non-intrusive placement
- **Interactions**: Click to expand/collapse

#### 2. Element Highlighter (`ElementHighlighter.tsx`)

- **Purpose**: Visual feedback for element selection
- **Functionality**:
  - Hover highlighting with subtle border
  - Click selection with persistent indicator
  - Context capture (element type, styles, dimensions)
- **Implementation**: Event listeners on document with CSS overlay

#### 3. Chat Interface (`ChatInterface.tsx`)

- **Purpose**: Natural language input and AI interaction
- **Components**:
  - Message history display
  - Text input field
  - Loading states for AI processing
  - Error handling and feedback
- **Layout**: Collapsible drawer/overlay design

#### 4. Authentication Flow (`AuthFlow.tsx`)

- **Purpose**: Supabase authentication integration
- **Components**:
  - Login/signup forms
  - Session management
  - Error handling
- **Integration**: Popup-based authentication

#### 5. Export Tools (`ExportTools.tsx`)

- **Purpose**: Screenshot capture and CSS export
- **Functionality**:
  - Page screenshot with modifications
  - CSS override generation
  - Copy-to-clipboard functionality

### API Interfaces

#### DOM Context Interface

```typescript
interface ElementContext {
  selector: string;
  tagName: string;
  className: string;
  computedStyles: CSSStyleDeclaration;
  dimensions: DOMRect;
  textContent: string;
  parentContext?: ElementContext;
}
```

#### AI Command Interface

```typescript
interface ModificationCommand {
  command: string;
  targetElement?: ElementContext;
  context: "element" | "page";
}

interface ModificationResponse {
  cssChanges: Record<string, string>;
  explanation: string;
  success: boolean;
  error?: string;
}
```

## Data Models

### User Session

```typescript
interface UserSession {
  id: string;
  email: string;
  authenticated: boolean;
  sessionToken: string;
}
```

### Modification State

```typescript
interface ModificationState {
  elementSelector: string;
  originalStyles: Record<string, string>;
  appliedStyles: Record<string, string>;
  command: string;
  timestamp: Date;
}
```

### Extension State

```typescript
interface ExtensionState {
  isActive: boolean;
  selectedElement: ElementContext | null;
  modifications: ModificationState[];
  chatHistory: ChatMessage[];
}
```

## Error Handling

### Authentication Errors

- **Scenario**: Failed login/signup
- **Handling**: Display user-friendly error messages, retry options
- **Fallback**: Redirect to authentication flow

### AI Processing Errors

- **Scenario**: Invalid commands, API failures
- **Handling**: Provide suggestions, fallback to manual CSS input
- **User Feedback**: Clear error messages with actionable guidance

### DOM Manipulation Errors

- **Scenario**: Protected elements, conflicting styles
- **Handling**: Graceful degradation, warning messages
- **Recovery**: Revert to previous state, suggest alternatives

### Cross-Site Compatibility

- **Scenario**: CSP restrictions, framework conflicts
- **Handling**: Detect compatibility issues, provide workarounds
- **Limitations**: Clear messaging about unsupported sites

## Testing Strategy

### Unit Testing (Keep to a MINIMUM)

- **Components**: React component testing with Jest/React Testing Library
- **Utilities**: DOM manipulation functions, CSS parsing
- **API Integration**: Mock AI responses, authentication flows

### Integration Testing (Keep to a MINIMUM)

- **Extension Flow**: End-to-end user workflows
- **Cross-Browser**: Chrome extension compatibility
- **Authentication**: Supabase integration testing

### Manual Testing

- **Real Websites**: Test on various staging environments
- **User Scenarios**: Non-technical user workflows
- **Edge Cases**: Complex DOM structures, dynamic content

## UI/UX Design Specifications

### Visual Design

#### Floating Widget

- **Size**: 60px diameter circle (collapsed)
- **Color**: Primary brand color with subtle shadow
- **Logo**: Peekberry icon, centered
- **Animation**: Smooth expand/collapse transitions
- **Positioning**: Bottom-right corner, 20px margins

#### Element Highlighting

- **Hover State**: 2px dashed border, primary color
- **Selected State**: 3px solid border, accent color
- **Overlay**: Semi-transparent background for context
- **Animation**: Smooth transitions, no jarring effects

#### Chat Interface

- **Layout**: Overlay panel, 400px width, variable height
- **Position**: Adjacent to floating widget, responsive positioning
- **Components**: Material-UI styled input, message bubbles
- **Theme**: Light theme with brand colors

### Interaction Patterns

#### Element Selection Flow

1. Extension activation → Floating widget appears
2. Page elements become highlightable
3. Hover → Visual feedback
4. Click → Element selection + context capture
5. Widget click → Chat interface opens

#### Command Processing Flow

1. User types natural language command
2. Loading state with spinner
3. AI processing indicator
4. Real-time DOM updates
5. Success/error feedback

#### Export Flow

1. User requests screenshot/CSS
2. Processing indicator
3. Generated content display
4. Copy-to-clipboard functionality
5. Success confirmation

## Project Structure

```
📦 peekberry-extension/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── manifest.json
│
📂 public/
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── peekberry-logo.svg
│
📂 src/
├── 🔧 config/
│   ├── supabase.ts
│   └── ai-client.ts
│
├── 📱 extension/
│   ├── popup/
│   │   ├── Popup.tsx
│   │   └── AuthFlow.tsx
│   ├── content/
│   │   ├── ContentScript.tsx
│   │   ├── FloatingWidget.tsx
│   │   ├── ElementHighlighter.tsx
│   │   ├── ChatInterface.tsx
│   │   └── ExportTools.tsx
│   └── background/
│       └── BackgroundScript.ts
│
├── 🎨 shared/
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── LoadingSpinner.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useElementSelection.ts
│   │   └── useAICommands.ts
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── ExtensionContext.tsx
│   └── utils/
│       ├── dom-utils.ts
│       ├── css-utils.ts
│       └── export-utils.ts
│
├── 🎨 theme/
│   ├── theme.ts
│   ├── colors.ts
│   └── components.ts
│
└── 📝 types/
    ├── extension.ts
    ├── dom.ts
    ├── ai.ts
    └── user.ts
```

## Security Considerations

### Content Security Policy

- Ensure extension works within CSP restrictions
- Handle inline style injection safely
- Validate all user inputs before DOM manipulation

### Data Privacy

- No persistent storage of page content
- Ephemeral modifications only
- Secure authentication token handling

### Cross-Origin Safety

- Respect CORS policies
- Handle iframe restrictions
- Safe DOM traversal and manipulation

## Performance Considerations

### DOM Manipulation

- Efficient element selection algorithms
- Minimal DOM queries and modifications
- Debounced hover events

### Memory Management

- Clean up event listeners on extension deactivation
- Efficient state management
- Garbage collection for temporary modifications

### Network Optimization

- Batch AI API requests when possible
- Implement request caching for common commands
- Optimize authentication token refresh
