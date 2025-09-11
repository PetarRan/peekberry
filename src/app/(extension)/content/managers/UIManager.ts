/**
 * UI Manager
 * Handles Peekberry bubble and chat panel UI
 */

import { ElementSelectionManager } from './ElementSelectionManager';
import { EditHistoryManager } from './EditHistoryManager';

export class UIManager {
  private peekberryBubble: HTMLElement | null = null;
  private chatPanel: HTMLElement | null = null;
  private repositionTimeout: ReturnType<typeof setTimeout> | null = null;
  private elementSelectionManager: ElementSelectionManager;
  private editHistoryManager: EditHistoryManager;

  private readonly CSS_CLASSES = {
    BUBBLE: 'peekberry-bubble',
    CHAT_PANEL: 'peekberry-chat-panel',
  };

  constructor(
    elementSelectionManager: ElementSelectionManager,
    editHistoryManager: EditHistoryManager
  ) {
    this.elementSelectionManager = elementSelectionManager;
    this.editHistoryManager = editHistoryManager;
    
    // Set up callback for selection changes
    this.elementSelectionManager.setOnSelectionChange(() => {
      this.updateSelectedElementsDisplay();
    });
    
    this.setupWindowListeners();
  }

  /**
   * Create the persistent Peekberry bubble
   */
  public createBubble(isAuthenticated: boolean = true): void {
    if (this.peekberryBubble) {
      this.peekberryBubble.remove();
    }

    this.peekberryBubble = document.createElement('div');
    this.peekberryBubble.className = this.CSS_CLASSES.BUBBLE;
    this.peekberryBubble.setAttribute('data-peekberry-element', 'true');

    if (isAuthenticated) {
      this.peekberryBubble.setAttribute('title', 'Open Peekberry AI Editor');
      this.peekberryBubble.classList.add('peekberry-bubble-authenticated');
    } else {
      this.peekberryBubble.setAttribute('title', 'Sign in to Peekberry');
      this.peekberryBubble.classList.add('peekberry-bubble-unauthenticated');
    }

    // Use a more recognizable AI/edit icon
    this.peekberryBubble.innerHTML = `
      <div class="peekberry-bubble-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    `;

    // Add click handler
    this.peekberryBubble.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (isAuthenticated) {
        this.toggleChatPanel();
      } else {
        this.handleUnauthenticatedClick();
      }
    });

    // Add keyboard accessibility
    this.peekberryBubble.setAttribute('tabindex', '0');
    this.peekberryBubble.setAttribute('role', 'button');
    this.peekberryBubble.setAttribute('aria-label', 'Open Peekberry AI Editor');

    this.peekberryBubble.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();

        if (isAuthenticated) {
          this.toggleChatPanel();
        } else {
          this.handleUnauthenticatedClick();
        }
      }
    });

    this.positionBubbleSafely();
    document.body.appendChild(this.peekberryBubble);

    console.log('Peekberry: Bubble created and added to page', {
      isAuthenticated,
    });
  }

  /**
   * Position bubble safely to avoid conflicts
   */
  private positionBubbleSafely(): void {
    if (!this.peekberryBubble) return;

    // Reset to default position first
    this.peekberryBubble.classList.remove(
      'peekberry-bubble-left',
      'peekberry-bubble-conflict'
    );
    this.peekberryBubble.style.right = '20px';
    this.peekberryBubble.style.left = 'auto';
    this.peekberryBubble.style.bottom = '20px';

    // Check for conflicts and adjust position if needed
    const bottomRightElements = document.elementsFromPoint(
      window.innerWidth - 80,
      window.innerHeight - 80
    );

    const hasConflict = bottomRightElements.some((el) => {
      if (this.isPeekberryElement(el as HTMLElement)) return false;

      const tagName = el.tagName.toLowerCase();
      return (
        ['button', 'a', 'input', 'select', 'textarea'].includes(tagName) ||
        el.getAttribute('role') === 'button' ||
        window.getComputedStyle(el).cursor === 'pointer'
      );
    });

    if (hasConflict) {
      // Try left side or move higher
      const bottomLeftElements = document.elementsFromPoint(
        80,
        window.innerHeight - 80
      );
      const hasLeftConflict = bottomLeftElements.some((el) => {
        if (this.isPeekberryElement(el as HTMLElement)) return false;
        const tagName = el.tagName.toLowerCase();
        return (
          ['button', 'a', 'input', 'select', 'textarea'].includes(tagName) ||
          el.getAttribute('role') === 'button' ||
          window.getComputedStyle(el).cursor === 'pointer'
        );
      });

      if (!hasLeftConflict) {
        this.peekberryBubble.classList.add('peekberry-bubble-left');
        this.peekberryBubble.style.right = 'auto';
        this.peekberryBubble.style.left = '20px';
      } else {
        this.peekberryBubble.classList.add('peekberry-bubble-conflict');
        this.peekberryBubble.style.bottom = '80px';
      }
    }
  }

  /**
   * Toggle chat panel visibility
   */
  public toggleChatPanel(): void {
    console.log(
      'Peekberry: Toggling chat panel, current state:',
      this.chatPanel ? 'open' : 'closed'
    );
    if (this.chatPanel) {
      this.hideChatPanel();
    } else {
      this.showChatPanel();
    }
  }

  /**
   * Show the chat panel
   */
  public showChatPanel(): void {
    if (this.chatPanel) return;

    console.log('Peekberry: Creating and showing chat panel');

    this.chatPanel = document.createElement('div');
    this.chatPanel.className = this.CSS_CLASSES.CHAT_PANEL;
    this.chatPanel.setAttribute('data-peekberry-element', 'true');
    this.chatPanel.innerHTML = this.createChatPanelHTML();

    this.setupChatPanelEventListeners();
    this.positionChatPanel();
    document.body.appendChild(this.chatPanel);

    // Update displays
    this.updateSelectedElementsDisplay();
    this.updateUndoRedoButtonStates();
    this.updateApplyButtonState();
  }

  /**
   * Hide the chat panel
   */
  public hideChatPanel(): void {
    if (this.chatPanel) {
      this.chatPanel.remove();
      this.chatPanel = null;
    }
  }

  /**
   * Create chat panel HTML
   */
  private createChatPanelHTML(): string {
    return `
      <div class="peekberry-chat-header">
        <div class="peekberry-chat-title">Peekberry AI</div>
        <div class="peekberry-header-actions">
          <button class="peekberry-undo-btn" type="button" title="Undo (Ctrl+Z)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M3 7v6h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="peekberry-redo-btn" type="button" title="Redo (Ctrl+Shift+Z)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 7v6h-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3L21 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="peekberry-history-btn" type="button" title="View History">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="peekberry-close-btn" type="button" title="Close">×</button>
        </div>
      </div>
      <div class="peekberry-chat-content">
        <div class="peekberry-selected-elements">
          <div class="peekberry-elements-label">Selected Elements</div>
          <div class="peekberry-elements-list"></div>
        </div>
        <div class="peekberry-chat-input-container">
          <div class="peekberry-input-wrapper">
            <div class="peekberry-input-icons">
              <button class="peekberry-settings-btn" type="button" title="Settings">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" stroke-width="2"/>
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" stroke-width="2"/>
                </svg>
              </button>
              <button class="peekberry-upload-btn" type="button" title="Upload">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
            <textarea 
              class="peekberry-chat-input" 
              placeholder="e.g., 'Make the signup button more prominent'"
              rows="2"
            ></textarea>
            <div class="peekberry-input-controls">
              <div class="peekberry-model-selector">
                <select class="peekberry-model-dropdown">
                  <option value="claude-4">Claude-4</option>
                  <option value="gpt-4">GPT-4</option>
                </select>
              </div>
              <button class="peekberry-voice-btn" type="button" title="Voice Input">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" stroke="currentColor" stroke-width="2"/>
                  <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <button class="peekberry-screenshot-btn" type="button" title="Screenshot">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="currentColor" stroke-width="2"/>
                  <circle cx="12" cy="13" r="4" stroke="currentColor" stroke-width="2"/>
                </svg>
              </button>
              <button class="peekberry-apply-btn" type="button">Apply</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Setup chat panel event listeners
   */
  private setupChatPanelEventListeners(): void {
    if (!this.chatPanel) return;

    // Close button
    const closeBtn = this.chatPanel.querySelector('.peekberry-close-btn');
    closeBtn?.addEventListener('click', () => this.hideChatPanel());

    // Undo/Redo buttons
    const undoBtn = this.chatPanel.querySelector('.peekberry-undo-btn');
    undoBtn?.addEventListener('click', () => this.editHistoryManager.undo());

    const redoBtn = this.chatPanel.querySelector('.peekberry-redo-btn');
    redoBtn?.addEventListener('click', () => this.editHistoryManager.redo());

    // History button
    const historyBtn = this.chatPanel.querySelector('.peekberry-history-btn');
    historyBtn?.addEventListener('click', () => this.showHistoryPanel());

    // Input handling
    const input = this.chatPanel.querySelector(
      '.peekberry-chat-input'
    ) as HTMLTextAreaElement;
    if (input) {
      input.addEventListener('input', () => {
        this.autoResizeTextarea(input);
        this.updateApplyButtonState();
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          // Emit event for processing
          this.emitProcessCommand();
        }
      });
    }

    // Apply button
    const applyBtn = this.chatPanel.querySelector('.peekberry-apply-btn');
    applyBtn?.addEventListener('click', () => this.emitProcessCommand());

    // Other buttons (placeholder handlers)
    const screenshotBtn = this.chatPanel.querySelector(
      '.peekberry-screenshot-btn'
    );
    screenshotBtn?.addEventListener('click', () =>
      this.emitScreenshotCapture()
    );
  }

  /**
   * Position chat panel
   */
  private positionChatPanel(): void {
    if (!this.chatPanel) return;

    this.chatPanel.style.position = 'fixed';
    this.chatPanel.style.top = '20px';
    this.chatPanel.style.right = '20px';
    this.chatPanel.style.zIndex = '2147483646';

    // Adjust for mobile
    if (window.innerWidth <= 480) {
      this.chatPanel.style.right = '10px';
      this.chatPanel.style.left = '10px';
      this.chatPanel.style.width = 'auto';
    }
  }

  /**
   * Update selected elements display
   */
  public updateSelectedElementsDisplay(): void {
    if (!this.chatPanel) return;

    const elementsList = this.chatPanel.querySelector(
      '.peekberry-elements-list'
    );
    if (!elementsList) return;

    elementsList.innerHTML = '';
    const selectedElements = this.elementSelectionManager.getSelectedElements();

    if (selectedElements.length === 0) {
      const helpMessage = document.createElement('div');
      helpMessage.className = 'peekberry-elements-help';
      helpMessage.innerHTML = `
        <div class="peekberry-help-text">
          🎯 Hover and click any element on the page to select it.<br>
          Element selection is now optimized for performance!
        </div>
      `;
      elementsList.appendChild(helpMessage);
    } else {
      selectedElements.forEach((element, index) => {
        const tag = document.createElement('div');
        tag.className = 'peekberry-element-tag';
        tag.innerHTML = `
          <span>${this.elementSelectionManager.getElementDisplayName(element)}</span>
          <button class="peekberry-remove-element" data-index="${index}">×</button>
        `;

        const removeBtn = tag.querySelector('.peekberry-remove-element');
        removeBtn?.addEventListener('click', () => {
          this.elementSelectionManager.removeSelectedElement(index);
          this.updateSelectedElementsDisplay();
        });

        elementsList.appendChild(tag);
      });
    }
  }

  /**
   * Update undo/redo button states
   */
  public updateUndoRedoButtonStates(): void {
    if (!this.chatPanel) return;

    const undoBtn = this.chatPanel.querySelector(
      '.peekberry-undo-btn'
    ) as HTMLButtonElement;
    const redoBtn = this.chatPanel.querySelector(
      '.peekberry-redo-btn'
    ) as HTMLButtonElement;

    if (undoBtn) {
      const canUndo = this.editHistoryManager.canUndo();
      undoBtn.disabled = !canUndo;
      undoBtn.style.opacity = canUndo ? '1' : '0.5';
      undoBtn.title = canUndo
        ? `Undo (Ctrl+Z) - ${this.editHistoryManager.getHistoryCount()} edits`
        : 'No edits to undo';
    }

    if (redoBtn) {
      const canRedo = this.editHistoryManager.canRedo();
      redoBtn.disabled = !canRedo;
      redoBtn.style.opacity = canRedo ? '1' : '0.5';
      redoBtn.title = canRedo
        ? `Redo (Ctrl+Shift+Z) - ${this.editHistoryManager.getRedoCount()} edits`
        : 'No edits to redo';
    }
  }

  /**
   * Update apply button state
   */
  public updateApplyButtonState(): void {
    if (!this.chatPanel) return;

    const applyBtn = this.chatPanel.querySelector(
      '.peekberry-apply-btn'
    ) as HTMLButtonElement;
    const input = this.chatPanel.querySelector(
      '.peekberry-chat-input'
    ) as HTMLTextAreaElement;

    if (applyBtn) {
      const hasElements =
        this.elementSelectionManager.getSelectedElements().length > 0;
      const hasInput = input && input.value.trim().length > 0;
      const isAuthenticated = this.elementSelectionManager.isSelectionActive();

      applyBtn.disabled = !hasElements || !hasInput || !isAuthenticated;

      if (!isAuthenticated) {
        applyBtn.textContent = 'Sign In Required';
      } else if (!hasElements) {
        applyBtn.textContent = 'Select Element';
      } else if (!hasInput) {
        applyBtn.textContent = 'Enter Command';
      } else {
        applyBtn.textContent = 'Apply';
      }
    }
  }

  /**
   * Auto-resize textarea
   */
  private autoResizeTextarea(textarea: HTMLTextAreaElement): void {
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 120);
    textarea.style.height = `${newHeight}px`;
  }

  /**
   * Show history panel
   */
  private showHistoryPanel(): void {
    // Implementation for history panel
    console.log('History panel - to be implemented');
  }

  /**
   * Handle unauthenticated click
   */
  private handleUnauthenticatedClick(): void {
    console.log('Opening auth flow for unauthenticated user...');
    
    // First try to sync auth from existing webapp tabs
    chrome.runtime.sendMessage({
      type: 'SYNC_AUTH_FROM_WEBAPP'
    }, (response) => {
      console.log('Auth sync response:', response);
      
      if (response?.success && response?.data?.isAuthenticated) {
        console.log('Auth sync successful, user is now authenticated!');
        // Refresh the page to update UI
        window.location.reload();
        return;
      }
      
      // If no existing auth, open auth page
      console.log('No existing auth found, opening auth page...');
      chrome.runtime.sendMessage({
        type: 'OPEN_AUTH_PAGE'
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error opening auth page:', chrome.runtime.lastError);
        }
      });
    });
  }


  /**
   * Setup window event listeners
   */
  private setupWindowListeners(): void {
    window.addEventListener('resize', () => {
      if (this.repositionTimeout) {
        clearTimeout(this.repositionTimeout);
      }
      this.repositionTimeout = setTimeout(() => {
        this.positionBubbleSafely();
        if (this.chatPanel) {
          this.positionChatPanel();
        }
      }, 250);
    });
  }

  /**
   * Check if element is Peekberry element
   */
  private isPeekberryElement(element: HTMLElement): boolean {
    return (
      element.closest('.peekberry-bubble') !== null ||
      element.closest('.peekberry-chat-panel') !== null ||
      element.hasAttribute('data-peekberry-element')
    );
  }

  /**
   * Emit process command event
   */
  private emitProcessCommand(): void {
    const event = new CustomEvent('peekberry-process-command', {
      detail: {
        input: this.chatPanel?.querySelector(
          '.peekberry-chat-input'
        ) as HTMLTextAreaElement,
        selectedElements: this.elementSelectionManager.getSelectedElements(),
      },
    });
    document.dispatchEvent(event);
  }

  /**
   * Emit screenshot capture event
   */
  private emitScreenshotCapture(): void {
    const event = new CustomEvent('peekberry-capture-screenshot');
    document.dispatchEvent(event);
  }

  /**
   * Get chat panel element
   */
  public getChatPanel(): HTMLElement | null {
    return this.chatPanel;
  }

  /**
   * Get bubble element
   */
  public getBubble(): HTMLElement | null {
    return this.peekberryBubble;
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    if (this.repositionTimeout) {
      clearTimeout(this.repositionTimeout);
      this.repositionTimeout = null;
    }

    if (this.peekberryBubble) {
      this.peekberryBubble.remove();
      this.peekberryBubble = null;
    }

    if (this.chatPanel) {
      this.chatPanel.remove();
      this.chatPanel = null;
    }
  }
}
