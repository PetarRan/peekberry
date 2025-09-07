# Peekberry

A Chrome extension and web application that enables users to edit any website's appearance using natural language commands.

## Project Structure

```
peekberry/
├── src/                    # Next.js webapp source code
│   └── app/(extension)/    # Chrome extension source code
├── extension/              # Chrome extension build output
├── .kiro/                  # Kiro configuration and specs
├── public/                 # Static assets for webapp
├── supabase/              # Database migrations and config
└── docs/                  # Project documentation
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Chrome browser for extension development

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy environment variables:

   ```bash
   cp .env.local.example .env.local
   ```

4. Configure your environment variables in `.env.local`:
   - Clerk authentication keys
   - Supabase database URL and keys
   - AI service API key (when implemented)

### Development

#### Webapp Development

```bash
# Start Next.js development server
npm run dev
```

#### Chrome Extension Development

```bash
# Build extension for development
npm run build:extension:dev

# Watch mode for extension development
npm run watch:extension
```

To load the extension in Chrome:

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `extension/dist` folder

### Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **UI**: Material UI, Emotion
- **State Management**: TanStack Query, Zustand
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **Validation**: Zod
- **Chrome Extension**: Manifest V3, TypeScript

## Features

- Point-and-click element selection on any webpage
- Natural language editing commands
- Session-based undo/redo functionality
- Screenshot capture and storage
- User dashboard with editing statistics

## Development Commands

```bash
# Development
npm run dev              # Start Next.js dev server
npm run build           # Build for production
npm run start           # Start production server
npm run type-check      # TypeScript type checking
npm run lint            # ESLint
npm run lint:fix        # Fix ESLint issues

# Chrome Extension
npm run build:extension:dev   # Build extension (development)
npm run build:extension:prod  # Build extension (production)
npm run watch:extension       # Watch mode for extension
```

## Contributing

This project follows the Kiro spec-driven development methodology. See `.kiro/specs/peekberry-mvp/` for detailed requirements, design, and implementation tasks.
