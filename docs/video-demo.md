# Peekberry Hackathon Demo Script

_3-minute presentation showcasing product and Kiro development workflow_

## Opening Hook (0:00 - 0:15)

**[Screen: Chrome browser on any website]**

"What if you could edit any website just by pointing and saying what you want? Meet Peekberry - a Chrome extension that lets you modify any webpage using natural language commands. But here's the real story: we built this entire full-stack application in just 40 hours using Kiro as our AI development partner."

## Product Introduction (0:15 - 0:45)

**[Screen: Peekberry extension in action]**

"Peekberry consists of two parts: a Chrome extension for real-time website editing, and a Next.js webapp for user management and analytics. Watch this - I can select any element on a webpage, type 'make this text blue and bigger', and see instant results. No CSS knowledge required."

**[Demo: Select element, type command, show transformation]**

"The extension captures screenshots, tracks your edits, and syncs everything to your personal dashboard. It's perfect for designers, developers, and content creators who need quick visual prototyping."

## Kiro Development Showcase (0:45 - 1:45)

**[Screen: Kiro interface with project files]**

"Here's what makes this hackathon submission unique - we didn't just build a product, we showcased the future of AI-assisted development. Let me show you how Kiro became our coding partner."

**[Screen: Show .kiro/specs/peekberry-mvp/ folder]**

"We started with Kiro specs - structured requirements that break down complex features into actionable tasks. Look at this comprehensive implementation plan: 15 major tasks covering everything from Chrome extension architecture to Supabase database design."

**[Screen: Show steering files in .kiro/steering/]**

"Kiro's steering system maintained our coding standards automatically. These files contain our tech stack preferences, architectural patterns, and coding conventions. Every time Kiro generated code, it followed these rules consistently across our entire Next.js 15, React 18, and Material UI codebase."

**[Screen: Show hooks configuration and execution]**

"But the real game-changer was Kiro hooks. Watch this - every time we save a file, this hook automatically regenerates our database types from Supabase, rebuilds our Chrome extension, and runs our test suite. The hook that just triggered when we updated package.json? That's our entire CI/CD pipeline running locally, instantly."

**[Screen: Show conversation history with code generation]**

"Kiro generated our entire Chrome extension manifest, content scripts, background workers, and React components. Complex TypeScript interfaces, Zod validation schemas, API routes - all created through natural conversation. What traditionally takes weeks of research and debugging happened in hours."

## Technical Architecture (1:45 - 2:15)

**[Screen: Show project structure and database schema]**

"The technical architecture demonstrates production-ready development: Next.js 15 with App Router, Chrome Extension Manifest V3, Supabase PostgreSQL with Row Level Security, Clerk authentication, and TanStack Query for state management. This isn't prototype code - it's deployment-ready."

**[Screen: Show supabase/migrations/001_initial_schema.sql]**

"Kiro designed our entire database schema with proper indexing, RLS policies, and atomic counter functions. Look at this migration file - comprehensive user statistics tracking, screenshot metadata, and secure storage policies. Kiro understood not just the code, but the security and performance implications."

**[Screen: Show API routes and TypeScript types]**

"The data flow spans from Chrome extension message passing to React Query mutations, all with end-to-end TypeScript safety. Kiro generated Zod schemas, API endpoints, and even the complex Chrome extension communication patterns that usually take days to debug."

## Live Product Demo (2:15 - 2:45)

**[Screen: Full product demonstration]**

"Let's see it in action. I'll visit any website, activate Peekberry, select this header, and say 'make it purple with a shadow'. Instantly applied. Now I'll capture a screenshot and check my dashboard."

**[Screen: Switch to webapp dashboard]**

"The webapp shows my editing history, screenshot gallery, and usage statistics. Everything syncs seamlessly between the extension and web app."

**[Demo: Show undo/redo, screenshot gallery]**

"I can undo changes, browse my screenshot collection, and track my editing activity - all built with Kiro's assistance."

## Closing Impact (2:45 - 3:00)

**[Screen: Split view of Kiro IDE and Peekberry running]**

"Peekberry proves that AI-assisted development isn't just about faster coding - it's about building better software. In 40 hours, we created a full-stack application with Chrome extension, authentication, database, and AI integration that would traditionally take a team weeks to build."

**[Screen: Final product demonstration]**

"But the real innovation isn't just Peekberry - it's demonstrating how developers and AI can collaborate to turn ambitious ideas into reality. Kiro didn't replace our creativity; it amplified it. The future of development is here, and it's collaborative, intelligent, and incredibly powerful."

---

## Demo Preparation Checklist

### Technical Setup

- [ ] Chrome browser with Peekberry extension installed
- [ ] Test website ready for demonstration
- [ ] Webapp dashboard logged in and populated with sample data
- [ ] Kiro interface open with project files visible
- [ ] Screen recording software configured

### Key Demonstration Points

- [ ] Element selection and highlighting
- [ ] Natural language command processing
- [ ] Real-time DOM manipulation
- [ ] Screenshot capture functionality
- [ ] Dashboard statistics and gallery
- [ ] Undo/redo functionality
- [ ] Kiro hooks automation
- [ ] Code generation examples

### Backup Scenarios

- [ ] Pre-recorded clips for complex demonstrations
- [ ] Static screenshots if live demo fails
- [ ] Alternative websites for element selection
- [ ] Sample commands that work reliably

### Timing Markers

- **0:15** - Product hook complete
- **0:45** - Basic demo finished
- **1:45** - Kiro development story complete
- **2:15** - Technical overview done
- **2:45** - Live demo finished
- **3:00** - Strong closing delivered

## Speaking Notes

### Tone and Pace

- Enthusiastic but professional
- Clear, confident delivery
- Pause for visual demonstrations
- Emphasize the Kiro collaboration angle

### Key Messages

1. **Product Innovation**: Peekberry solves real user problems with natural language website editing
2. **Development Revolution**: Kiro enabled 40-hour full-stack development that traditionally takes weeks
3. **Technical Excellence**: Production-ready code with proper architecture, security, and performance
4. **AI Collaboration**: Demonstrates the future of human-AI development partnerships
5. **Hackathon Impact**: Shows both innovative product and revolutionary development process
