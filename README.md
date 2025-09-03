# Peekberry Chrome Extension

Chrome extension for ephemeral UI modifications using natural language commands.

## Development Setup

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Build extension:

```bash
npm run build
```

4. Load extension in Chrome:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build extension for production (TypeScript + Vite)
- `npm run preview` - Preview production build
- `npm run type-check` - Run TypeScript compiler check
- `npm run lint` - Run ESLint for code quality

## Project Structure

- `src/extension/popup/` - Extension popup interface
- `src/extension/content/` - Content scripts injected into pages
- `src/extension/background/` - Background service worker
- `src/theme/` - Material-UI theme configuration
- `src/types/` - TypeScript type definitions

## Technology Stack

- **Frontend**: React 18.2 + TypeScript 5.0
- **UI Library**: Material-UI 5.14 components
- **Build Tool**: Vite 4.4 for fast development and optimized builds
- **Authentication**: Supabase 2.38 for user management
- **Extension Platform**: Chrome Extension Manifest V3
- **Development**: ESLint 8.45, Chrome types, Emotion styling
