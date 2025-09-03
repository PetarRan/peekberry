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

### Step 1: Activation (0:45-1:00)

**Narrator**: "First, click the Peekberry extension icon to activate it on any webpage."

**Screen Actions**:

- Click Peekberry extension icon
- Show floating circular widget appearing on page
- Demonstrate element highlighting on hover

### Step 2: Element Selection (1:00-1:15)

**Narrator**: "Hover over any element to highlight it, then click to select. Peekberry captures the context automatically."

**Screen Actions**:

- Hover over a button (show highlight border)
- Click to select (show selection indicator)
- Hover over text, images, cards to show versatility

### Step 3: Natural Language Commands (1:15-1:45)

**Narrator**: "Click the floating widget to open the chat interface. Now describe your changes in plain English."

**Screen Actions**:

- Click floating widget to expand chat interface
- Type: "make this button bigger and blue"
- Show AI processing indicator
- Display real-time change application

**Follow-up commands**:

- "center this text"
- "make this card taller"
- "use a bolder font here"

### Step 4: Instant Results (1:45-2:00)

**Narrator**: "Changes apply immediately. Everything is ephemeral - no permanent code modifications, perfect for demos and experimentation."

**Screen Actions**:

- Show multiple modifications being applied
- Demonstrate page refresh reverting changes
- Re-activate to show clean slate

### Step 5: Export & Share (2:00-2:30)

**Narrator**: "When you're happy with the changes, capture screenshots or export the CSS for your development team to implement."

**Screen Actions**:

- Use export tools to capture screenshot
- Show CSS override generation
- Demonstrate copy-to-clipboard functionality

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
- Sample staging website with various UI elements
- Peekberry extension built (`npm run build`) and loaded
- Extension authenticated via Supabase

### Key Demo Elements to Highlight

- **Ease of Use**: No technical knowledge required
- **Speed**: Instant modifications vs traditional development cycles
- **Safety**: Ephemeral changes, no permanent code impact
- **Collaboration**: Export tools for developer handoff
- **Versatility**: Works on standard HTML/React applications

### Backup Demo Scenarios

- If AI processing fails: Show graceful error handling
- If element selection issues: Demonstrate alternative selection methods
- If website compatibility issues: Show clear error messaging

### Post-Demo Q&A Preparation

- Authentication: Supabase integration for secure access
- Compatibility: Works on most standard web applications
- Limitations: CSP restrictions, complex dynamic content
- Export formats: Screenshots (PNG), CSS overrides (text)
- Team usage: Multi-user authentication, session management
