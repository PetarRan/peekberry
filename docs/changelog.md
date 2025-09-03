# Changelog

All notable changes to the Peekberry Chrome Extension project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

### Planned

- Chrome extension foundation with Vite + TypeScript + React + Material-UI
- Supabase authentication system (login/signup in popup)
- Floating widget injection into web pages
- Element highlighting and selection system
- Natural language chat interface for UI modifications
- AI integration for command processing
- Real-time DOM manipulation with ephemeral changes
- Screenshot capture and CSS export functionality

## Project Scope

Peekberry empowers non-technical stakeholders (PMs, sales, demo teams, customer success, presales) to make ephemeral UI modifications to live web applications using natural language commands. The extension accelerates feedback cycles and improves cross-team collaboration on staging and demo environments.

### Core Features in Development

- Natural language UI modification commands
- Real-time visual feedback with element highlighting
- Ephemeral changes (no permanent code modifications)
- Screenshot capture and CSS export for developer handoff
- Authentication-gated access via Supabase
- Universal compatibility with standard HTML/React web applications
