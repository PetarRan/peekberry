/**
 * UI Manager
 * Handles Peekberry bubble and chat panel UI
 */

import React from 'react';
import { ElementSelectionManager } from './ElementSelectionManager';
import { EditHistoryManager } from './EditHistoryManager';
import { renderReactComponent } from '../../utils/reactIntegration';
import { ChatPanel, SelectedElement } from '../../components/chat';

export class UIManager {
  private peekberryBubble: HTMLElement | null = null;
  private chatPanel: HTMLElement | null = null;
  private repositionTimeout: ReturnType<typeof setTimeout> | null = null;
  private elementSelectionManager: ElementSelectionManager;
  private editHistoryManager: EditHistoryManager;
  private reactCleanup: (() => void) | null = null;

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
      this.updateReactChatPanel();
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

    console.log('Peekberry: Creating and showing React ChatPanel');

    this.chatPanel = document.createElement('div');
    this.chatPanel.className = this.CSS_CLASSES.CHAT_PANEL;
    this.chatPanel.setAttribute('data-peekberry-element', 'true');

    // Create empty container for React
    this.chatPanel.innerHTML = '';
    this.createReactChatPanel();

    this.positionChatPanel();
    document.body.appendChild(this.chatPanel);
  }

  /**
   * Hide the chat panel
   */
  public hideChatPanel(): void {
    if (this.chatPanel) {
      // Clean up React component if it exists
      if (this.reactCleanup) {
        this.reactCleanup();
        this.reactCleanup = null;
      }
      
      this.chatPanel.remove();
      this.chatPanel = null;
    }
  }

  /**
   * Create React-based chat panel
   */
  private createReactChatPanel(): void {
    if (!this.chatPanel) return;

    console.log('Peekberry: Creating React ChatPanel');
    
    // Convert selected elements to the format expected by React component
    const selectedElements: SelectedElement[] = this.elementSelectionManager
      .getSelectedElements()
      .map((element, index) => ({
        id: `element-${index}`,
        displayName: this.elementSelectionManager.getElementDisplayName(element),
        element: element
      }));

    // Create React component
    const chatComponent = React.createElement(ChatPanel, {
      selectedElements,
      onElementRemove: (index: number) => {
        this.elementSelectionManager.removeSelectedElement(index);
      },
      onSendMessage: (message: string) => {
        console.log('React ChatPanel - Send message:', message);
        // TODO: Implement message sending logic
      },
      onClose: () => {
        this.hideChatPanel();
      },
      isVisible: true
    });

    // Render React component
    this.reactCleanup = renderReactComponent(chatComponent, this.chatPanel);
  }

  /**
   * Update React ChatPanel with current selected elements
   */
  private updateReactChatPanel(): void {
    if (!this.chatPanel || !this.reactCleanup) return;

    // Clean up existing React component
    this.reactCleanup();
    
    // Re-render with updated selected elements
    this.createReactChatPanel();
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
