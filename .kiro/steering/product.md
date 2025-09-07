# Product Overview

Peekberry is a Chrome extension and web application that enables users to edit any website's appearance using natural language commands. The MVP consists of two main components:

## Core Product

- **Chrome Extension**: Provides in-browser editing capabilities with element selection, AI-powered natural language processing, and real-time DOM manipulation
- **Next.js Webapp**: Handles user authentication, dashboard analytics, and screenshot management

## Key Features

- Point-and-click element selection on any webpage
- Natural language editing commands (e.g., "make this text blue", "hide this button")
- Session-based undo/redo functionality
- Screenshot capture and storage
- User dashboard with editing statistics and screenshot gallery

## Target Use Cases

- Quick visual prototyping and mockups
- Website accessibility testing
- Content creators demonstrating design changes
- Developers experimenting with UI modifications

## Architecture Philosophy

The system uses a microservices approach where the Chrome extension handles UI interaction and DOM manipulation, while the webapp manages user accounts, data persistence, and provides analytics. An AI service processes natural language commands and returns DOM/CSS mutations.
