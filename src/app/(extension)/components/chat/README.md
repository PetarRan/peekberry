# Chat Components

This directory contains all chat-related React components for the Peekberry extension.

## Components

- **ChatPanel** - Main chat interface component
- **ChatHeader** - Header with title and action buttons
- **SelectedElementsList** - Displays and manages selected elements
- **ChatInput** - Input field for sending messages
- **ChatMessage** - Individual chat message display

## Usage

```tsx
import { ChatPanel, SelectedElement } from './chat';

const selectedElements: SelectedElement[] = [
  {
    id: '1',
    displayName: 'div#header',
    element: document.getElementById('header')
  }
];

<ChatPanel
  selectedElements={selectedElements}
  onElementRemove={(index) => console.log('Remove:', index)}
  onSendMessage={(message) => console.log('Send:', message)}
  onClose={() => console.log('Close')}
  isVisible={true}
/>
```

## Integration

To integrate with the existing UIManager:

1. Create a React root element
2. Render the ChatPanel component
3. Pass the necessary props from UIManager state
4. Handle callbacks to update UIManager state

This approach provides:
- Clean separation of concerns
- Reusable components
- Better maintainability
- Easier testing
