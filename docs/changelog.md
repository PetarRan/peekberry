# Changelog

All notable changes to the Peekberry Chrome Extension project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Streamlined Authentication Flow**: Popup now automatically closes after successful authentication, providing a seamless user experience by immediately activating the extension without requiring manual popup closure
- **Development Authentication Bypass**: Added "Skip for Development" button in AuthFlow for rapid development testing without requiring Supabase setup
- **Development User Session**: Creates fake user session (`dev@peekberry.com`) stored in localStorage for immediate extension functionality access
- **Enhanced Development Context**: Added `setDevUser` method to AuthContext for improved development user management and testing workflows
- **OAuth Success Page**: Added dedicated `auth-success.html` page with polished UI for post-authentication feedback
- **Authentication UX Enhancement**: Beautiful success page with gradient background, glassmorphism design, and auto-close functionality
- **User Feedback**: Clear visual confirmation with success icon, branded messaging, and manual/automatic window closure options

### Changed

- **Popup Behavior**: Enhanced post-authentication experience - popup automatically closes after sending activation messages to content scripts, creating a smooth transition from authentication to active extension state
- **User Experience**: Streamlined authentication flow - after successful login, popup immediately closes and floating widget becomes available on web pages without manual intervention
- **OAuth Flow Enhancement**: Improved Google OAuth authentication by switching from tab-based to popup window approach for better user experience and session management
- **Authentication UX**: Enhanced OAuth process - extension now opens OAuth URL in a controlled popup window (500x600px) with automatic monitoring and timeout handling
- **Session Management**: Added intelligent popup monitoring with automatic cleanup and timeout protection (5-minute limit) for more reliable authentication flow
- **Post-Auth Experience**: OAuth success redirects to custom success page instead of generic Supabase confirmation
- **FloatingWidget Component**: Implemented Material-UI based floating action button (FAB) that appears in bottom-right corner of web pages
- **Widget Positioning**: Fixed positioning with high z-index (999999) to ensure visibility above page content
- **Interactive Branding**: Peekberry logo integration with hover effects and smooth transitions
- **Theme Integration**: Full Material-UI ThemeProvider integration for consistent styling
- **Tooltip Support**: Contextual tooltip with "Peekberry - Click to expand" guidance
- **Expandable Interface**: Toggle functionality for future chat interface expansion
- **Visual Polish**: Custom shadow effects and scale animations on hover for enhanced user experience

### Security

- **OAuth Security**: Maintains PKCE (Proof Key for Code Exchange) flow through Supabase's built-in OAuth handling for secure authentication
- **BREAKING**: Removed hardcoded Supabase credentials from source code for improved security
- Supabase configuration now uses environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`)
- Added validation to ensure required environment variables are present at runtime

### Fixed

- Fixed Supabase configuration to use Vite's `import.meta.env` syntax instead of Node.js `process.env` for environment variables
- Resolved build compatibility issues with Vite bundler for Chrome extension environment

### Changed

- Updated Chrome extension manifest file paths to reference source files directly instead of dist folder
- Simplified build configuration for extension assets (icons, popup HTML)
- Supabase configuration now requires `VITE_SUPABASE_URL` environment variable (removed fallback URL for better security)

### Technical Implementation

- Error handling for missing Supabase environment variables with clear error messages
- Chrome extension web accessible resources configuration for logo asset loading
- Development-only authentication bypass with localStorage-based fake user session management
- AuthContext integration with development user detection and automatic session restoration
- Enhanced AuthContext with `setDevUser` method for streamlined development testing and user state management

### Added

- Initial project setup and documentation
- Comprehensive README.md with project overview, features, and development setup
- Technology stack definition: React + TypeScript, Vite, Material-UI, Supabase auth
- Chrome Extension Manifest V3 architecture planning
- Project structure documentation for extension components (popup, content, background)
- Complete package.json with production and development dependencies
- Development workflow with npm scripts for dev, build, preview, type-check, and lint
- Extension testing instructions for Chrome Developer Mode
- Core dependencies: React 18.2, Material-UI 5.14, Supabase 2.38, TypeScript 5.0
- Development tooling: Vite 4.4, ESLint 8.45, Chrome types 0.0.246
- Supabase client configuration with authentication settings (session persistence, auto-refresh tokens)

### In Progress

- Element highlighting and selection system (building on FloatingWidget foundation)
- Natural language chat interface for UI modifications (expandable from FloatingWidget)
- AI integration for command processing
- Real-time DOM manipulation with ephemeral changes
- Screenshot capture and CSS export functionality

### Completed

- ✅ Chrome extension foundation with Vite + TypeScript + React + Material-UI
- ✅ Supabase authentication system with simplified tab-based OAuth flow
- ✅ Floating widget injection into web pages with Material-UI theming

## Project Scope

Peekberry empowers non-technical stakeholders (PMs, sales, demo teams, customer success, presales) to make ephemeral UI modifications to live web applications using natural language commands. The extension accelerates feedback cycles and improves cross-team collaboration on staging and demo environments.

### Core Features in Development

- Natural language UI modification commands
- Real-time visual feedback with element highlighting
- Ephemeral changes (no permanent code modifications)
- Screenshot capture and CSS export for developer handoff
- Authentication-gated access via Supabase
- Universal compatibility with standard HTML/React web applications
