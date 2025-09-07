# Technology Stack

## Frontend Framework

- **Next.js 15** with TypeScript for the webapp
- **React 18** with modern hooks and patterns
- **Material UI (MUI)** for component library and theming
- **Emotion** for CSS-in-JS styling

## State Management & Data Fetching

- **TanStack Query (React Query)** for server state management and caching
- **Zustand** for client-side state management
- **React Hook Form** for form handling and validation

## Authentication & Database

- **Clerk** for user authentication and session management and pricing
- **Supabase** for PostgreSQL database and file storage
- **Zod** for schema validation and type safety

## Chrome Extension

- **Manifest V3** for Chrome extension architecture
- **TypeScript** for type safety across content scripts and background workers
- **Vanilla JavaScript** for DOM manipulation to avoid conflicts with host websites

## Development Tools

- **TypeScript** for type safety across the entire stack
- **ESLint** and **Prettier** for code formatting and linting

## Common Commands

### Development

```bash
# Start Next.js development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix
```

### Chrome Extension Development

```bash
# Build extension for development
npm run build:extension:dev

# Build extension for production
npm run build:extension:prod

# Watch mode for extension development
npm run watch:extension
```

### Database Operations

```bash
# Run Supabase migrations
npx supabase db push

# Generate TypeScript types from database
npx supabase gen types typescript --local > src/types/database.ts
```

## Project Structure Conventions

- Use TypeScript for all new code
- Implement proper error boundaries and error handling
- Follow React Query patterns for data fetching
- Use Zod schemas for all data validation
- Maintain separation between extension and webapp code
