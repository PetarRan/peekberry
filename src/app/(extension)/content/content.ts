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
  private createPeekberryBubble(): void {
    if (this.peekberryBubble) {
      this.peekberryBubble.remove();
    }

    this.peekberryBubble = document.createElement('div');
    this.peekberryBubble.className = this.CSS_CLASSES.BUBBLE;
    this.peekberryBubble.setAttribute('data-peekberry-element', 'true');
    this.peekberryBubble.setAttribute('title', 'Open Peekberry AI Editor');

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
      this.toggleChatPanel();
    });

    // Add keyboard accessibility
    this.peekberryBubble.setAttribute('tabindex', '0');
    this.peekberryBubble.setAttribute('role', 'button');
    this.peekberryBubble.setAttribute('aria-label', 'Open Peekberry AI Editor');

    this.peekberryBubble.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        this.toggleChatPanel();
      }
    });

    // Ensure bubble stays on top and doesn't interfere with page
    this.positionBubbleSafely();

    document.body.appendChild(this.peekberryBubble);
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
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new PeekberryContentScript();
  });
} else {
  new PeekberryContentScript();
}
