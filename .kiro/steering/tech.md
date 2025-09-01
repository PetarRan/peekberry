# Technology Stack

## Core Technologies

- **Framework**: React with TypeScript
- **Build Tool**: Vite (for fast development and optimized builds)
- **UI Library**: Material-UI components (NO Tailwind CSS)
- **Authentication**: Supabase for user management and session handling
- **Extension Platform**: Chrome Extension Manifest V3

## Architecture Components

- **Popup**: Authentication interface and extension settings
- **Content Script**: DOM manipulation, element highlighting, UI overlay injection
- **Background Script**: Extension lifecycle management and API communication
- **AI Integration**: External API for natural language to CSS processing

## Key Dependencies

- React + TypeScript for component development
- Material-UI for consistent styling and theming
- Supabase client for authentication
- Chrome Extension APIs for content script injection and messaging

## Common Commands

### Development

```bash
npm install          # Install dependencies
npm run dev         # Start development server with hot reload
npm run build       # Build extension for production
npm run preview     # Preview production build
```

### Extension Testing

```bash
npm run build       # Build extension
# Then load unpacked extension in Chrome Developer Mode
# Navigate to chrome://extensions/ → Enable Developer Mode → Load Unpacked
```

### Type Checking

```bash
npm run type-check  # Run TypeScript compiler check
npm run lint        # Run ESLint for code quality
```

## Build Configuration

- Vite configured for Chrome extension build targets
- TypeScript strict mode enabled
- Material-UI theme system integration
- Content script and popup entry points configured
- Manifest.json generation for Chrome extension requirements
