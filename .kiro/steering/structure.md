# Project Structure

## Root Directory Organization

```
peekberry/
├── src/                    # Next.js webapp source code
├── extension/              # Chrome extension source code
├── .kiro/                  # Kiro configuration and specs
├── public/                 # Static assets for webapp
├── supabase/              # Database migrations and config
└── docs/                  # Project documentation
```

## Next.js Webapp Structure (`src/`)

```
src/
├── api/                   # Centralized API functions by domain
├── app/                   # Next.js App Router pages
│   ├── (webapp)/         # Main application routes
│   └── (extension)/      # Browser extension routes
├── components/           # Reusable UI components
│   ├── forms/           # Form components with validation
│   ├── dialogs/         # Modal patterns
│   ├── layout/          # Navigation, sidebar, app bar
│   └── shared/          # Common utilities
├── hooks/               # Custom React hooks for business logic
├── providers/           # React context providers
├── schema/              # Zod validation schemas by domain
├── theme/               # MUI theme configuration
│   ├── colors.ts        # Color palette definitions
│   ├── components/      # Component theme overrides (1 file - 1 component)
│   ├── theme.ts         # Main theme configuration
│   └── themeTypes.ts    # Custom theme type definitions
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
│   ├── api/
│   │   └── db.ts        # Database connection and query utilities
│   └── supabase/        # Supabase client configuration
│       ├── client.ts    # Browser client
│       ├── server.ts    # Server-side client
│       ├── middleware.ts # Supabase middleware
│       └── imageUpload.ts # Image upload utilities
└── middleware.ts        # Next.js middleware for auth/routing
```

## Chrome Extension Structure (`extension/`)

```
extension/
├── manifest.json        # Extension manifest (Manifest V3)
├── background.ts        # Service worker for API communication
├── content/            # Content script files
│   ├── content.ts      # Main content script
│   ├── content.css     # Injected styles
│   └── ui/             # UI components for injection
├── popup/              # Extension popup (if needed)
├── assets/             # Extension icons and static files
└── types/              # Extension-specific TypeScript types
```

## Key Architectural Patterns

### Component Organization

- **UI Components**: Atomic, reusable components in `src/components/ui/`
- **Feature Components**: Domain-specific components grouped by feature
- **Page Components**: Route-level components in `src/app/`

### API Structure

- **Route Handlers**: RESTful API endpoints in `src/app/api/`
- **Authentication**: Protected routes using Clerk middleware
- **Database**: Supabase integration with typed queries

### Extension Architecture

- **Content Scripts**: Injected into web pages for DOM manipulation
- **Background Script**: Handles API communication and storage
- **Manifest V3**: Service worker pattern for background processing

### Data Flow Patterns

- **Webapp**: React Query for server state, Zustand for client state
- **Extension**: Chrome storage API for persistence, message passing for communication
- **Cross-Component**: Zod schemas for data validation at boundaries

## File Naming Conventions

- **Components**: PascalCase (e.g., `ScreenshotGallery.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useScreenshots.ts`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Types**: PascalCase interfaces (e.g., `Screenshot`, `UserStats`)
- **API Routes**: kebab-case directories (e.g., `api/screenshots/upload/`)

## Import Organization

- External libraries first
- Internal utilities and types
- Components last
- Use absolute imports with `@/` prefix for src directory
