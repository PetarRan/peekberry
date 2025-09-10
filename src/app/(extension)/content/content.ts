/**
 * Peekberry Chrome Extension Content Script
 * Handles DOM interaction, element selection, and UI injection
 */

// Types for content script functionality
interface ElementContext {
  selector: string;
  tagName: string;
  id?: string;
  className?: string;
  textContent?: string;
  computedStyles: Partial<CSSStyleDeclaration>;
  boundingRect: DOMRect;
}

interface DOMMutation {
  type: 'style' | 'attribute' | 'content';
  selector: string;
  property: string;
  value: string;
  previousValue?: string;
}

interface EditAction {
  id: string;
  type: 'style' | 'attribute' | 'content';
  element: ElementContext;
  mutation: DOMMutation;
  timestamp: Date;
  undoable: boolean;
}

class PeekberryContentScript {
  private isInitialized = false;
  private isElementSelectionActive = false;
  private selectedElements: HTMLElement[] = [];
  private editHistory: EditAction[] = [];
  private redoStack: EditAction[] = [];
  private peekberryBubble: HTMLElement | null = null;
  private chatPanel: HTMLElement | null = null;
  private highlightedElement: HTMLElement | null = null;
  private elementInfoTooltip: HTMLElement | null = null;
  private repositionTimeout: ReturnType<typeof setTimeout> | null = null;

  // CSS class names for Peekberry elements
  private readonly CSS_CLASSES = {
    BUBBLE: 'peekberry-bubble',
    CHAT_PANEL: 'peekberry-chat-panel',
    HIGHLIGHT: 'peekberry-highlight',
    SELECTED: 'peekberry-selected',
    CONTAINER: 'peekberry-container',
  };

  constructor() {
    this.initializeContentScript();
  }

  /**
   * Initialize the content script
   */
  private async initializeContentScript(): Promise<void> {
    if (this.isInitialized) return;

    console.log(
      'Peekberry: Starting content script initialization on:',
      window.location.href
    );

    // Check if we're on a valid page (not chrome:// or extension pages)
    if (this.isInvalidPage()) {
      console.log('Peekberry: Invalid page, skipping initialization');
      return;
    }

    console.log('Peekberry: Valid page, proceeding with initialization');

    // Always set up event listeners
    this.setupEventListeners();

    // TEMPORARY: Force show bubble immediately for debugging
    console.log('Peekberry: Force creating bubble for debugging');
    this.createPeekberryBubble(false);

    // Check authentication status with timeout
    try {
      const authStatus = await Promise.race([
        this.checkAuthStatus(),
        new Promise<{ isAuthenticated: boolean }>((_, reject) =>
          setTimeout(() => reject(new Error('Auth check timeout')), 5000)
        ),
      ]);

      console.log('Peekberry: Auth status:', authStatus);

      if (!authStatus.isAuthenticated) {
        console.log('Peekberry: User not authenticated, showing auth bubble');
        this.createPeekberryBubble(false);
      } else {
        console.log('Peekberry: User authenticated, showing active bubble');
        this.createPeekberryBubble(true);
      }
    } catch (error) {
      console.error('Peekberry: Auth check failed:', error);
      console.log(
        'Peekberry: Showing bubble in unauthenticated state as fallback'
      );
      this.createPeekberryBubble(false);
    }

    this.isInitialized = true;
    console.log('Peekberry content script initialized successfully');

    // Set up periodic check to ensure bubble stays visible
    setInterval(() => {
      if (
        !this.peekberryBubble ||
        !document.body.contains(this.peekberryBubble)
      ) {
        console.log('Peekberry: Bubble missing, recreating...');
        this.checkAuthStatus()
          .then((authStatus) => {
            this.createPeekberryBubble(authStatus.isAuthenticated);
          })
          .catch(() => {
            // If auth check fails, show unauthenticated bubble
            this.createPeekberryBubble(false);
          });
      }
    }, 3000); // Check every 3 seconds

    // Also add a delayed initialization as backup
    setTimeout(() => {
      if (!this.peekberryBubble) {
        console.log('Peekberry: Delayed initialization - creating bubble');
        this.createPeekberryBubble(false); // Default to unauthenticated
      }
    }, 2000);
  }

  /**
   * Check if current page is invalid for Peekberry
   */
  private isInvalidPage(): boolean {
    const url = window.location.href;
    return (
      url.startsWith('chrome://') ||
      url.startsWith('chrome-extension://') ||
      url.startsWith('moz-extension://') ||
      url.includes('peekberry.app')
    ); // Don't inject on our own webapp
  }

