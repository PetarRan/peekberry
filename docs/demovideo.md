# Peekberry Chrome Extension - Demo Video Script

**Duration**: ~3 minutes  
**Audience**: Non-technical stakeholders, PMs, sales teams, demo teams, customer success, presales professionals

## Opening Hook (0:00-0:15)

**Narrator**: "Ever wished you could quickly test UI changes on a live website without waiting for developers? Meet Peekberry - the Chrome extension that lets non-technical teams make instant UI modifications using simple English commands."

**Screen**: Show a typical staging website with various UI elements

## Problem Setup (0:15-0:30)

**Narrator**: "As a PM or sales professional, you often need to experiment with UI changes for demos or feedback sessions. Traditionally, this means creating tickets, waiting for developer cycles, and deploying code changes."

**Screen**: Show typical workflow - Jira tickets, developer handoffs, deployment pipelines

## Solution Introduction (0:30-0:45)

**Narrator**: "Peekberry changes that. With natural language commands, you can modify any website element instantly - no code, no deployments, just immediate results."

**Screen**: Show Chrome extension icon in browser toolbar

## Core Demo Flow (0:45-2:30)

### Step 1: Authentication & Seamless Activation (0:45-1:00)

**Narrator**: "First, authenticate through the Peekberry extension popup. After successful authentication, the popup automatically closes and immediately activates the extension - no manual steps required. This creates a smooth, professional experience that gets you working faster."

**Screen Actions**:

- Click Peekberry extension icon to show popup authentication
- Demonstrate Google OAuth flow (opens in controlled popup window, automatically monitors completion and handles timeouts)
- Show beautiful OAuth success page with gradient background and glassmorphism design
- Highlight the automatic popup closure after authentication completes
- Navigate to a demo webpage
- Show floating circular widget with Peekberry logo appearing automatically on page
- Demonstrate hover effects with smooth scaling and shadow transitions

### Step 2: Widget Interaction (1:00-1:15)

**Narrator**: "The floating widget is beautifully integrated with Material-UI theming. Click it to expand the interface - element selection and highlighting features are coming next."

**Screen Actions**:

- Show tooltip appearing on hover: "Peekberry - Click to expand"
- Click floating widget to demonstrate toggle functionality
- Highlight the smooth animations and professional Material-UI styling
- Show widget positioning that stays above all page content

### Step 3: Coming Soon - Chat Interface (1:15-1:45)

**Narrator**: "The foundation is set for the expandable chat interface. Soon, you'll click the widget to reveal natural language input where you can describe UI changes in plain English."

**Screen Actions**:

- Show current toggle functionality as foundation for expansion
- Preview mockup of planned chat interface expansion
- Demonstrate how the current widget positioning will accommodate the chat overlay

**Planned commands**:

- "make this button bigger and blue"
- "center this text"
- "make this card taller"
- "use a bolder font here"

### Step 4: Current Progress & Vision (1:45-2:00)

**Narrator**: "The floating widget foundation is complete with professional Material-UI theming. Next comes element selection, then instant UI modifications that are completely ephemeral - perfect for demos and experimentation."

**Screen Actions**:

- Show widget persistence across different pages
- Demonstrate consistent theming and positioning
- Preview how element highlighting will integrate with the current widget
- Show page refresh maintaining widget state through extension lifecycle

### Step 5: Development Foundation (2:00-2:30)

**Narrator**: "The current implementation showcases solid engineering practices - proper TypeScript interfaces, Material-UI integration, and Chrome extension architecture. Export tools for screenshots and CSS will build on this foundation."

**Screen Actions**:

- Show clean code structure in FloatingWidget component
- Demonstrate proper theme integration and responsive design
- Highlight extension manifest configuration and asset loading
- Preview how export functionality will integrate with the current widget system

## Development Workflow with Kiro (2:30-2:50)

**Narrator**: "Built using Kiro AI assistant, Peekberry showcases how AI-powered development accelerates complex Chrome extension projects. From React 18.2 components to Supabase 2.38 authentication, Kiro helps implement the full technology stack efficiently."

**Screen Actions**:

- Quick montage of project structure and package.json
- Show key technologies: React + TypeScript 5.0, Material-UI 5.14, Vite 4.4, Supabase
- Highlight Chrome Extension Manifest V3 architecture
- Brief glimpse of npm scripts: `npm run dev`, `npm run build`, `npm run lint`

## Closing (2:50-3:00)

**Narrator**: "Peekberry bridges the gap between ideas and implementation. Empower your non-technical teams to experiment, iterate, and collaborate faster than ever."

**Screen**: Show final website with multiple modifications applied, then fade to Peekberry logo

**Call to Action**: "Try Peekberry today - where natural language meets instant UI changes."

---

## Technical Demo Notes

### Prerequisites for Demo

- Chrome browser with Developer Mode enabled
- Node.js environment with npm installed
- Sample staging website with various UI elements for testing widget positioning
- Peekberry extension built (`npm run build`) and loaded from project root folder
- Environment variables properly configured in `.env` file with valid Supabase credentials (both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are required, accessed via Vite's `import.meta.env` for security)
- Extension authenticated via Supabase with tab-based OAuth flow (automatic session persistence enabled)
- Peekberry logo asset (`public/peekberry-logo.avif`) properly loaded through Chrome extension web accessible resources

### Key Demo Elements to Highlight

- **Streamlined UX**: Popup automatically closes after authentication, creating a seamless transition from login to active extension state
- **Professional Flow**: No manual popup closure required - authentication flows directly into extension activation
- **Professional UI**: Material-UI theming with smooth animations and hover effects throughout floating widget
- **Seamless Integration**: Floating widget that doesn't interfere with page content
- **Solid Foundation**: TypeScript interfaces and proper Chrome extension architecture
- **Visual Polish**: Custom shadows, scaling transitions, and branded logo integration in both popup and floating widget
- **Extensible Design**: Widget structure ready for chat interface and element selection expansion
- **Cross-Page Persistence**: Widget maintains state and positioning across navigation

### Backup Demo Scenarios

- If AI processing fails: Show graceful error handling
- If element selection issues: Demonstrate alternative selection methods
- If website compatibility issues: Show clear error messaging

### Post-Demo Q&A Preparation

- Authentication: Supabase integration with popup-based OAuth flow with intelligent monitoring and timeout handling, custom success page with glassmorphism design, persistent sessions and automatic token refresh
- Compatibility: Works on most standard web applications
- Limitations: CSP restrictions, complex dynamic content
- Export formats: Screenshots (PNG), CSS overrides (text)
- Team usage: Multi-user authentication, session management
- Configuration: Environment-based Supabase setup for different deployment environments (credentials now securely managed via `.env` file instead of hardcoded values)
- Security: Enhanced OAuth security with PKCE flow, Supabase credentials are no longer exposed in source code, improving security posture for production deployments
