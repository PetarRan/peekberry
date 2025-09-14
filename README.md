# Peekberry

> Edit any website with natural language commands. Point, speak, transform.

A Chrome extension + webapp that lets anyone edit any website using natural language. No CSS knowledge required.

`#builtWithKiro`

## Features

- **Point & Click Editing**: Select any element, say "make this blue and bigger"
- **Natural Language Commands**: "hide this button", "center this text", "make this red"
- **Real-time Changes**: See edits instantly with undo/redo
- **Screenshot Gallery**: Capture and manage your edits
- **Activity Dashboard**: Track your changes and statistics
- **Works Everywhere**: Functions on any website without breaking existing functionality

## Quick Start

### Chrome Extension
1. Clone this repo
2. Run `npm install`
3. Build the extension: `npm run build:extension:dev`
4. Load the `dist` folder in Chrome Extensions (Developer mode)

### Webapp
1. Set up environment variables (contact one of the devs)
2. Run `npm run dev`
3. Open `http://localhost:3000`

## Built with Kiro

This project showcases AI-assisted development using [Kiro](https://kiro.dev) as a development partner:

- **Specs-driven development** with structured requirements
- **Automated code generation** following consistent patterns
- **AI-maintained coding standards** across the entire codebase
- **40-hour hackathon** → production-ready full-stack application

## 📁 Project Structure

```
src/
├── webapp/          # Admin dashboard
├── components/      # Chrome extension UI
├── hooks/          # React hooks
├── utils/          # Utilities and helpers
└── theme/          # Material UI theming
```

## 🔧 Development

```bash
# Install dependencies
npm install

# Start webapp development server
npm run dev

# Build Chrome extension
npm run build:extension:dev

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

*Built in 40 hours with Kiro as our AI development partner. This is the future of software development.*