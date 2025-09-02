# Peekberry Chrome Extension

A Chrome extension that empowers non-technical stakeholders to make ephemeral UI modifications to live web applications using natural language commands.

## Overview

Peekberry enables PMs, sales teams, demo teams, customer success, and presales professionals to experiment with UI changes without developer intervention or code deployment. Perfect for accelerating feedback cycles and improving cross-team collaboration on staging and demo environments.

## Key Features

- **Natural Language Commands**: Modify UI elements using simple English ("make this button bigger", "center this text")
- **Real-time Visual Feedback**: See changes applied immediately with element highlighting
- **Ephemeral Changes**: No permanent code modifications - changes exist only in the browser session
- **Export Tools**: Capture screenshots and export CSS for developer handoff
- **Secure Access**: Authentication-gated via Supabase
- **Universal Compatibility**: Works on standard HTML/React web applications

## How It Works

1. **Activate Extension** → Floating widget appears on the page
2. **Select Elements** → Hover and click to select page elements
3. **Input Commands** → Use natural language to describe desired changes
4. **See Results** → Changes are applied immediately to the live page
5. **Export & Share** → Capture screenshots or export CSS for implementation

## Technology Stack

- **Frontend**: React with TypeScript
- **Build Tool**: Vite
- **UI Components**: Material-UI (no Tailwind CSS)
- **Authentication**: Supabase
- **Platform**: Chrome Extension Manifest V3
- **AI Integration**: External API for natural language processing

## Development

### Prerequisites

- Node.js and npm
- Chrome browser with Developer Mode enabled

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Testing the Extension

1. Run `npm run build` to create the extension bundle
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer Mode"
4. Click "Load unpacked" and select the build directory

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build extension for production
- `npm run preview` - Preview production build
- `npm run type-check` - Run TypeScript compiler check
- `npm run lint` - Run ESLint for code quality

## Project Structure

```
src/
├── extension/          # Chrome extension components
│   ├── popup/         # Authentication interface
│   ├── content/       # Content scripts for page injection
│   └── background/    # Background script
├── shared/            # Reusable components and utilities
├── theme/             # Material-UI theming
└── types/             # TypeScript definitions
```

## Contributing

This project uses TypeScript strict mode and follows Material-UI design patterns. Please ensure all code passes type checking and linting before submitting changes.

## License

[Add your license information here]
