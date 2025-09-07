#!/bin/bash

# Development script for Peekberry
echo "🫐 Starting Peekberry development environment..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "🫐  .env.local not found. Copying from .env.local.example..."
    cp .env.local.example .env.local
    echo "🫐 Please configure your environment variables in .env.local"
fi

# Build extension in watch mode (background process)
echo "🫐 Building Chrome extension..."
npm run build:extension:dev

echo "🫐 Starting Next.js development server..."
echo "🫐 Webapp will be available at http://localhost:3000"
echo "🫐 Load the extension from ./extension/dist in Chrome"

# Start Next.js dev server
npm run dev