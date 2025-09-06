# 🍓 Peekberry Chrome Extension

A Chrome extension that empowers non-technical stakeholders to make ephemeral UI modifications to live web applications using natural language commands.

## 🚀 Quick Start

### Development Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Build the extension**

   ```bash
   npm run build
   ```

3. **Load in Chrome**

   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

4. **Test the extension**
   - Click the Peekberry icon in your browser
   - Click "Skip for Development" to bypass authentication
   - Popup automatically closes after authentication
   - Floating widget appears on any webpage

## 🔧 Development Features

### Authentication & User Experience

The extension provides a streamlined, user-friendly experience:

- **Automatic Activation** - Popup automatically closes after successful authentication, immediately activating the extension
- **Seamless Transition** - No manual popup closure required - authentication flows directly into active extension state
- **Instant Access** - Floating widget appears on web pages immediately after authentication completes

#### Development Mode (DEV ONLY)

For development purposes, you can skip the authentication flow:

- **"Skip for Development" button** - Bypasses Google OAuth and creates a fake user
- **Automatic session** - Creates a development user session without requiring Supabase setup
- **Instant activation** - Extension activates immediately after development bypass

> ⚠️ **Important**: The "Skip for Development" button is for development only and should be removed in production builds.

### Current Features

- ✅ **Floating Widget** - Appears in bottom-right corner of web pages
- ✅ **Element Highlighting** - Hover over elements to see blue dashed borders
- ✅ **Element Selection** - Click elements to select them (orange solid border)
- ✅ **Context Capture** - Automatically captures element properties, styles, and dimensions
- ✅ **Material-UI Integration** - Consistent styling throughout the extension

## 🏗️ Architecture

### Extension Components

- **Popup** (`src/extension/popup/`) - Authentication interface and extension settings
- **Content Script** (`src/extension/content/`) - DOM manipulation, element highlighting, UI overlay injection
- **Background Script** (`src/extension/background/`) - Extension lifecycle management and API communication

### Key Files

- `FloatingWidget.tsx` - The main floating button that appears on web pages
- `ElementHighlighter.tsx` - Handles element hover/click interactions and visual feedback
- `ContentScript.tsx` - Coordinates between floating widget and element highlighter
- `AuthFlow.tsx` - Authentication interface with development bypass

## 🎯 Roadmap

### Completed ✅

- [x] Basic extension structure
- [x] Floating widget with Peekberry branding
- [x] Element highlighting and selection
- [x] Context capture (selector, styles, dimensions)
- [x] Development authentication bypass

### In Progress 🚧

- [ ] Chat interface for natural language commands
- [ ] AI integration for CSS generation
- [ ] Screenshot capture and export tools

### Planned 📋

- [ ] Production authentication flow
- [ ] Subscription management
- [ ] Advanced element targeting
- [ ] Undo/redo functionality
- [ ] Team collaboration features

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Build extension for development
npm run build

# Build extension for production
npm run build:extension

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📁 Project Structure

```
src/
├── extension/          # Chrome extension specific code
│   ├── popup/         # Extension popup (auth interface)
│   ├── content/       # Content scripts (injected into pages)
│   └── background/    # Background script
├── shared/            # Reusable components and utilities
│   ├── components/    # Shared UI components
│   ├── hooks/         # Custom React hooks
│   ├── contexts/      # React contexts
│   └── utils/         # Utility functions
├── theme/             # Material-UI theming
└── types/             # TypeScript type definitions
```

## 🔐 Production Authentication

When ready for production, you'll need to:

1. **Set up Supabase project** with Google OAuth provider
2. **Configure environment variables** (`.env` file)
3. **Remove development bypass** from AuthFlow component
4. **Set up webapp** for post-authentication redirect

See `GOOGLE_AUTH_SETUP.md` for detailed authentication setup instructions.

## 🤝 Contributing

This is currently a development project. The extension is being built iteratively with a focus on:

- Clean, maintainable code
- Excellent user experience
- Robust error handling
- Comprehensive testing

## 📄 License

Private project - All rights reserved.