  /**
   * Check authentication status with background script
   */
  public async checkAuthStatus(): Promise<{
    isAuthenticated: boolean;
    userId?: string;
  }> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_AUTH_STATUS' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error(
            'Error checking auth status:',
            chrome.runtime.lastError
          );
          resolve({ isAuthenticated: false });
        } else {
          resolve(response?.data || { isAuthenticated: false });
        }
      });
    });
  }

  /**
   * Refresh authentication status and update bubble
   */
  private async refreshAuthStatus(): Promise<void> {
    const authStatus = await this.checkAuthStatus();
    console.log('Peekberry: Refreshed auth status:', authStatus);

    if (this.peekberryBubble) {
      // Remove old auth classes
      this.peekberryBubble.classList.remove(
        'peekberry-bubble-authenticated',
        'peekberry-bubble-unauthenticated'
      );

      // Add appropriate class and update title
      if (authStatus.isAuthenticated) {
        this.peekberryBubble.classList.add('peekberry-bubble-authenticated');
        this.peekberryBubble.setAttribute('title', 'Open Peekberry AI Editor');
        console.log('Peekberry: Bubble updated to authenticated state');
      } else {
        this.peekberryBubble.classList.add('peekberry-bubble-unauthenticated');
        this.peekberryBubble.setAttribute('title', 'Sign in to Peekberry');
        console.log('Peekberry: Bubble updated to unauthenticated state');
      }

      // Ensure bubble is visible
      this.ensureBubbleVisible();
    } else {
      console.log('Peekberry: No bubble found, creating new one');
      this.createPeekberryBubble(authStatus.isAuthenticated);
    }
  }

  /**
   * Ensure bubble remains visible and properly positioned
   */
  private ensureBubbleVisible(): void {
    if (!this.peekberryBubble) return;

    // Make sure bubble is attached to DOM
    if (!document.body.contains(this.peekberryBubble)) {
      console.log('Peekberry: Re-attaching bubble to DOM');
      document.body.appendChild(this.peekberryBubble);
    }

    // Ensure proper styling
    this.peekberryBubble.style.display = 'flex';
    this.peekberryBubble.style.position = 'fixed';
    this.peekberryBubble.style.zIndex = '2147483647';

    // Reposition safely
    this.positionBubbleSafely();
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Listen for messages from background script or popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sendResponse);
      return true;
    });

    // Listen for DOM changes to maintain our UI
    const observer = new MutationObserver((mutations) => {
      this.handleDOMChanges(mutations);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });

    // Handle window resize for bubble repositioning
    window.addEventListener('resize', () => {
      this.handleWindowResize();
    });
  }

  /**
   * Handle messages from background script or popup
   */
  private handleMessage(
    message: any,
    sendResponse: (response?: any) => void
  ): void {
    switch (message.type) {
      case 'TOGGLE_ELEMENT_SELECTION':
        this.toggleElementSelection();
        sendResponse({ success: true });
        break;

      case 'APPLY_MUTATION':
        this.applyMutation(message.payload);
        sendResponse({ success: true });
        break;

      case 'UNDO_LAST_EDIT':
        this.undoLastEdit();
        sendResponse({ success: true });
        break;

      case 'REDO_EDIT':
        this.redoEdit();
        sendResponse({ success: true });
        break;

      case 'GET_SELECTED_ELEMENTS':
        const contexts = this.selectedElements.map((el) =>
          this.getElementContext(el)
        );
        sendResponse({ success: true, data: contexts });
        break;

      case 'CAPTURE_SCREENSHOT':
        this.captureScreenshot().then((blob) => {
          sendResponse({ success: true, data: blob });
        });
        break;

      case 'REFRESH_AUTH_STATUS':
        this.refreshAuthStatus().then(() => {
          sendResponse({ success: true });
        });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  }

  /**
   * Handle DOM changes to maintain our UI
   */
  private handleDOMChanges(mutations: MutationRecord[]): void {
    // Check if our bubble was removed and re-add it
    if (this.peekberryBubble && !document.body.contains(this.peekberryBubble)) {
      console.log('Peekberry: Bubble was removed, re-creating...');
      // Re-check auth status and recreate bubble
      this.checkAuthStatus().then((authStatus) => {
        this.createPeekberryBubble(authStatus.isAuthenticated);
      });
    }

    // Check for layout changes that might affect bubble positioning
    const hasLayoutChanges = mutations.some(
      (mutation) =>
        mutation.type === 'childList' &&
        Array.from(mutation.addedNodes).some(
          (node) =>
            node.nodeType === Node.ELEMENT_NODE &&
            (node as Element).getBoundingClientRect().width > 0
        )
    );

    if (hasLayoutChanges) {
      // Debounce repositioning to avoid excessive calls
      if (this.repositionTimeout) {
        clearTimeout(this.repositionTimeout);
      }
      this.repositionTimeout = setTimeout(() => {
        this.positionBubbleSafely();
      }, 500);
    }
  }

  /**
   * Create the persistent Peekberry bubble following extension-ui.md guidelines
   */
  public createPeekberryBubble(isAuthenticated: boolean = true): void {
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

    // Add click handler with proper event handling
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

    // Ensure bubble stays on top and doesn't interfere with page
    this.positionBubbleSafely();

    document.body.appendChild(this.peekberryBubble);
    console.log('Peekberry: Bubble created and added to page', {
      isAuthenticated,
    });
  }

  /**
   * Position bubble safely to avoid conflicts with existing page elements
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

    // Check if bottom-right position conflicts with existing elements
    const bottomRightElements = document.elementsFromPoint(
      window.innerWidth - 80,
      window.innerHeight - 80
    );

    // If there are interactive elements in the way, adjust position
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
      // Try left side first
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
        // Move bubble to left side
        this.peekberryBubble.classList.add('peekberry-bubble-left');
        this.peekberryBubble.style.right = 'auto';
        this.peekberryBubble.style.left = '20px';
      } else {
        // Move bubble higher up
        this.peekberryBubble.classList.add('peekberry-bubble-conflict');
        this.peekberryBubble.style.bottom = '80px';
      }
    }
  }

  /**
   * Handle window resize events
   */
  private handleWindowResize(): void {
    // Debounce resize handling
    if (this.repositionTimeout) {
      clearTimeout(this.repositionTimeout);
    }
    this.repositionTimeout = setTimeout(() => {
      this.positionBubbleSafely();

      // Also reposition chat panel if it's open
      if (this.chatPanel) {
        this.repositionChatPanel();
      }
    }, 250);
  }

  /**
   * Reposition chat panel on window resize
   */
  private repositionChatPanel(): void {
    if (!this.chatPanel) return;

    // Ensure chat panel fits within viewport
    const rect = this.chatPanel.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Adjust horizontal position if needed
    if (rect.right > viewportWidth) {
      this.chatPanel.style.right = '20px';
      this.chatPanel.style.left = 'auto';
    }

    // Adjust vertical position if needed
    if (rect.bottom > viewportHeight) {
      this.chatPanel.style.maxHeight = `${viewportHeight - 40}px`;
    }
  }

  /**
   * Handle click when user is not authenticated
   */
  private handleUnauthenticatedClick(): void {
    this.showNotification('Please sign in to Peekberry first', 'warning');

    // Open the extension popup for authentication
    chrome.runtime.sendMessage({ type: 'OPEN_POPUP' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error opening popup:', chrome.runtime.lastError);
      }
    });
  }

  /**
   * Toggle the chat panel visibility
   */
  private toggleChatPanel(): void {
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
   * Show the chat panel with enhanced UI following extension-ui.md guidelines
   */
  private showChatPanel(): void {
    if (this.chatPanel) return;

    console.log('Peekberry: Creating and showing chat panel');

    this.chatPanel = document.createElement('div');
    this.chatPanel.className = this.CSS_CLASSES.CHAT_PANEL;
    this.chatPanel.setAttribute('data-peekberry-element', 'true');
    this.chatPanel.innerHTML = `
      <div class="peekberry-chat-header">
        <div class="peekberry-chat-title">Peekberry AI</div>
        <div class="peekberry-header-actions">
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

    // Add event listeners
    this.setupChatPanelEventListeners();

    // Position and show panel
    this.positionChatPanel();
    document.body.appendChild(this.chatPanel);

    // Update selected elements display
    this.updateSelectedElementsDisplay();
  }

  /**
   * Setup event listeners for chat panel
   */
  private setupChatPanelEventListeners(): void {
    if (!this.chatPanel) return;

    // Close button
    const closeBtn = this.chatPanel.querySelector('.peekberry-close-btn');
    closeBtn?.addEventListener('click', () => this.hideChatPanel());

    // History button
    const historyBtn = this.chatPanel.querySelector('.peekberry-history-btn');
    historyBtn?.addEventListener('click', () => this.showHistoryPanel());

    // Settings button
    const settingsBtn = this.chatPanel.querySelector('.peekberry-settings-btn');
    settingsBtn?.addEventListener('click', () => this.showSettingsMenu());

    // Upload button
    const uploadBtn = this.chatPanel.querySelector('.peekberry-upload-btn');
    uploadBtn?.addEventListener('click', () => this.handleFileUpload());

    // Voice button
    const voiceBtn = this.chatPanel.querySelector('.peekberry-voice-btn');
    voiceBtn?.addEventListener('click', () => this.toggleVoiceInput());

    // Screenshot button
    const screenshotBtn = this.chatPanel.querySelector(
      '.peekberry-screenshot-btn'
    );
    screenshotBtn?.addEventListener('click', () => this.captureScreenshot());

    // Apply button
    const applyBtn = this.chatPanel.querySelector('.peekberry-apply-btn');
    applyBtn?.addEventListener('click', () => this.processEditCommand());

    // Input handling
    const input = this.chatPanel.querySelector(
      '.peekberry-chat-input'
    ) as HTMLTextAreaElement;
    if (input) {
      // Auto-resize textarea
      input.addEventListener('input', () => this.autoResizeTextarea(input));

      // Handle Enter key (Shift+Enter for new line, Enter to apply)
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.processEditCommand();
        }
      });
    }
  }

  /**
   * Position chat panel appropriately
   */
  private positionChatPanel(): void {
    if (!this.chatPanel) return;

    // Default position from right side
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
   * Hide the chat panel
   */
  private hideChatPanel(): void {
    if (this.chatPanel) {
      this.chatPanel.remove();
      this.chatPanel = null;
    }

    // Also disable element selection if active
    if (this.isElementSelectionActive) {
      this.toggleElementSelection();
    }
  }

  /**
   * Toggle element selection mode
   */
  private toggleElementSelection(): void {
    this.isElementSelectionActive = !this.isElementSelectionActive;

    if (this.isElementSelectionActive) {
      this.startElementSelection();
    } else {
      this.stopElementSelection();
    }
  }

  /**
   * Start element selection mode
   */
  private startElementSelection(): void {
    document.addEventListener('mouseover', this.handleMouseOver);
    document.addEventListener('mouseout', this.handleMouseOut);
    document.addEventListener('click', this.handleElementClick);
    document.body.style.cursor = 'crosshair';
  }

  /**
   * Stop element selection mode
   */
  private stopElementSelection(): void {
    document.removeEventListener('mouseover', this.handleMouseOver);
    document.removeEventListener('mouseout', this.handleMouseOut);
    document.removeEventListener('click', this.handleElementClick);
    document.body.style.cursor = '';

    if (this.highlightedElement) {
      this.removeHighlight(this.highlightedElement);
      this.highlightedElement = null;
    }
  }

  /**
   * Handle mouse over for element highlighting
   */
  private handleMouseOver = (e: MouseEvent): void => {
    if (!this.isElementSelectionActive) return;

    const target = e.target as HTMLElement;

    // Skip Peekberry elements and non-interactive elements
    if (
      this.isPeekberryElement(target) ||
      this.isNonSelectableElement(target)
    ) {
      return;
    }

    // Find the most appropriate parent element for selection
    const selectableElement = this.findSelectableElement(target);
    if (!selectableElement) return;

    if (
      this.highlightedElement &&
      this.highlightedElement !== selectableElement
    ) {
      this.removeHighlight(this.highlightedElement);
    }

    this.highlightElement(selectableElement);
    this.highlightedElement = selectableElement;
  };

  /**
   * Handle mouse out for element highlighting
   */
  private handleMouseOut = (e: MouseEvent): void => {
    if (!this.isElementSelectionActive) return;

    const target = e.target as HTMLElement;
    if (
      this.isPeekberryElement(target) ||
      this.isNonSelectableElement(target)
    ) {
      return;
    }

    // Use a small delay to prevent flickering when moving between child elements
    setTimeout(() => {
      if (
        this.highlightedElement &&
        !this.highlightedElement.matches(':hover')
      ) {
        this.removeHighlight(this.highlightedElement);
        this.highlightedElement = null;
      }
    }, 50);
  };

  /**
   * Handle element click for selection
   */
  private handleElementClick = (e: MouseEvent): void => {
    if (!this.isElementSelectionActive) return;

    e.preventDefault();
    e.stopPropagation();

    const target = e.target as HTMLElement;
    if (this.isPeekberryElement(target)) return;

    this.selectElement(target);
    this.toggleElementSelection(); // Stop selection mode after selecting
  };

  /**
   * Check if element is part of Peekberry UI
   */
  private isPeekberryElement(element: HTMLElement): boolean {
    return (
      element.closest(`.${this.CSS_CLASSES.CONTAINER}`) !== null ||
      element.classList.contains(this.CSS_CLASSES.BUBBLE) ||
      element.classList.contains(this.CSS_CLASSES.CHAT_PANEL) ||
      element.closest('.peekberry-bubble') !== null ||
      element.closest('.peekberry-chat-panel') !== null ||
      element.hasAttribute('data-peekberry-element')
    );
  }

  /**
   * Check if element should not be selectable
   */
  private isNonSelectableElement(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();

    // Skip script, style, meta, and other non-visual elements
    const nonVisualTags = ['script', 'style', 'meta', 'link', 'title', 'head'];
    if (nonVisualTags.includes(tagName)) {
      return true;
    }

    // Skip elements that are not visible
    const computedStyle = window.getComputedStyle(element);
    if (
      computedStyle.display === 'none' ||
      computedStyle.visibility === 'hidden' ||
      computedStyle.opacity === '0'
    ) {
      return true;
    }

    // Skip very small elements (likely decorative)
    const rect = element.getBoundingClientRect();
    if (rect.width < 5 || rect.height < 5) {
      return true;
    }

    return false;
  }

  /**
   * Find the most appropriate element for selection
   */
  private findSelectableElement(element: HTMLElement): HTMLElement | null {
    let current = element;
    let iterations = 0;
    const maxIterations = 10; // Prevent infinite loops

    while (current && current !== document.body && iterations < maxIterations) {
      iterations++;

      // Skip if this is a non-selectable element
      if (this.isNonSelectableElement(current)) {
        current = current.parentElement!;
        continue;
      }

      // Prefer elements with semantic meaning
      const tagName = current.tagName.toLowerCase();
      const semanticTags = [
        'button',
        'a',
        'input',
        'select',
        'textarea',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'p',
        'div',
        'section',
        'article',
        'nav',
        'header',
        'footer',
        'main',
        'aside',
      ];

      if (semanticTags.includes(tagName)) {
        return current;
      }

      // Check if element has meaningful content or styling
      const rect = current.getBoundingClientRect();
      const hasContent = current.textContent?.trim().length > 0;
      const hasBackground =
        window.getComputedStyle(current).backgroundColor !== 'rgba(0, 0, 0, 0)';
      const hasBorder = window.getComputedStyle(current).borderWidth !== '0px';
      const isLargeEnough = rect.width > 20 && rect.height > 20;

      if ((hasContent || hasBackground || hasBorder) && isLargeEnough) {
        return current;
      }

      current = current.parentElement!;
    }

    return element; // Fallback to original element
  }

  /**
   * Highlight an element with enhanced visual feedback
   */
  private highlightElement(element: HTMLElement): void {
    // Remove any existing highlights first
    this.removeAllHighlights();

    // Add highlight class
    element.classList.add(this.CSS_CLASSES.HIGHLIGHT);

    // Store original styles to restore later if needed
    const originalOutline = element.style.outline;
    const originalOutlineOffset = element.style.outlineOffset;

    element.setAttribute('data-peekberry-original-outline', originalOutline);
    element.setAttribute(
      'data-peekberry-original-outline-offset',
      originalOutlineOffset
    );

    // Show element info tooltip
    this.showElementInfoTooltip(element);

    // Ensure the element is visible and scrolled into view if needed
    this.ensureElementVisibility(element);
  }

  /**
   * Remove highlight from an element
   */
  private removeHighlight(element: HTMLElement): void {
    element.classList.remove(this.CSS_CLASSES.HIGHLIGHT);

    // Restore original outline styles
    const originalOutline = element.getAttribute(
      'data-peekberry-original-outline'
    );
    const originalOutlineOffset = element.getAttribute(
      'data-peekberry-original-outline-offset'
    );

    if (originalOutline !== null) {
      element.style.outline = originalOutline;
      element.removeAttribute('data-peekberry-original-outline');
    }

    if (originalOutlineOffset !== null) {
      element.style.outlineOffset = originalOutlineOffset;
      element.removeAttribute('data-peekberry-original-outline-offset');
    }
  }

  /**
   * Remove all highlights from the page
   */
  private removeAllHighlights(): void {
    const highlightedElements = document.querySelectorAll(
      `.${this.CSS_CLASSES.HIGHLIGHT}`
    );
    highlightedElements.forEach((element) => {
      this.removeHighlight(element as HTMLElement);
    });
    this.hideElementInfoTooltip();
  }

  /**
   * Show element info tooltip
   */
  private showElementInfoTooltip(element: HTMLElement): void {
    this.hideElementInfoTooltip();

    const rect = element.getBoundingClientRect();
    const tagName = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const className = element.className
      ? `.${element.className.split(' ')[0]}`
      : '';

    const tooltipText = `${tagName}${id}${className}`;

    this.elementInfoTooltip = document.createElement('div');
    this.elementInfoTooltip.className = 'peekberry-element-info';
    this.elementInfoTooltip.textContent = tooltipText;
    this.elementInfoTooltip.setAttribute('data-peekberry-element', 'true');

    // Position tooltip above the element
    const tooltipTop = rect.top + window.scrollY - 30;
    const tooltipLeft = rect.left + window.scrollX;

    this.elementInfoTooltip.style.position = 'absolute';
    this.elementInfoTooltip.style.top = `${Math.max(10, tooltipTop)}px`;
    this.elementInfoTooltip.style.left = `${Math.max(10, tooltipLeft)}px`;

    document.body.appendChild(this.elementInfoTooltip);
  }

  /**
   * Hide element info tooltip
   */
  private hideElementInfoTooltip(): void {
    if (this.elementInfoTooltip) {
      this.elementInfoTooltip.remove();
      this.elementInfoTooltip = null;
    }
  }

  /**
   * Ensure element is visible for highlighting
   */
  private ensureElementVisibility(element: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    const isVisible =
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth;

    // If element is not fully visible, scroll it into view gently
    if (!isVisible) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    }
  }

  /**
   * Select an element
   */
  private selectElement(element: HTMLElement): void {
    if (!this.selectedElements.includes(element)) {
      this.selectedElements.push(element);
      element.classList.add(this.CSS_CLASSES.SELECTED);
      this.updateSelectedElementsDisplay();
    }
  }

  /**
   * Update the display of selected elements in chat panel
   */
  private updateSelectedElementsDisplay(): void {
    if (!this.chatPanel) return;

    const elementsList = this.chatPanel.querySelector(
      '.peekberry-elements-list'
    );
    if (!elementsList) return;

    elementsList.innerHTML = '';

    this.selectedElements.forEach((element, index) => {
      const tag = document.createElement('div');
      tag.className = 'peekberry-element-tag';
      tag.innerHTML = `
        <span>${this.getElementDisplayName(element)}</span>
        <button class="peekberry-remove-element" data-index="${index}">×</button>
      `;

      const removeBtn = tag.querySelector('.peekberry-remove-element');
      removeBtn?.addEventListener('click', () =>
        this.removeSelectedElement(index)
      );

      elementsList.appendChild(tag);
    });
  }

  /**
   * Get display name for an element
   */
  private getElementDisplayName(element: HTMLElement): string {
    const tagName = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const className = element.className
      ? `.${element.className.split(' ')[0]}`
      : '';
    return `${tagName}${id}${className}`;
  }

  /**
   * Remove a selected element
   */
  private removeSelectedElement(index: number): void {
    const element = this.selectedElements[index];
    if (element) {
      element.classList.remove(this.CSS_CLASSES.SELECTED);
      this.selectedElements.splice(index, 1);
      this.updateSelectedElementsDisplay();
    }
  }

  /**
   * Get comprehensive element context for AI processing
   */
  private getElementContext(element: HTMLElement): ElementContext {
    const rect = element.getBoundingClientRect();
    const computedStyles = window.getComputedStyle(element);

    // Extract comprehensive style information
    const styleContext = {
      // Layout properties
      display: computedStyles.display,
      position: computedStyles.position,
      width: computedStyles.width,
      height: computedStyles.height,
      margin: computedStyles.margin,
      padding: computedStyles.padding,

      // Typography
      color: computedStyles.color,
      backgroundColor: computedStyles.backgroundColor,
      fontSize: computedStyles.fontSize,
      fontFamily: computedStyles.fontFamily,
      fontWeight: computedStyles.fontWeight,
      lineHeight: computedStyles.lineHeight,
      textAlign: computedStyles.textAlign,

      // Border and visual
      border: computedStyles.border,
      borderRadius: computedStyles.borderRadius,
      boxShadow: computedStyles.boxShadow,
      opacity: computedStyles.opacity,

      // Flexbox/Grid
      flexDirection: computedStyles.flexDirection,
      justifyContent: computedStyles.justifyContent,
      alignItems: computedStyles.alignItems,
      gridTemplateColumns: computedStyles.gridTemplateColumns,
      gridTemplateRows: computedStyles.gridTemplateRows,

      // Transform and animation
      transform: computedStyles.transform,
      transition: computedStyles.transition,

      // Z-index and overflow
      zIndex: computedStyles.zIndex,
      overflow: computedStyles.overflow,
    };

    return {
      selector: this.generateSelector(element),
      tagName: element.tagName.toLowerCase(),
      id: element.id || undefined,
      className: element.className || undefined,
      textContent: element.textContent?.trim() || undefined,
      computedStyles: styleContext,
      boundingRect: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
      } as DOMRect,
    };
  }

  /**
   * Generate a robust and unique selector for an element
   */
  private generateSelector(element: HTMLElement): string {
    // Try ID first (most specific)
    if (element.id && /^[a-zA-Z][\w-]*$/.test(element.id)) {
      return `#${element.id}`;
    }

    // Try data attributes for unique identification
    const dataId =
      element.getAttribute('data-id') || element.getAttribute('data-testid');
    if (dataId) {
      return `[data-id="${dataId}"]`;
    }

    // Build a path-based selector
    const path: string[] = [];
    let current = element;

    while (
      current &&
      current !== document.body &&
      current !== document.documentElement
    ) {
      let selector = current.tagName.toLowerCase();

      // Add class if it exists and looks stable (not generated)
      if (current.className) {
        const classes = current.className
          .split(' ')
          .filter(
            (cls) => cls && !cls.match(/^(css-|MuiBox-|makeStyles-|jss\d+)/)
          )
          .slice(0, 2); // Limit to first 2 stable classes

        if (classes.length > 0) {
          selector += '.' + classes.join('.');
        }
      }

      // Add nth-child if needed for uniqueness
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(
          (child) => child.tagName === current.tagName
        );

        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `:nth-child(${index})`;
        }
      }

      path.unshift(selector);
      current = current.parentElement!;
    }

    // Limit path depth to avoid overly long selectors
    if (path.length > 5) {
      path.splice(0, path.length - 5);
    }

    return path.join(' > ');
  }

  /**
   * Auto-resize textarea based on content
   */
  private autoResizeTextarea(textarea: HTMLTextAreaElement): void {
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 120); // Max height of 120px
    textarea.style.height = `${newHeight}px`;
  }

  /**
   * Show history panel with slide-in animation
   */
  private showHistoryPanel(): void {
    // Remove existing history panel if any
    const existingHistory = document.querySelector('.peekberry-history-panel');
    if (existingHistory) {
      existingHistory.remove();
    }

    const historyPanel = document.createElement('div');
    historyPanel.className = 'peekberry-history-panel';
    historyPanel.setAttribute('data-peekberry-element', 'true');
    historyPanel.innerHTML = `
      <div class="peekberry-history-header">
        <button class="peekberry-history-back" type="button" title="Back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="peekberry-history-title">History</div>
      </div>
      <div class="peekberry-history-content">
        ${this.renderHistoryEntries()}
      </div>
    `;

    // Position history panel
    if (this.chatPanel) {
      const chatRect = this.chatPanel.getBoundingClientRect();
      historyPanel.style.position = 'fixed';
      historyPanel.style.top = `${chatRect.top}px`;
      historyPanel.style.right = `${window.innerWidth - chatRect.left}px`;
      historyPanel.style.width = `${chatRect.width}px`;
      historyPanel.style.height = `${chatRect.height}px`;
    }

    // Add event listeners
    const backBtn = historyPanel.querySelector('.peekberry-history-back');
    backBtn?.addEventListener('click', () => {
      historyPanel.remove();
    });

    // Add revert button listeners
    historyPanel
      .querySelectorAll('.peekberry-revert-btn')
      .forEach((btn, index) => {
        btn.addEventListener('click', () => {
          this.revertToHistoryEntry(index);
          historyPanel.remove();
        });
      });

    document.body.appendChild(historyPanel);
  }

  /**
   * Render history entries HTML
   */
  private renderHistoryEntries(): string {
    if (this.editHistory.length === 0) {
      return `
        <div class="peekberry-history-empty">
          <div class="peekberry-history-empty-title">No history yet</div>
          <div class="peekberry-history-empty-text">Your edit history will appear here</div>
        </div>
      `;
    }

    return this.editHistory
      .slice()
      .reverse()
      .map((entry, index) => {
        const timeAgo = this.getTimeAgo(entry.timestamp);
        const description = this.getEditDescription(entry);

        return `
          <div class="peekberry-history-entry">
            <div class="peekberry-history-entry-content">
              <div class="peekberry-history-entry-text">${description}</div>
              <div class="peekberry-history-entry-time">${timeAgo}</div>
            </div>
            <button class="peekberry-revert-btn" type="button">Revert</button>
          </div>
        `;
      })
      .join('');
  }

  /**
   * Get human-readable edit description
   */
  private getEditDescription(entry: EditAction): string {
    const elementName = this.getElementDisplayName(entry.element as any);
    const action =
      entry.type === 'style'
        ? 'styled'
        : entry.type === 'content'
          ? 'changed text of'
          : 'modified';
    return `${action} ${elementName}`;
  }

  /**
   * Get time ago string
   */
  private getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffSeconds < 60) {
      return 'now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  }

  /**
   * Revert to a specific history entry
   */
  private revertToHistoryEntry(index: number): void {
    // This will be implemented in the undo/redo task
    console.log('Reverting to history entry:', index);
  }

  /**
   * Show settings menu (placeholder)
   */
  private showSettingsMenu(): void {
    console.log('Settings menu - to be implemented');
  }

  /**
   * Handle file upload (placeholder)
   */
  private handleFileUpload(): void {
    console.log('File upload - to be implemented');
  }

  /**
   * Toggle voice input (placeholder)
   */
  private toggleVoiceInput(): void {
    console.log('Voice input - to be implemented');
  }

  /**
   * Process edit command with enhanced functionality
   */
  private async processEditCommand(): Promise<void> {
    if (!this.chatPanel) return;

    const input = this.chatPanel.querySelector(
      '.peekberry-chat-input'
    ) as HTMLTextAreaElement;
    const command = input?.value.trim();

    if (!command) {
      this.showNotification('Please enter a command', 'warning');
      return;
    }

    if (this.selectedElements.length === 0) {
      this.showNotification('Please select at least one element', 'warning');
      return;
    }

    // Show loading state
    const applyBtn = this.chatPanel.querySelector(
      '.peekberry-apply-btn'
    ) as HTMLButtonElement;
    const originalText = applyBtn.textContent;
    applyBtn.textContent = 'Processing...';
    applyBtn.disabled = true;

    try {
      // Send command to background script for AI processing
      const response = await this.sendMessageToBackground({
        type: 'PROCESS_EDIT_COMMAND',
        payload: {
          command,
          elements: this.selectedElements.map((el) =>
            this.getElementContext(el)
          ),
        },
      });

      if (response.success && response.data) {
        // Apply mutations will be implemented in task 11
        console.log('Edit command processed:', response.data);

        // Add to history
        const editAction: EditAction = {
          id: Date.now().toString(),
          type: 'style', // This will be determined by the AI response
          element: this.getElementContext(this.selectedElements[0]),
          mutation: response.data,
          timestamp: new Date(),
          undoable: true,
        };

        this.editHistory.push(editAction);

        // Clear input and show success
        input.value = '';
        this.autoResizeTextarea(input);
        this.showNotification('Changes applied successfully', 'success');
      } else {
        throw new Error(response.error || 'Failed to process command');
      }
    } catch (error) {
      console.error('Error processing edit command:', error);
      this.showNotification(
        'Failed to process command. Please try again.',
        'error'
      );
    } finally {
      // Restore button state
      applyBtn.textContent = originalText;
      applyBtn.disabled = false;
    }
  }

  /**
   * Send message to background script
   */
  private async sendMessageToBackground(message: any): Promise<any> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: chrome.runtime.lastError.message });
        } else {
          resolve(response || { success: false, error: 'No response' });
        }
      });
    });
  }

  /**
   * Show notification to user
   */
  private showNotification(
    message: string,
    type: 'success' | 'warning' | 'error' = 'success'
  ): void {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll(
      '.peekberry-notification'
    );
    existingNotifications.forEach((n) => n.remove());

    const notification = document.createElement('div');
    notification.className = `peekberry-notification peekberry-notification-${type}`;
    notification.setAttribute('data-peekberry-element', 'true');
    notification.textContent = message;

    // Position notification
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '2147483647';

    document.body.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }

  /**
   * Apply DOM mutation (placeholder for now)
   */
  /**
   * Capture screenshot with metadata and upload
   */
  private async captureScreenshot(): Promise<Blob | null> {
    try {
      // Show loading notification
      this.showNotification('Capturing screenshot...', 'success');

      // Send message to background script to capture screenshot
      const response = await this.sendMessageToBackground({
        type: 'CAPTURE_SCREENSHOT',
        payload: {
          pageUrl: window.location.href,
          pageTitle: document.title,
          editCount: this.editHistory.length,
          dimensions: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
        },
      });

      if (response.success && response.data) {
        this.showNotification('Screenshot captured and saved!', 'success');
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to capture screenshot');
      }
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      this.showNotification('Failed to capture screenshot', 'error');
      return null;
    }
  }

  /**
   * Apply DOM mutation (placeholder - will be implemented in task 11)
   */
  private applyMutation(mutation: DOMMutation): void {
    console.log('Applying mutation:', mutation);
    // This will be implemented in task 11
  }

  /**
   * Undo last edit (placeholder - will be implemented in task 12)
   */
  private undoLastEdit(): void {
    if (this.editHistory.length === 0) {
      this.showNotification('No edits to undo', 'warning');
      return;
    }

    console.log('Undo last edit');
    // This will be implemented in task 12
  }

  /**
   * Redo edit (placeholder - will be implemented in task 12)
   */
  private redoEdit(): void {
    if (this.redoStack.length === 0) {
      this.showNotification('No edits to redo', 'warning');
      return;
    }

    console.log('Redo edit');
    // This will be implemented in task 12
  }

  /**
   * Clean up on page unload
   */
  private cleanup(): void {
    this.stopElementSelection();
    this.removeAllHighlights();
    this.hideElementInfoTooltip();

    // Clear any pending timeouts
    if (this.repositionTimeout) {
      clearTimeout(this.repositionTimeout);
      this.repositionTimeout = null;
    }

    if (this.peekberryBubble) {
      this.peekberryBubble.remove();
    }
    if (this.chatPanel) {
      this.chatPanel.remove();
    }
  }
}

// Initialize content script when DOM is ready
let peekberryInstance: PeekberryContentScript;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    peekberryInstance = new PeekberryContentScript();
  });
} else {
  peekberryInstance = new PeekberryContentScript();
}

// Add global debug method
(window as any).peekberryDebug = {
  forceShowBubble: () => {
    console.log('Peekberry: Force showing bubble');
    if (peekberryInstance) {
      peekberryInstance.createPeekberryBubble(false);
    }
  },
  checkAuth: async () => {
    if (peekberryInstance) {
      const status = await peekberryInstance.checkAuthStatus();
      console.log('Peekberry: Auth status:', status);
      return status;
    }
  },
  reinitialize: () => {
    console.log('Peekberry: Reinitializing...');
    peekberryInstance = new PeekberryContentScript();
  },
};
