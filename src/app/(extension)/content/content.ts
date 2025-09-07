// Content script for Peekberry Chrome extension
// Handles DOM interaction and UI injection

console.log('Peekberry content script loaded');

// Initialize the extension when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePeekberry);
} else {
  initializePeekberry();
}

function initializePeekberry() {
  console.log('Initializing Peekberry on:', window.location.href);

  // Create the persistent bubble UI
  createPeekberryBubble();

  // Initialize element selection system
  initializeElementSelection();
}

function createPeekberryBubble() {
  // Check if bubble already exists
  if (document.getElementById('peekberry-bubble')) {
    return;
  }

  const bubble = document.createElement('div');
  bubble.id = 'peekberry-bubble';
  bubble.innerHTML = '🔍';
  bubble.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 60px;
    height: 60px;
    background: #0ea5e9;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    font-size: 24px;
    transition: transform 0.2s ease;
  `;

  bubble.addEventListener('mouseenter', () => {
    bubble.style.transform = 'scale(1.1)';
  });

  bubble.addEventListener('mouseleave', () => {
    bubble.style.transform = 'scale(1)';
  });

  bubble.addEventListener('click', toggleChatPanel);

  document.body.appendChild(bubble);
}

function toggleChatPanel() {
  const existingPanel = document.getElementById('peekberry-chat-panel');

  if (existingPanel) {
    existingPanel.remove();
  } else {
    createChatPanel();
  }
}

function createChatPanel() {
  const panel = document.createElement('div');
  panel.id = 'peekberry-chat-panel';
  panel.style.cssText = `
    position: fixed;
    bottom: 100px;
    right: 20px;
    width: 350px;
    height: 400px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    z-index: 10001;
    display: flex;
    flex-direction: column;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  panel.innerHTML = `
    <div style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
      <h3 style="margin: 0; font-size: 16px; font-weight: 600;">Peekberry</h3>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">Select an element to edit</p>
    </div>
    <div style="flex: 1; padding: 16px; overflow-y: auto;">
      <div id="peekberry-messages" style="min-height: 200px;">
        <p style="color: #6b7280; font-size: 14px;">Click on any element on the page to select it, then describe how you'd like to change it.</p>
      </div>
    </div>
    <div style="padding: 16px; border-top: 1px solid #e5e7eb;">
      <input 
        type="text" 
        id="peekberry-input" 
        placeholder="Describe your edit..."
        style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;"
      />
      <div style="display: flex; gap: 8px; margin-top: 8px;">
        <button id="peekberry-screenshot" style="flex: 1; padding: 6px 12px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 6px; font-size: 12px; cursor: pointer;">📸 Screenshot</button>
        <button id="peekberry-undo" style="flex: 1; padding: 6px 12px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 6px; font-size: 12px; cursor: pointer;">↶ Undo</button>
      </div>
    </div>
  `;

  document.body.appendChild(panel);

  // Add event listeners
  const input = document.getElementById('peekberry-input') as HTMLInputElement;
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleEditCommand(input.value);
      input.value = '';
    }
  });
}

let selectedElement: HTMLElement | null = null;
let isSelectionMode = false;

function initializeElementSelection() {
  document.addEventListener('mouseover', handleElementHover);
  document.addEventListener('click', handleElementClick);
}

function handleElementHover(event: MouseEvent) {
  if (!isSelectionMode) return;

  const target = event.target as HTMLElement;
  if (target.id?.startsWith('peekberry-')) return;

  // Remove previous highlights
  document.querySelectorAll('.peekberry-highlight').forEach((el) => {
    el.classList.remove('peekberry-highlight');
  });

  // Add highlight to current element
  target.classList.add('peekberry-highlight');
}

function handleElementClick(event: MouseEvent) {
  const target = event.target as HTMLElement;

  // Ignore clicks on Peekberry UI
  if (target.id?.startsWith('peekberry-')) return;

  // If chat panel is open, enable selection mode
  if (document.getElementById('peekberry-chat-panel')) {
    event.preventDefault();
    event.stopPropagation();

    selectedElement = target;
    isSelectionMode = true;

    // Update UI to show selected element
    const messages = document.getElementById('peekberry-messages');
    if (messages) {
      messages.innerHTML = `
        <div style="background: #f0f9ff; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
          <strong>Selected:</strong> ${target.tagName.toLowerCase()}${target.id ? '#' + target.id : ''}${target.className ? '.' + target.className.split(' ').join('.') : ''}
        </div>
      `;
    }
  }
}

function handleEditCommand(command: string) {
  if (!selectedElement || !command.trim()) return;

  console.log(
    'Processing edit command:',
    command,
    'for element:',
    selectedElement
  );

  // For now, just log the command - AI processing will be implemented later
  const messages = document.getElementById('peekberry-messages');
  if (messages) {
    messages.innerHTML += `
      <div style="background: #f9fafb; padding: 8px 12px; border-radius: 6px; margin-bottom: 8px; font-size: 14px;">
        <strong>You:</strong> ${command}
      </div>
      <div style="background: #fef3c7; padding: 8px 12px; border-radius: 6px; margin-bottom: 8px; font-size: 14px;">
        <strong>Peekberry:</strong> AI processing not yet implemented. Command received for ${selectedElement.tagName.toLowerCase()} element.
      </div>
    `;
    messages.scrollTop = messages.scrollHeight;
  }
}

// Add CSS for element highlighting
const style = document.createElement('style');
style.textContent = `
  .peekberry-highlight {
    outline: 2px solid #0ea5e9 !important;
    outline-offset: 2px !important;
  }
`;
document.head.appendChild(style);
