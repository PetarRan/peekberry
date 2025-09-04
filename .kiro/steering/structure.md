# Project Structure

## Root Level Organization

```
📦 peekberry-extension/
├── package.json              # Dependencies and scripts
├── vite.config.ts           # Vite build configuration
├── tsconfig.json            # TypeScript configuration
├── manifest.json            # Chrome extension manifest
└── README.md                # Project documentation
```

## Source Code Structure

```
📂 src/
├── 🔧 config/               # Configuration files
│   ├── supabase.ts         # Supabase client setup
│   └── ai-client.ts        # AI API client configuration
│
├── 📱 extension/            # Chrome extension specific code
│   ├── popup/              # Extension popup (auth interface)
│   │   ├── Popup.tsx
│   │   └── AuthFlow.tsx
│   ├── content/            # Content scripts (injected into pages)
│   │   ├── ContentScript.tsx
│   │   ├── FloatingWidget.tsx
│   │   ├── ElementHighlighter.tsx
│   │   ├── ChatInterface.tsx
│   │   └── ExportTools.tsx
│   └── background/         # Background script
│       └── BackgroundScript.ts
│
├── 🎨 shared/              # Reusable components and utilities
│   ├── components/         # Shared UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── LoadingSpinner.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useElementSelection.ts
│   │   └── useAICommands.ts
│   ├── contexts/           # React contexts
│   │   ├── AuthContext.tsx
│   │   └── ExtensionContext.tsx
│   └── utils/              # Utility functions
│       ├── dom-utils.ts
│       ├── css-utils.ts
│       └── export-utils.ts
│
├── 🎨 theme/               # Material-UI theming
│   ├── theme.ts           # Main theme configuration
│   ├── colors.ts          # Color palette
│   └── components.ts      # Component style overrides
│
└── 📝 types/              # TypeScript type definitions
    ├── extension.ts       # Extension-specific types
    ├── dom.ts            # DOM manipulation types
    ├── ai.ts             # AI API types
    └── user.ts           # User/auth types
```

## Public Assets

```
📂 public/
├── icons/                  # Extension icons (multiple sizes)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── peekberry-logo.png     # Main logo for floating widget
```

## Key Architectural Patterns

- **Extension Components**: Separate folders for popup, content, and background scripts
- **Shared Resources**: Common components, hooks, and utilities in shared folder
- **Type Safety**: Dedicated types folder for all TypeScript definitions
- **Theme System**: Centralized Material-UI theming configuration
- **Configuration**: Separate config files for external service integrations

## File Naming Conventions

- **Components**: PascalCase (e.g., `FloatingWidget.tsx`)
- **Utilities**: kebab-case (e.g., `dom-utils.ts`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`)
- **Types**: kebab-case (e.g., `extension.ts`)
- **Config**: kebab-case (e.g., `ai-client.ts`)
