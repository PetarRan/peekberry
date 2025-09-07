# Peekberry Hackathon Demo Script

_3-Minute Video Presentation_

## Opening Hook (0:00 - 0:20)

**[Screen: Show a complex website like Amazon or GitHub]**

"What if you could edit any website just by pointing and saying 'make this button blue' or 'hide this sidebar'? Meet Peekberry - a Chrome extension that lets you modify any website using natural language commands."

**[Transition to Peekberry logo/title slide]**

"I'm going to show you how we built this entire product in record time using Kiro AI, and demonstrate the magic of natural language web editing."

## Product Demo - Core Features (0:20 - 1:30)

### Element Selection & Natural Language Editing (0:20 - 0:50)

**[Screen: Navigate to a demo website, show extension bubble]**

"Here's how it works. First, I click our floating bubble to activate Peekberry."

**[Click bubble, show chat panel opening]**

"Now I can hover over any element - see how it highlights? I'll click this header."

**[Hover and click an element, show it gets selected]**

"Now I just type what I want: 'Make this text purple and increase the font size'"

**[Type command, show AI processing, then DOM changes happening in real-time]**

"Watch the magic - Peekberry's AI understands my request and applies the changes instantly. No CSS knowledge required."

### Undo/Redo & Session Management (0:50 - 1:10)

**[Demonstrate undo functionality]**

"Made a mistake? No problem. I can undo any change with a simple command or button click."

**[Show undo action, then redo]**

"And redo it just as easily. All changes are tracked for the current session."

### Screenshot Capture (1:10 - 1:30)

**[Show screenshot capture feature]**

"Love what you've created? Capture a screenshot that automatically saves to your dashboard with metadata about your edits."

**[Click screenshot button, show capture happening]**

"This gets uploaded to our webapp where you can manage all your creations."

## Technical Architecture & Kiro Development Story (1:30 - 2:30)

### How Kiro Accelerated Development (1:30 - 2:00)

**[Screen: Show Kiro interface with project structure]**

"Here's where it gets interesting for developers. We built this entire system using Kiro AI as our development partner."

**[Show .kiro/specs folder and tasks.md]**

"Kiro helped us break down complex requirements into actionable tasks. Look at this implementation plan - 15 major tasks, each with clear requirements mapping."

**[Show steering files]**

"We used Kiro's steering system to maintain consistent architecture patterns across our Next.js webapp and Chrome extension."

### Automated Development Workflow (2:00 - 2:30)

**[Show Kiro hooks in action]**

"But here's the real game-changer - Kiro hooks. Every time we save a file, Kiro automatically runs our tests and updates related components."

**[Demonstrate a file save triggering automated actions]**

"When I modify the Chrome extension manifest, Kiro automatically rebuilds the extension and updates our TypeScript types. This automation saved us hours of manual work."

**[Show code generation examples]**

"Kiro generated our entire Chrome extension architecture, React components, and API endpoints. What would take days of boilerplate coding happened in minutes."

## Technical Stack Showcase (2:30 - 2:50)

**[Screen: Show architecture diagram or code structure]**

"The technical foundation is solid: Next.js 15 with React 18 for our webapp, Material UI for components, Chrome Extension Manifest V3 for browser integration, Supabase for data storage, and Clerk for authentication."

**[Show webapp dashboard]**

"Users get a beautiful dashboard to track their editing statistics and manage screenshots, all built with modern React patterns and TanStack Query for optimal performance."

## Closing & Impact (2:50 - 3:00)

**[Screen: Show multiple before/after website edits]**

"Peekberry democratizes web design - no coding required. And Kiro made building it feel like having a senior developer pair programming with us 24/7."

**[End screen with Peekberry logo and tagline]**

"Peekberry: Edit any website, naturally. Built with Kiro: Develop any idea, rapidly."

---

## Key Demo Tips

### Technical Demonstrations

- Have multiple websites ready for live editing demos
- Prepare fallback recordings in case of live demo issues
- Show both simple edits (color changes) and complex ones (layout modifications)
- Demonstrate error handling when AI can't process a command

### Kiro Development Story

- Screen record actual Kiro interactions during development
- Show real steering files and how they guided development
- Demonstrate a live hook execution if possible
- Highlight specific code generation examples

### Timing Markers

- **0:20**: Start product demo
- **1:30**: Transition to development story
- **2:30**: Technical stack overview
- **2:50**: Strong closing

### Engagement Elements

- Use dynamic transitions between screens
- Show real websites (not just localhost)
- Include brief moments of humor or surprise
- End with a clear call-to-action or memorable tagline

### Backup Plans

- Have screenshots ready if live demo fails
- Prepare multiple example websites
- Record Kiro interactions beforehand as backup footage
- Test all demo scenarios multiple times before recording
