# Implementation Plan

- [x] 1. Set up project foundation and configuration
  - Create Next.js 15 project with TypeScript and required dependencies
  - Configure Material UI, Emotion, TanStack Query, Zustand, and React Hook Form
  - Set up project structure with src/api, src/app, src/components, src/hooks, src/schema, src/theme, src/types directories
  - Configure Clerk authentication and Supabase integration
  - _Requirements: 1.1, 1.2_

- [x] 2. Create core data schemas and types
  - Define Zod schemas for Screenshot, ScreenshotMetadata, UserStats, and EditAction types
  - Create TypeScript interfaces for all Chrome extension components
  - Define API response types and error handling schemas
  - _Requirements: 7.1, 7.2_

- [x] 3. Set up Supabase database and storage
  - Create screenshots table with clerk_user_id references
  - Create user_stats table for activity tracking
  - Set up database indexes for performance
  - Configure Supabase storage bucket for screenshot files
  - _Requirements: 7.1, 7.6_

- [x] 4. Implement authentication system
- [x] 4.1 Set up Clerk authentication in Next.js webapp
  - Configure Clerk middleware and authentication providers
  - Create sign-in and sign-up pages with email/password and OAuth options
  - Implement protected route middleware
  - _Requirements: 1.1, 1.5_

- [x] 4.2 Create authentication API endpoints
  - Build API route for generating auth tokens for extension
  - Implement token validation and user session management
  - Create user profile and account settings endpoints
  - _Requirements: 1.2, 1.4_

- [ ] 5. Build webapp dashboard and UI components
- [ ] 5.1 Create dashboard layout and navigation
  - Build main dashboard layout with MUI components following webapp-ui.md design guidelines
  - Implement responsive navigation and user menu
  - Create account settings page with logout functionality
  - _Requirements: 6.5_

- [ ] 5.2 Implement user statistics display
  - Create stats cards component for displaying edit and screenshot counts
  - Build API endpoints to fetch and update user statistics
  - Implement real-time counter updates using React Query
  - _Requirements: 6.1, 6.2, 6.6_

- [ ] 5.3 Build screenshot gallery and management
  - Create screenshot grid component with thumbnails and metadata
  - Implement screenshot viewing, downloading, and deletion functionality
  - Build pagination and filtering for screenshot list
  - _Requirements: 6.3, 6.4_

- [ ] 6. Create AI processing API
  - Build API endpoint to receive edit commands and element context
  - Implement AI service integration to process natural language commands
  - Create response formatting to return DOM mutation instructions
  - Add error handling for AI processing failures
  - _Requirements: 3.1, 3.2, 3.6_

- [ ] 7. Implement screenshot upload and storage
  - Create API endpoint for screenshot upload with metadata
  - Implement Supabase storage integration for image files
  - Build thumbnail generation and image optimization
  - Update user statistics when screenshots are uploaded
  - _Requirements: 5.2, 5.3, 5.5, 7.1_

- [ ] 8. Build Chrome extension foundation
- [ ] 8.1 Create extension manifest and basic structure
  - Set up manifest.json with required permissions and content scripts
  - Create basic file structure for content script, background script, and styles
  - Implement extension installation and initialization
  - _Requirements: 2.1, 8.1_

- [ ] 8.2 Implement authentication sync for extension
  - Create background script functionality to store and retrieve auth tokens
  - Build communication between webapp and extension for token sync
  - Implement authentication status checking and error handling
  - _Requirements: 1.3, 1.4, 1.6_

- [ ] 9. Build DOM interaction and element selection
- [ ] 9.1 Create element highlighting and selection system
  - Implement hover highlighting with visual outlines for page elements
  - Build click-to-select functionality that captures element context
  - Create element context extraction (selector, styles, position, content)
  - _Requirements: 2.4, 2.5, 2.6_

- [ ] 9.2 Build persistent bubble UI
  - Create floating bubble component positioned in bottom-right corner following extension-ui.md design guidelines
  - Implement bubble click handler to open/close chat panel
  - Style bubble to be non-intrusive and work across different websites
  - _Requirements: 2.1, 2.2_

- [ ] 10. Implement chat panel and user interface
  - Create expandable chat panel with dark theme following extension-ui.md design guidelines
  - Build chat history display for session-only edit tracking with slide-in modal interface
  - Implement element selection display as interactive tags/chips in chat context
  - Add screenshot capture button and export functionality with proper icon styling
  - _Requirements: 2.2, 2.3, 5.1_

- [ ] 11. Build edit processing and DOM manipulation
- [ ] 11.1 Create command processing pipeline
  - Implement background script communication with webapp API
  - Build command sending with element context to AI processing endpoint
  - Handle API responses and error states gracefully
  - _Requirements: 3.1, 3.2, 8.2_

- [ ] 11.2 Implement DOM mutation application
  - Create safe DOM manipulation functions for style, attribute, and content changes
  - Build mutation application system that preserves original page functionality
  - Implement scoped changes that only affect selected elements
  - _Requirements: 3.3, 3.4, 8.2_

- [ ] 12. Build undo/redo functionality
  - Create edit history stack management for session changes
  - Implement undo functionality that reverts DOM mutations
  - Build redo system that reapplies previously undone changes
  - Clear edit history on page navigation or session end
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 13. Implement screenshot capture system
  - Build screenshot capture functionality using browser APIs
  - Create image processing and compression for optimal file sizes
  - Implement upload to webapp with metadata (page URL, title, edit count)
  - Update activity counters when screenshots are captured
  - _Requirements: 5.1, 5.2, 5.4, 5.5_

- [ ] 14. Add error handling and user feedback
  - Implement graceful error handling that doesn't break host websites
  - Create user notification system for errors and success messages
  - Build retry logic for network failures and API errors
  - Add authentication error handling with re-auth prompts
  - _Requirements: 3.6, 8.3, 8.4, 8.6_

- [ ] 15. Final integration and polish
  - Connect all extension components with webapp API endpoints
  - Implement proper data flow between content script, background script, and webapp
  - Add loading states and user feedback throughout the application
  - Ensure cross-browser compatibility and performance optimization
  - _Requirements: 8.1, 8.4, 8.5_
