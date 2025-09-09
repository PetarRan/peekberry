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

    // Check if we're on a valid page (not chrome:// or extension pages)
    if (this.isInvalidPage()) {
      return;
    }

    // Check authentication status
    const authStatus = await this.checkAuthStatus();
    if (!authStatus.isAuthenticated) {
      console.log('Peekberry: User not authenticated, skipping initialization');
      return;
    }

    this.setupEventListeners();
    this.createPeekberryBubble();
    this.isInitialized = true;

    console.log('Peekberry content script initialized');
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
  private async checkAuthStatus(): Promise<{
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
      this.createPeekberryBubble();
    }
  }

  /**
   * Create the persistent Peekberry bubble
   */
  private createPeekberryBubble(): void {
    if (this.peekberryBubble) {
      this.peekberryBubble.remove();
    }

    this.peekberryBubble = document.createElement('div');
    this.peekberryBubble.className = this.CSS_CLASSES.BUBBLE;
    this.peekberryBubble.innerHTML = `
      <div class="peekberry-bubble-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        </svg>
      </div>
    `;

    this.peekberryBubble.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleChatPanel();
    });

    document.body.appendChild(this.peekberryBubble);
  }

  /**
   * Toggle the chat panel visibility
   */
  private toggleChatPanel(): void {
    if (this.chatPanel) {
      this.hideChatPanel();
    } else {
      this.showChatPanel();
    }
  }

  /**
   * Show the chat panel
   */
  private showChatPanel(): void {
    if (this.chatPanel) return;

    this.chatPanel = document.createElement('div');
    this.chatPanel.className = this.CSS_CLASSES.CHAT_PANEL;
    this.chatPanel.innerHTML = `
      <div class="peekberry-chat-header">
        <div class="peekberry-chat-title">Peekberry AI</div>
        <button class="peekberry-close-btn" type="button">×</button>
      </div>
      <div class="peekberry-chat-content">
        <div class="peekberry-selected-elements">
          <div class="peekberry-elements-label">Selected Elements:</div>
          <div class="peekberry-elements-list"></div>
        </div>
        <div class="peekberry-chat-input-container">
          <textarea 
            class="peekberry-chat-input" 
            placeholder="Describe the changes you want to make..."
            rows="3"
          ></textarea>
          <div class="peekberry-chat-actions">
            <button class="peekberry-select-btn" type="button">Select Element</button>
            <button class="peekberry-screenshot-btn" type="button">📷</button>
            <button class="peekberry-apply-btn" type="button">Apply</button>
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    const closeBtn = this.chatPanel.querySelector('.peekberry-close-btn');
    closeBtn?.addEventListener('click', () => this.hideChatPanel());

    const selectBtn = this.chatPanel.querySelector('.peekberry-select-btn');
    selectBtn?.addEventListener('click', () => this.toggleElementSelection());

    const screenshotBtn = this.chatPanel.querySelector(
      '.peekberry-screenshot-btn'
    );
    screenshotBtn?.addEventListener('click', () => this.captureScreenshot());

    const applyBtn = this.chatPanel.querySelector('.peekberry-apply-btn');
    applyBtn?.addEventListener('click', () => this.processEditCommand());

    document.body.appendChild(this.chatPanel);
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
    if (this.isPeekberryElement(target)) return;

    if (this.highlightedElement && this.highlightedElement !== target) {
      this.removeHighlight(this.highlightedElement);
    }

    this.highlightElement(target);
    this.highlightedElement = target;
  };

  /**
   * Handle mouse out for element highlighting
   */
  private handleMouseOut = (e: MouseEvent): void => {
    if (!this.isElementSelectionActive) return;

    const target = e.target as HTMLElement;
    if (this.isPeekberryElement(target)) return;

    this.removeHighlight(target);
    if (this.highlightedElement === target) {
      this.highlightedElement = null;
    }
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
      element.classList.contains(this.CSS_CLASSES.CHAT_PANEL)
    );
  }

  /**
   * Highlight an element
   */
  private highlightElement(element: HTMLElement): void {
    element.classList.add(this.CSS_CLASSES.HIGHLIGHT);
  }

  /**
   * Remove highlight from an element
   */
  private removeHighlight(element: HTMLElement): void {
    element.classList.remove(this.CSS_CLASSES.HIGHLIGHT);
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
   * Get element context for AI processing
   */
  private getElementContext(element: HTMLElement): ElementContext {
    const rect = element.getBoundingClientRect();
    const computedStyles = window.getComputedStyle(element);

    return {
      selector: this.generateSelector(element),
      tagName: element.tagName.toLowerCase(),
      id: element.id || undefined,
      className: element.className || undefined,
      textContent: element.textContent?.trim() || undefined,
      computedStyles: {
        color: computedStyles.color,
        backgroundColor: computedStyles.backgroundColor,
        fontSize: computedStyles.fontSize,
        fontFamily: computedStyles.fontFamily,
        display: computedStyles.display,
        position: computedStyles.position,
      },
      boundingRect: rect,
    };
  }

  /**
   * Generate a unique selector for an element
   */
  private generateSelector(element: HTMLElement): string {
    if (element.id) {
      return `#${element.id}`;
    }

    const path: string[] = [];
    let current = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();

      if (current.className) {
        selector += `.${current.className.split(' ')[0]}`;
      }

      path.unshift(selector);
      current = current.parentElement!;
    }

    return path.join(' > ');
  }

  /**
   * Process edit command (placeholder for now)
   */
  private async processEditCommand(): Promise<void> {
    if (!this.chatPanel) return;

    const input = this.chatPanel.querySelector(
      '.peekberry-chat-input'
    ) as HTMLTextAreaElement;
    const command = input?.value.trim();

    if (!command || this.selectedElements.length === 0) {
      alert('Please select elements and enter a command');
      return;
    }

    console.log('Processing command:', command);
    console.log('Selected elements:', this.selectedElements.length);

    // This will be implemented in later tasks
    // For now, just clear the input
    if (input) {
      input.value = '';
    }
  }

  /**
   * Apply DOM mutation (placeholder for now)
   */
  private applyMutation(mutation: DOMMutation): void {
    console.log('Applying mutation:', mutation);
    // This will be implemented in later tasks
  }

  /**
   * Undo last edit (placeholder for now)
   */
  private undoLastEdit(): void {
    console.log('Undo last edit');
    // This will be implemented in later tasks
  }

  /**
   * Redo edit (placeholder for now)
   */
  private redoEdit(): void {
    console.log('Redo edit');
    // This will be implemented in later tasks
  }

  /**
   * Capture screenshot (placeholder for now)
   */
  private async captureScreenshot(): Promise<Blob | null> {
    console.log('Capturing screenshot');
    // This will be implemented in later tasks
    return null;
  }

  /**
   * Clean up on page unload
   */
  private cleanup(): void {
    this.stopElementSelection();
    if (this.peekberryBubble) {
      this.peekberryBubble.remove();
    }
    if (this.chatPanel) {
      this.chatPanel.remove();
    }
  }
}

// Initialize content script when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new PeekberryContentScript();
  });
} else {
  new PeekberryContentScript();
}
