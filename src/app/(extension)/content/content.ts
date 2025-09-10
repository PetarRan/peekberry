/**
 * Peekberry Chrome Extension Content Script
 * Handles DOM interaction, element selection, and UI injection
 */

import {
  PeekberryError,
  ERROR_CODES,
  logError,
  retryWithBackoff,
  safeAsyncOperation,
  getUserFriendlyMessage,
  createPeekberryError,
} from '../utils/errorHandling';
import {
  notifications,
  showError,
  showSuccess,
  showWarning,
  showAuthError,
  showRetryError,
} from '../utils/notifications';
import { integrationManager, withLoadingState } from '../utils/integration';
import {
  loadingIndicator,
  showLoading,
  hideLoading,
} from '../components/LoadingIndicator';
import {
  performanceManager,
  measurePerformance,
  optimizeForDevice,
} from '../utils/performance';
import {
  createStatusIndicator,
  showQuickStatus,
} from '../components/StatusIndicator';

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
  private maxHistorySize = 50; // Limit history size to prevent memory issues
  private peekberryBubble: HTMLElement | null = null;
  private chatPanel: HTMLElement | null = null;
  private highlightedElement: HTMLElement | null = null;
  private elementInfoTooltip: HTMLElement | null = null;
  private repositionTimeout: ReturnType<typeof setTimeout> | null = null;
  private statusIndicator: any = null;
  private tooltipThrottle: ReturnType<typeof setTimeout> | null = null;
  private mouseOverThrottle: ReturnType<typeof setTimeout> | null = null;

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
        this.disableElementSelection();
      } else {
        console.log('Peekberry: User authenticated, showing active bubble');
        this.createPeekberryBubble(true);
        this.enableElementSelection();
      }
    } catch (error) {
      console.error('Peekberry: Auth check failed:', error);
      console.log(
        'Peekberry: Showing bubble in unauthenticated state as fallback'
      );
      this.createPeekberryBubble(false);
      this.disableElementSelection();
    }

    // Initialize status indicator in development mode
    if (process.env.NODE_ENV === 'development') {
      this.statusIndicator = createStatusIndicator({
        position: 'top-left',
        showPerformance: true,
        autoHide: true,
        hideDelay: 10000,
      });
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
    return withLoadingState(
      'auth_check',
      async () => {
        const result = await safeAsyncOperation(
          () => integrationManager.sendMessage('GET_AUTH_STATUS'),
          {
            component: 'ContentScript',
            operation: 'checkAuthStatus',
            url: window.location.href,
            timestamp: new Date(),
          },
          { isAuthenticated: false } // fallback value
        );

        return result?.data || { isAuthenticated: false };
      },
      'Checking authentication'
    );
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
        this.enableElementSelection();
      } else {
        this.peekberryBubble.classList.add('peekberry-bubble-unauthenticated');
        this.peekberryBubble.setAttribute('title', 'Sign in to Peekberry');
        console.log('Peekberry: Bubble updated to unauthenticated state');
        this.disableElementSelection();
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

    // Clean up on page unload and session end
    window.addEventListener('beforeunload', () => {
      this.handleSessionEnd();
    });

    // Also handle page unload event
    window.addEventListener('unload', () => {
      this.handleSessionEnd();
    });

    // Clear edit history on navigation
    let currentUrl = window.location.href;
    const checkForNavigation = () => {
      if (window.location.href !== currentUrl) {
        const previousUrl = currentUrl;
        currentUrl = window.location.href;
        this.handlePageNavigation(previousUrl, currentUrl);
      }
    };

    // Check for navigation changes (for SPAs)
    setInterval(checkForNavigation, 1000);

    // Also listen for browser navigation events
    window.addEventListener('popstate', () => {
      setTimeout(checkForNavigation, 100); // Small delay to ensure URL is updated
    });

    // Listen for page visibility changes (tab switching, minimizing)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handlePageHidden();
      } else {
        this.handlePageVisible();
      }
    });

    // Add keyboard shortcuts for undo/redo
    document.addEventListener('keydown', (e) => {
      // Only handle shortcuts when Peekberry is active (chat panel open)
      if (!this.chatPanel) return;

      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.undoLastEdit();
      }

      // Ctrl+Shift+Z or Cmd+Shift+Z for redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        this.redoEdit();
      }

      // Ctrl+Alt+R or Cmd+Alt+R for restore all (emergency)
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'r') {
        e.preventDefault();
        if (
          confirm('Restore all Peekberry modifications? This cannot be undone.')
        ) {
          this.restoreAllModifications();
        }
      }
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
        this.captureScreenshot()
          .then((result) => {
            sendResponse({ success: true, data: result });
          })
          .catch((error) => {
            sendResponse({ success: false, error: error.message });
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
    showAuthError('Please sign in to Peekberry to start editing');
  }

  /**
   * Show notification to user (legacy method for compatibility)
   */
  private showNotification(
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info'
  ): void {
    switch (type) {
      case 'success':
        showSuccess(message);
        break;
      case 'error':
        showError(message);
        break;
      case 'warning':
        showWarning(message);
        break;
      case 'info':
      default:
        notifications.info(message);
        break;
    }
  }

  /**
   * Show element tooltip with information
   */
  private showElementTooltip(element: HTMLElement, event: MouseEvent): void {
    // Throttle tooltip creation to prevent memory leaks
    if (this.tooltipThrottle) {
      clearTimeout(this.tooltipThrottle);
    }

    this.tooltipThrottle = setTimeout(() => {
      // Remove existing tooltip
      this.hideElementTooltip();

      // Only create if still relevant
      if (
        !this.isElementSelectionActive ||
        this.highlightedElement !== element
      ) {
        return;
      }

      this.elementInfoTooltip = document.createElement('div');
      this.elementInfoTooltip.className = 'peekberry-element-info';
      this.elementInfoTooltip.setAttribute('data-peekberry-element', 'true');

      // Simplified content to reduce DOM complexity
      const displayName = this.getElementDisplayName(element);
      this.elementInfoTooltip.textContent = displayName;

      // Position with bounds checking
      const x = Math.min(event.clientX + 10, window.innerWidth - 200);
      const y = Math.max(event.clientY - 40, 10);

      this.elementInfoTooltip.style.left = `${x}px`;
      this.elementInfoTooltip.style.top = `${y}px`;

      document.body.appendChild(this.elementInfoTooltip);
    }, 150); // Throttle to prevent excessive DOM manipulation
  }

  /**
   * Hide element tooltip and clear throttle
   */
  private hideElementTooltip(): void {
    if (this.elementInfoTooltip) {
      this.elementInfoTooltip.remove();
      this.elementInfoTooltip = null;
    }
    if (this.tooltipThrottle) {
      clearTimeout(this.tooltipThrottle);
      this.tooltipThrottle = null;
    }
  }

  /**
   * Get display name for element
   */
  private getElementDisplayName(element: HTMLElement): string {
    const tagName = element.tagName.toLowerCase();

    if (element.id) {
      return `${tagName}#${element.id}`;
    }

    if (element.className && typeof element.className === 'string') {
      const classes = element.className
        .split(' ')
        .filter((c) => c.trim())
        .slice(0, 2);
      if (classes.length > 0) {
        return `${tagName}.${classes.join('.')}`;
      }
    }

    // For text content
    if (element.textContent && element.textContent.trim().length > 0) {
      const text = element.textContent.trim().substring(0, 20);
      return `${tagName} "${text}${text.length > 20 ? '...' : ''}"`;
    }

    return tagName;
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

    // Add event listeners
    this.setupChatPanelEventListeners();

    // Position and show panel
    this.positionChatPanel();
    document.body.appendChild(this.chatPanel);

    // Update selected elements display
    this.updateSelectedElementsDisplay();

    // Update undo/redo button states
    this.updateUndoRedoButtonStates();

    // Update apply button state
    this.updateApplyButtonState();
  }

  /**
   * Setup event listeners for chat panel
   */
  private setupChatPanelEventListeners(): void {
    if (!this.chatPanel) return;

    // Close button
    const closeBtn = this.chatPanel.querySelector('.peekberry-close-btn');
    closeBtn?.addEventListener('click', () => this.hideChatPanel());

    // Undo button
    const undoBtn = this.chatPanel.querySelector('.peekberry-undo-btn');
    undoBtn?.addEventListener('click', () => this.undoLastEdit());

    // Redo button
    const redoBtn = this.chatPanel.querySelector('.peekberry-redo-btn');
    redoBtn?.addEventListener('click', () => this.redoEdit());

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
      // Auto-resize textarea and update apply button
      input.addEventListener('input', () => {
        this.autoResizeTextarea(input);
        this.updateApplyButtonState();
      });

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
   * Enable element selection mode (always active when authenticated)
   */
  private enableElementSelection(): void {
    if (this.isElementSelectionActive) return;

    console.log('Peekberry: Enabling element selection for entire DOM');
    this.isElementSelectionActive = true;
    this.startElementSelection();

    // Show a brief notification
    showQuickStatus(
      'DOM selection enabled - hover and click elements to select',
      'success',
      3000
    );
  }

  /**
   * Disable element selection mode
   */
  private disableElementSelection(): void {
    if (!this.isElementSelectionActive) return;

    console.log('Peekberry: Disabling element selection');
    this.isElementSelectionActive = false;
    this.stopElementSelection();
  }

  /**
   * Toggle element selection mode (for manual control)
   */
  private toggleElementSelection(): void {
    if (this.isElementSelectionActive) {
      this.disableElementSelection();
    } else {
      this.enableElementSelection();
    }
  }

  /**
   * Start element selection mode
   */
  private startElementSelection(): void {
    // Use capture phase to ensure we get events before other handlers
    document.addEventListener('mouseover', this.handleMouseOver, {
      capture: true,
      passive: true,
    });
    document.addEventListener('mouseout', this.handleMouseOut, {
      capture: true,
      passive: true,
    });
    document.addEventListener('click', this.handleElementClick, {
      capture: true,
    });

    // Add subtle visual indicator that selection is active (no cursor change for better UX)
    document.documentElement.style.setProperty(
      '--peekberry-selection-active',
      '1'
    );

    console.log(
      'Peekberry: Element selection listeners attached to entire document'
    );
  }

  /**
   * Stop element selection mode
   */
  private stopElementSelection(): void {
    document.removeEventListener('mouseover', this.handleMouseOver, {
      capture: true,
    });
    document.removeEventListener('mouseout', this.handleMouseOut, {
      capture: true,
    });
    document.removeEventListener('click', this.handleElementClick, {
      capture: true,
    });

    // Remove visual indicator
    document.documentElement.style.removeProperty(
      '--peekberry-selection-active'
    );

    if (this.highlightedElement) {
      this.removeHighlight(this.highlightedElement);
      this.highlightedElement = null;
    }

    // Clean up tooltips and throttles to prevent memory leaks
    this.hideElementTooltip();

    if (this.mouseOverThrottle) {
      clearTimeout(this.mouseOverThrottle);
      this.mouseOverThrottle = null;
    }

    console.log(
      'Peekberry: Element selection listeners removed and cleaned up'
    );
  }

  /**
   * Handle mouse over for element highlighting
   */
  private handleMouseOver = (e: MouseEvent): void => {
    if (!this.isElementSelectionActive) return;

    const target = e.target as HTMLElement;

    // Skip Peekberry elements - this is crucial!
    if (this.isPeekberryElement(target)) {
      return;
    }

    // Skip non-visual elements but allow most DOM elements
    if (this.isNonSelectableElement(target)) {
      return;
    }

    // Find the most appropriate element for selection
    const selectableElement = this.findSelectableElement(target);
    if (!selectableElement) return;

    // Don't re-highlight the same element
    if (this.highlightedElement === selectableElement) return;

    // Remove previous highlight
    if (this.highlightedElement) {
      this.removeHighlight(this.highlightedElement);
    }

    // Add new highlight with dev-tools style
    this.highlightElement(selectableElement);
    this.highlightedElement = selectableElement;

    // Tooltip disabled temporarily to prevent memory leaks
    // this.showElementTooltip(selectableElement, e);
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

      // Hide tooltip
      this.hideElementTooltip();
    }, 50);
  };

  /**
   * Handle element click for selection
   */
  private handleElementClick = (e: MouseEvent): void => {
    if (!this.isElementSelectionActive) return;

    const target = e.target as HTMLElement;

    // IMPORTANT: Let Peekberry elements handle their own clicks!
    if (this.isPeekberryElement(target)) {
      console.log(
        'Peekberry: Ignoring click on Peekberry element:',
        target.className
      );
      return; // Don't prevent default, let the bubble/chat work normally
    }

    // Only prevent default for non-Peekberry elements
    e.preventDefault();
    e.stopPropagation();

    this.selectElement(target);

    // Show success feedback
    showQuickStatus(
      `Selected: ${this.getElementDisplayName(target)}`,
      'success',
      2000
    );

    // Keep selection mode active - don't toggle off!
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

    if (this.selectedElements.length === 0) {
      // Show helpful message when no elements are selected
      const helpMessage = document.createElement('div');
      helpMessage.className = 'peekberry-elements-help';
      helpMessage.innerHTML = `
        <div class="peekberry-help-text">
          ${
            this.isElementSelectionActive
              ? '🎯 Hover and click any element on the page to select it'
              : '⚠️ Element selection is disabled - please sign in'
          }
        </div>
      `;
      elementsList.appendChild(helpMessage);
    } else {
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
    if (index < 0 || index >= this.editHistory.length) {
      console.error('Invalid history entry index:', index);
      this.showNotification('Invalid history entry', 'error');
      return;
    }

    // Get the entry to revert to (remember history is displayed in reverse order)
    const reverseIndex = this.editHistory.length - 1 - index;
    const targetEntry = this.editHistory[reverseIndex];

    if (!targetEntry) {
      console.error('History entry not found at index:', reverseIndex);
      this.showNotification('History entry not found', 'error');
      return;
    }

    try {
      // Undo all edits after the target entry
      const editsToUndo = this.editHistory.slice(reverseIndex + 1);

      // Undo in reverse order
      for (let i = editsToUndo.length - 1; i >= 0; i--) {
        const edit = editsToUndo[i];
        const targetElement = this.findElementBySelector(
          edit.mutation.selector
        );

        if (targetElement && edit.undoable) {
          this.revertMutation(targetElement, edit.mutation);
        }
      }

      // Update history and redo stack
      const undoneEdits = this.editHistory.splice(reverseIndex + 1);
      this.redoStack = [...undoneEdits.reverse(), ...this.redoStack];

      // Limit redo stack size
      if (this.redoStack.length > this.maxHistorySize) {
        this.redoStack = this.redoStack.slice(0, this.maxHistorySize);
      }

      this.updateUndoRedoButtonStates();
      this.showNotification(`Reverted to history entry`, 'success');

      console.log('Reverted to history entry:', targetEntry);
    } catch (error) {
      console.error('Error reverting to history entry:', error);
      this.showNotification('Failed to revert to history entry', 'error');
    }
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
   * Process edit command with enhanced functionality and error handling
   */
  private async processEditCommand(): Promise<void> {
    if (!this.chatPanel) return;

    const input = this.chatPanel.querySelector(
      '.peekberry-chat-input'
    ) as HTMLTextAreaElement;
    const command = input?.value.trim();

    if (!command) {
      showWarning('Please enter a command to apply changes');
      return;
    }

    if (this.selectedElements.length === 0) {
      showWarning('Please select at least one element to modify');
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
      await withLoadingState(
        'process_edit_command',
        async () => {
          // Process each selected element with enhanced progress tracking
          let successCount = 0;
          let failureCount = 0;
          const totalElements = this.selectedElements.length;

          for (let i = 0; i < this.selectedElements.length; i++) {
            const element = this.selectedElements[i];
            const progress = ((i + 1) / totalElements) * 100;

            // Update progress
            integrationManager.updateLoadingProgress(
              'process_edit_command',
              progress
            );

            try {
              const elementContext = this.getElementContext(element);

              // Send command to background script for AI processing
              const response = await integrationManager.sendMessage(
                'PROCESS_EDIT_COMMAND',
                {
                  command,
                  context: elementContext,
                },
                {
                  showProgress: false, // We're handling progress manually
                  retryOnFailure: true,
                  timeout: 15000,
                }
              );

              if (response.success && response.data && response.data.mutation) {
                const mutation = response.data.mutation;

                // Apply the mutation with DOM batching for performance
                integrationManager.batchDOMOperations([
                  () => this.applyMutation(mutation),
                ]);

                // Add to history
                const editAction: EditAction = {
                  id:
                    Date.now().toString() +
                    Math.random().toString(36).substr(2, 9),
                  type: mutation.type,
                  element: elementContext,
                  mutation: mutation,
                  timestamp: new Date(),
                  undoable: true,
                };

                this.addToEditHistory(editAction);
                successCount++;

                console.log('Edit applied:', {
                  command,
                  element: elementContext.selector,
                  mutation,
                });
              } else {
                throw new PeekberryError(
                  response.error || 'Failed to process command',
                  ERROR_CODES.AI_PROCESSING_FAILED,
                  {
                    component: 'ContentScript',
                    operation: 'processEditCommand',
                    url: window.location.href,
                    timestamp: new Date(),
                  },
                  true // retryable
                );
              }
            } catch (elementError) {
              failureCount++;
              const peekberryError =
                elementError instanceof PeekberryError
                  ? elementError
                  : createPeekberryError(
                      elementError as Error,
                      ERROR_CODES.AI_PROCESSING_FAILED,
                      {
                        component: 'ContentScript',
                        operation: 'processEditCommand',
                        url: window.location.href,
                        timestamp: new Date(),
                      }
                    );

              logError(peekberryError);

              // Show specific error for single element
              if (this.selectedElements.length === 1) {
                showRetryError(getUserFriendlyMessage(peekberryError), () =>
                  this.processEditCommand()
                );
                return;
              }
            }
          }

          // Clear input and show results
          input.value = '';
          this.autoResizeTextarea(input);

          if (successCount > 0 && failureCount === 0) {
            showSuccess(`Changes applied to ${successCount} element(s)`);
          } else if (successCount > 0 && failureCount > 0) {
            showWarning(
              `Changes applied to ${successCount} element(s), ${failureCount} failed`
            );
          } else {
            showError('Failed to apply changes to any elements');
          }

          // Update the selected elements display
          this.updateSelectedElementsDisplay();
        },
        `Processing ${this.selectedElements.length} element(s)`
      );
    } catch (error) {
      const peekberryError =
        error instanceof PeekberryError
          ? error
          : createPeekberryError(
              error as Error,
              ERROR_CODES.AI_PROCESSING_FAILED,
              {
                component: 'ContentScript',
                operation: 'processEditCommand',
                url: window.location.href,
                timestamp: new Date(),
              }
            );

      logError(peekberryError);

      // Show retry option for recoverable errors
      if (peekberryError.isRetryable) {
        showRetryError(getUserFriendlyMessage(peekberryError), () =>
          this.processEditCommand()
        );
      } else {
        showError(getUserFriendlyMessage(peekberryError));
      }
    } finally {
      // Restore button state
      applyBtn.textContent = originalText;
      applyBtn.disabled = false;
    }
  }

  /**
   * Send message to background script with error handling
   */
  private async sendMessageToBackground(message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!chrome?.runtime) {
        reject(
          new PeekberryError(
            'Chrome extension runtime not available',
            ERROR_CODES.EXTENSION_NOT_AVAILABLE,
            {
              component: 'ContentScript',
              operation: 'sendMessageToBackground',
              url: window.location.href,
              timestamp: new Date(),
            }
          )
        );
        return;
      }

      const timeout = setTimeout(() => {
        reject(
          new PeekberryError(
            'Background script communication timeout',
            ERROR_CODES.API_TIMEOUT,
            {
              component: 'ContentScript',
              operation: 'sendMessageToBackground',
              url: window.location.href,
              timestamp: new Date(),
            },
            true // retryable
          )
        );
      }, 10000); // 10 second timeout

      chrome.runtime.sendMessage(message, (response) => {
        clearTimeout(timeout);

        if (chrome.runtime.lastError) {
          reject(
            createPeekberryError(
              new Error(chrome.runtime.lastError.message || 'Runtime error'),
              ERROR_CODES.BACKGROUND_SCRIPT_ERROR,
              {
                component: 'ContentScript',
                operation: 'sendMessageToBackground',
                url: window.location.href,
                timestamp: new Date(),
              },
              true // retryable
            )
          );
        } else {
          resolve(
            response || {
              success: false,
              error: 'No response from background script',
            }
          );
        }
      });
    });
  }

  /**
   * Apply DOM mutation (placeholder for now)
   */
  /**
   * Capture screenshot with metadata and upload
   */
  private async captureScreenshot(): Promise<Blob | null> {
    try {
      return await withLoadingState(
        'capture_screenshot',
        async () => {
          // Prepare screenshot metadata
          const metadata = {
            pageUrl: window.location.href,
            pageTitle: document.title,
            editCount: this.editHistory.length,
            dimensions: {
              width: window.innerWidth,
              height: window.innerHeight,
            },
          };

          // Send message to background script to capture screenshot
          const response = await integrationManager.sendMessage(
            'CAPTURE_SCREENSHOT',
            metadata,
            {
              showProgress: true,
              retryOnFailure: true,
              timeout: 20000, // Screenshots can take longer
            }
          );

          if (response.success && response.data) {
            showSuccess('Screenshot captured and saved to your dashboard!');

            // Optionally show a preview notification
            this.showScreenshotPreview(response.data);

            return response.data;
          } else {
            throw new PeekberryError(
              response.error || 'Failed to capture screenshot',
              ERROR_CODES.SCREENSHOT_CAPTURE_FAILED,
              {
                component: 'ContentScript',
                operation: 'captureScreenshot',
                url: window.location.href,
                timestamp: new Date(),
              },
              true // retryable
            );
          }
        },
        'Capturing and uploading screenshot'
      );
    } catch (error) {
      const peekberryError =
        error instanceof PeekberryError
          ? error
          : createPeekberryError(
              error as Error,
              ERROR_CODES.SCREENSHOT_CAPTURE_FAILED,
              {
                component: 'ContentScript',
                operation: 'captureScreenshot',
                url: window.location.href,
                timestamp: new Date(),
              }
            );

      logError(peekberryError);

      // Check for specific error types
      if (peekberryError.message.includes('permission')) {
        showError(
          'Screenshot permission denied. Please allow screenshot access in your browser settings.'
        );
      } else if (peekberryError.isRetryable) {
        showRetryError(
          'Failed to capture screenshot. Would you like to try again?',
          () => this.captureScreenshot()
        );
      } else {
        showError('Unable to capture screenshot. Please try again later.');
      }

      return null;
    }
  }

  /**
   * Show screenshot preview notification
   */
  private showScreenshotPreview(screenshotData: any): void {
    if (screenshotData.url) {
      notifications.show({
        type: 'success',
        message: 'Screenshot saved successfully!',
        duration: 5000,
        actionLabel: 'View Dashboard',
        onAction: () => {
          // Open dashboard in new tab
          if (chrome?.tabs) {
            chrome.tabs.create({
              url: screenshotData.dashboardUrl || '/dashboard',
              active: false,
            });
          }
        },
      });
    }
  }

  /**
   * Apply DOM mutation safely to preserve original page functionality
   */
  private applyMutation(mutation: DOMMutation): void {
    measurePerformance('applyMutation', () => {
      const context = {
        component: 'ContentScript',
        operation: 'applyMutation',
        url: window.location.href,
        timestamp: new Date(),
      };

      try {
        console.log('Applying mutation:', mutation);

        // Validate mutation before applying
        if (!this.validateMutation(mutation)) {
          const error = new PeekberryError(
            'Mutation validation failed',
            ERROR_CODES.DOM_MUTATION_FAILED,
            context
          );
          logError(error);
          showError('Cannot apply unsafe changes to this element');
          return;
        }

        // Find the target element using the selector
        const targetElement = this.findElementBySelector(mutation.selector);

        if (!targetElement) {
          const error = new PeekberryError(
            `Target element not found for selector: ${mutation.selector}`,
            ERROR_CODES.DOM_ELEMENT_NOT_FOUND,
            context
          );
          logError(error);
          showError(
            'Selected element is no longer available. Please select a new element.'
          );
          return;
        }

        // Verify this is not a Peekberry element
        if (this.isPeekberryElement(targetElement)) {
          console.warn('Attempted to modify Peekberry element, skipping');
          return;
        }

        // Capture current state before applying mutation for undo functionality
        if (!mutation.previousValue) {
          mutation.previousValue = this.captureElementState(
            targetElement,
            mutation
          );
        }

        // Use performance-optimized DOM operations
        performanceManager.batchDOMOperations([
          () => {
            // Apply the mutation based on type
            switch (mutation.type) {
              case 'style':
                this.applyStyleMutation(targetElement, mutation);
                break;
              case 'attribute':
                this.applyAttributeMutation(targetElement, mutation);
                break;
              case 'content':
                this.applyContentMutation(targetElement, mutation);
                break;
              default:
                const error = new PeekberryError(
                  `Unknown mutation type: ${mutation.type}`,
                  ERROR_CODES.DOM_MUTATION_FAILED,
                  context
                );
                logError(error);
                showError('Unable to apply this type of change');
                return;
            }

            // Mark element as modified by Peekberry for tracking
            this.markElementAsModified(targetElement);
          },
        ]);

        // Show success feedback (optimized for device)
        optimizeForDevice(
          () => showSuccess('Applied'), // Mobile: shorter message
          () => showSuccess('Changes applied successfully') // Desktop: full message
        );
      } catch (error) {
        const peekberryError = createPeekberryError(
          error as Error,
          ERROR_CODES.DOM_MUTATION_FAILED,
          context
        );
        logError(peekberryError);
        performanceManager.recordError(peekberryError.message, 'applyMutation');
        showError('Failed to apply changes to the selected element');
      }
    });
  }

  /**
   * Apply style mutation to element
   */
  private applyStyleMutation(
    element: HTMLElement,
    mutation: DOMMutation
  ): void {
    try {
      // Store original value if not already stored
      if (
        !element.hasAttribute('data-peekberry-original-' + mutation.property)
      ) {
        const originalValue =
          window
            .getComputedStyle(element)
            .getPropertyValue(mutation.property) || '';
        element.setAttribute(
          'data-peekberry-original-' + mutation.property,
          originalValue
        );
      }

      // Apply the new style
      (element.style as any)[mutation.property] = mutation.value;

      console.log(
        `Applied style: ${mutation.property} = ${mutation.value} to`,
        element
      );
    } catch (error) {
      console.error('Error applying style mutation:', error);
      throw error;
    }
  }

  /**
   * Apply attribute mutation to element
   */
  private applyAttributeMutation(
    element: HTMLElement,
    mutation: DOMMutation
  ): void {
    try {
      // Store original value if not already stored
      const originalAttrName =
        'data-peekberry-original-attr-' + mutation.property;
      if (!element.hasAttribute(originalAttrName)) {
        const originalValue = element.getAttribute(mutation.property) || '';
        element.setAttribute(originalAttrName, originalValue);
      }

      // Apply the new attribute value
      if (mutation.value === null || mutation.value === '') {
        element.removeAttribute(mutation.property);
      } else {
        element.setAttribute(mutation.property, mutation.value);
      }

      console.log(
        `Applied attribute: ${mutation.property} = ${mutation.value} to`,
        element
      );
    } catch (error) {
      console.error('Error applying attribute mutation:', error);
      throw error;
    }
  }

  /**
   * Apply content mutation to element
   */
  private applyContentMutation(
    element: HTMLElement,
    mutation: DOMMutation
  ): void {
    try {
      // Store original content if not already stored
      if (!element.hasAttribute('data-peekberry-original-content')) {
        const originalContent = element.textContent || '';
        element.setAttribute(
          'data-peekberry-original-content',
          originalContent
        );
      }

      // Apply the new content based on property type
      switch (mutation.property) {
        case 'textContent':
          element.textContent = mutation.value;
          break;
        case 'innerHTML':
          // Be careful with innerHTML for security
          if (this.isSafeHTML(mutation.value)) {
            element.innerHTML = mutation.value;
          } else {
            console.warn('Unsafe HTML detected, using textContent instead');
            element.textContent = mutation.value;
          }
          break;
        default:
          element.textContent = mutation.value;
      }

      console.log(
        `Applied content: ${mutation.property} = ${mutation.value} to`,
        element
      );
    } catch (error) {
      console.error('Error applying content mutation:', error);
      throw error;
    }
  }

  /**
   * Find element by selector with fallback strategies
   */
  private findElementBySelector(selector: string): HTMLElement | null {
    try {
      // Try direct selector first
      let element = document.querySelector(selector) as HTMLElement;

      if (element) {
        return element;
      }

      // If direct selector fails, try to find by ID or class as fallback
      if (selector.includes('#')) {
        const id = selector.split('#')[1]?.split(/[\s.>+~]/)[0];
        if (id) {
          element = document.getElementById(id) as HTMLElement;
          if (element) return element;
        }
      }

      if (selector.includes('.')) {
        const className = selector.split('.')[1]?.split(/[\s#>+~]/)[0];
        if (className) {
          element = document.querySelector(`.${className}`) as HTMLElement;
          if (element) return element;
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding element by selector:', selector, error);
      return null;
    }
  }

  /**
   * Mark element as modified by Peekberry for tracking
   */
  private markElementAsModified(element: HTMLElement): void {
    element.setAttribute('data-peekberry-modified', 'true');
    element.setAttribute(
      'data-peekberry-modified-at',
      new Date().toISOString()
    );
  }

  /**
   * Check if HTML content is safe to insert
   */
  private isSafeHTML(html: string): boolean {
    // Basic safety check - reject script tags and event handlers
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i, // event handlers like onclick, onload, etc.
      /<iframe/i,
      /<object/i,
      /<embed/i,
    ];

    return !dangerousPatterns.some((pattern) => pattern.test(html));
  }

  /**
   * Validate that mutation is safe and scoped properly
   */
  private validateMutation(mutation: DOMMutation): boolean {
    // Check if selector is valid
    try {
      document.querySelector(mutation.selector);
    } catch (error) {
      console.error('Invalid selector in mutation:', mutation.selector);
      return false;
    }

    // Ensure we're not targeting critical page elements
    const criticalSelectors = [
      'html',
      'head',
      'body',
      'script',
      'style',
      'meta',
      'link[rel="stylesheet"]',
    ];

    const isCritical = criticalSelectors.some((selector) => {
      try {
        return (
          document.querySelector(selector) ===
          document.querySelector(mutation.selector)
        );
      } catch {
        return false;
      }
    });

    if (isCritical) {
      console.error(
        'Attempted to modify critical page element:',
        mutation.selector
      );
      return false;
    }

    // Validate mutation values
    if (mutation.type === 'content' && mutation.property === 'innerHTML') {
      if (!this.isSafeHTML(mutation.value)) {
        console.error('Unsafe HTML content in mutation');
        return false;
      }
    }

    return true;
  }

  /**
   * Get all elements currently modified by Peekberry
   */
  private getModifiedElements(): HTMLElement[] {
    return Array.from(
      document.querySelectorAll('[data-peekberry-modified="true"]')
    ) as HTMLElement[];
  }

  /**
   * Restore all Peekberry modifications (emergency cleanup)
   */
  private restoreAllModifications(): void {
    const modifiedElements = this.getModifiedElements();

    modifiedElements.forEach((element) => {
      try {
        // Restore all style properties
        const styleAttrs = Array.from(element.attributes).filter(
          (attr) =>
            attr.name.startsWith('data-peekberry-original-') &&
            !attr.name.includes('-attr-')
        );

        styleAttrs.forEach((attr) => {
          const property = attr.name.replace('data-peekberry-original-', '');
          const originalValue = attr.value;

          if (originalValue === '' || originalValue === 'initial') {
            (element.style as any)[property] = '';
          } else {
            (element.style as any)[property] = originalValue;
          }

          element.removeAttribute(attr.name);
        });

        // Restore all attributes
        const attrAttrs = Array.from(element.attributes).filter((attr) =>
          attr.name.startsWith('data-peekberry-original-attr-')
        );

        attrAttrs.forEach((attr) => {
          const property = attr.name.replace(
            'data-peekberry-original-attr-',
            ''
          );
          const originalValue = attr.value;

          if (originalValue === '') {
            element.removeAttribute(property);
          } else {
            element.setAttribute(property, originalValue);
          }

          element.removeAttribute(attr.name);
        });

        // Restore content
        const originalContent = element.getAttribute(
          'data-peekberry-original-content'
        );
        if (originalContent !== null) {
          element.textContent = originalContent;
          element.removeAttribute('data-peekberry-original-content');
        }

        // Remove Peekberry tracking attributes
        element.removeAttribute('data-peekberry-modified');
        element.removeAttribute('data-peekberry-modified-at');
      } catch (error) {
        console.error('Error restoring element:', element, error);
      }
    });

    // Clear history
    this.clearEditHistory();

    console.log(`Restored ${modifiedElements.length} modified elements`);
    this.showNotification(
      `Restored ${modifiedElements.length} modifications`,
      'success'
    );
  }

  /**
   * Undo last edit by reverting DOM mutations
   */
  private undoLastEdit(): void {
    if (this.editHistory.length === 0) {
      this.showNotification('No edits to undo', 'warning');
      this.updateUndoRedoButtonStates();
      return;
    }

    const lastEdit = this.editHistory.pop();
    if (!lastEdit || !lastEdit.undoable) {
      this.showNotification('Cannot undo this edit', 'warning');
      // Put the edit back if it's not undoable
      if (lastEdit) {
        this.editHistory.push(lastEdit);
      }
      this.updateUndoRedoButtonStates();
      return;
    }

    try {
      // Find the target element
      const targetElement = this.findElementBySelector(
        lastEdit.mutation.selector
      );

      if (!targetElement) {
        console.error('Cannot undo: target element not found');
        this.showNotification('Cannot undo: element no longer exists', 'error');

        // Remove this edit from history since element no longer exists
        // Don't add to redo stack since it can't be redone either
        this.cleanupInvalidHistoryEntries();
        this.updateUndoRedoButtonStates();
        return;
      }

      // Store current state before reverting for potential redo
      const currentState = this.captureElementState(
        targetElement,
        lastEdit.mutation
      );

      // Revert the mutation
      this.revertMutation(targetElement, lastEdit.mutation);

      // Update the edit with current state for redo
      lastEdit.mutation.previousValue = currentState;

      // Add to redo stack with size limit
      this.addToRedoStack(lastEdit);

      console.log('Undid edit:', lastEdit);
      this.showNotification('Edit undone', 'success');
      this.updateUndoRedoButtonStates();
    } catch (error) {
      console.error('Error undoing edit:', error);
      this.showNotification('Failed to undo edit', 'error');
      // Put the edit back in history if undo failed
      this.editHistory.push(lastEdit);
      this.updateUndoRedoButtonStates();
    }
  }

  /**
   * Redo previously undone edit
   */
  private redoEdit(): void {
    if (this.redoStack.length === 0) {
      this.showNotification('No edits to redo', 'warning');
      this.updateUndoRedoButtonStates();
      return;
    }

    const editToRedo = this.redoStack.pop();
    if (!editToRedo) {
      this.updateUndoRedoButtonStates();
      return;
    }

    try {
      // Find the target element to ensure it still exists
      const targetElement = this.findElementBySelector(
        editToRedo.mutation.selector
      );

      if (!targetElement) {
        console.error('Cannot redo: target element not found');
        this.showNotification('Cannot redo: element no longer exists', 'error');

        // Remove this edit from redo stack since element no longer exists
        this.cleanupInvalidRedoEntries();
        this.updateUndoRedoButtonStates();
        return;
      }

      // Reapply the mutation
      this.applyMutation(editToRedo.mutation);

      // Add back to history with size limit
      this.addToEditHistory(editToRedo);

      console.log('Redid edit:', editToRedo);
      this.showNotification('Edit redone', 'success');
      this.updateUndoRedoButtonStates();
    } catch (error) {
      console.error('Error redoing edit:', error);
      this.showNotification('Failed to redo edit', 'error');
      // Put the edit back in redo stack if redo failed
      this.redoStack.push(editToRedo);
      this.updateUndoRedoButtonStates();
    }
  }

  /**
   * Revert a mutation by restoring original values
   */
  private revertMutation(element: HTMLElement, mutation: DOMMutation): void {
    try {
      switch (mutation.type) {
        case 'style':
          this.revertStyleMutation(element, mutation);
          break;
        case 'attribute':
          this.revertAttributeMutation(element, mutation);
          break;
        case 'content':
          this.revertContentMutation(element, mutation);
          break;
        default:
          console.error('Unknown mutation type for revert:', mutation.type);
      }
    } catch (error) {
      console.error('Error reverting mutation:', error);
      throw error;
    }
  }

  /**
   * Revert style mutation
   */
  private revertStyleMutation(
    element: HTMLElement,
    mutation: DOMMutation
  ): void {
    const originalAttrName = 'data-peekberry-original-' + mutation.property;
    const originalValue = element.getAttribute(originalAttrName);

    if (originalValue !== null) {
      if (originalValue === '' || originalValue === 'initial') {
        // Remove the style property to restore original
        (element.style as any)[mutation.property] = '';
      } else {
        // Restore original value
        (element.style as any)[mutation.property] = originalValue;
      }

      // Remove the tracking attribute
      element.removeAttribute(originalAttrName);
    } else {
      // Fallback: use the previousValue from mutation
      if (mutation.previousValue && mutation.previousValue !== 'initial') {
        (element.style as any)[mutation.property] = mutation.previousValue;
      } else {
        (element.style as any)[mutation.property] = '';
      }
    }

    console.log(`Reverted style: ${mutation.property} on`, element);
  }

  /**
   * Revert attribute mutation
   */
  private revertAttributeMutation(
    element: HTMLElement,
    mutation: DOMMutation
  ): void {
    const originalAttrName =
      'data-peekberry-original-attr-' + mutation.property;
    const originalValue = element.getAttribute(originalAttrName);

    if (originalValue !== null) {
      if (originalValue === '') {
        element.removeAttribute(mutation.property);
      } else {
        element.setAttribute(mutation.property, originalValue);
      }

      // Remove the tracking attribute
      element.removeAttribute(originalAttrName);
    } else {
      // Fallback: use the previousValue from mutation
      if (mutation.previousValue) {
        element.setAttribute(mutation.property, mutation.previousValue);
      } else {
        element.removeAttribute(mutation.property);
      }
    }

    console.log(`Reverted attribute: ${mutation.property} on`, element);
  }

  /**
   * Revert content mutation
   */
  private revertContentMutation(
    element: HTMLElement,
    mutation: DOMMutation
  ): void {
    const originalContent = element.getAttribute(
      'data-peekberry-original-content'
    );

    if (originalContent !== null) {
      element.textContent = originalContent;
      element.removeAttribute('data-peekberry-original-content');
    } else {
      // Fallback: use the previousValue from mutation
      if (mutation.previousValue !== undefined) {
        element.textContent = mutation.previousValue;
      }
    }

    console.log(`Reverted content on`, element);
  }

  /**
   * Add edit to history with size management
   */
  private addToEditHistory(editAction: EditAction): void {
    // Clear redo stack when new edit is added (standard undo/redo behavior)
    this.redoStack = [];

    // Add to history
    this.editHistory.push(editAction);

    // Maintain history size limit
    if (this.editHistory.length > this.maxHistorySize) {
      const removedEdit = this.editHistory.shift();
      if (removedEdit) {
        console.log('Removed oldest edit from history due to size limit');
      }
    }

    this.updateUndoRedoButtonStates();
  }

  /**
   * Add edit to redo stack with size management
   */
  private addToRedoStack(editAction: EditAction): void {
    this.redoStack.push(editAction);

    // Maintain redo stack size limit
    if (this.redoStack.length > this.maxHistorySize) {
      this.redoStack.shift();
    }

    this.updateUndoRedoButtonStates();
  }

  /**
   * Capture current element state for undo/redo operations
   */
  private captureElementState(
    element: HTMLElement,
    mutation: DOMMutation
  ): string {
    switch (mutation.type) {
      case 'style':
        return (
          window
            .getComputedStyle(element)
            .getPropertyValue(mutation.property) || ''
        );
      case 'attribute':
        return element.getAttribute(mutation.property) || '';
      case 'content':
        return element.textContent || '';
      default:
        return '';
    }
  }

  /**
   * Clean up invalid history entries (elements that no longer exist)
   */
  private cleanupInvalidHistoryEntries(): void {
    const validHistory = this.editHistory.filter((edit) => {
      const element = this.findElementBySelector(edit.mutation.selector);
      return element !== null;
    });

    const removedCount = this.editHistory.length - validHistory.length;
    if (removedCount > 0) {
      console.log(`Cleaned up ${removedCount} invalid history entries`);
      this.editHistory = validHistory;
    }
  }

  /**
   * Clean up invalid redo entries (elements that no longer exist)
   */
  private cleanupInvalidRedoEntries(): void {
    const validRedo = this.redoStack.filter((edit) => {
      const element = this.findElementBySelector(edit.mutation.selector);
      return element !== null;
    });

    const removedCount = this.redoStack.length - validRedo.length;
    if (removedCount > 0) {
      console.log(`Cleaned up ${removedCount} invalid redo entries`);
      this.redoStack = validRedo;
    }
  }

  /**
   * Update undo/redo button states in the UI
   */
  private updateUndoRedoButtonStates(): void {
    if (!this.chatPanel) return;

    const undoBtn = this.chatPanel.querySelector(
      '.peekberry-undo-btn'
    ) as HTMLButtonElement;
    const redoBtn = this.chatPanel.querySelector(
      '.peekberry-redo-btn'
    ) as HTMLButtonElement;

    if (undoBtn) {
      const canUndo =
        this.editHistory.length > 0 &&
        this.editHistory.some((edit) => edit.undoable);
      undoBtn.disabled = !canUndo;
      undoBtn.style.opacity = canUndo ? '1' : '0.5';
      undoBtn.title = canUndo
        ? `Undo (Ctrl+Z) - ${this.editHistory.length} edits`
        : 'No edits to undo';
    }

    if (redoBtn) {
      const canRedo = this.redoStack.length > 0;
      redoBtn.disabled = !canRedo;
      redoBtn.style.opacity = canRedo ? '1' : '0.5';
      redoBtn.title = canRedo
        ? `Redo (Ctrl+Shift+Z) - ${this.redoStack.length} edits`
        : 'No edits to redo';
    }
  }

  /**
   * Update apply button state based on selected elements and input
   */
  private updateApplyButtonState(): void {
    if (!this.chatPanel) return;

    const applyBtn = this.chatPanel.querySelector(
      '.peekberry-apply-btn'
    ) as HTMLButtonElement;
    const input = this.chatPanel.querySelector(
      '.peekberry-chat-input'
    ) as HTMLTextAreaElement;

    if (applyBtn) {
      const hasElements = this.selectedElements.length > 0;
      const hasInput = input && input.value.trim().length > 0;
      const isAuthenticated = this.isElementSelectionActive; // Selection is only active when authenticated

      applyBtn.disabled = !hasElements || !hasInput || !isAuthenticated;

      // Update button text based on state
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
   * Get edit history summary for debugging
   */
  private getEditHistorySummary(): {
    historyCount: number;
    redoCount: number;
    canUndo: boolean;
    canRedo: boolean;
    totalModifiedElements: number;
  } {
    const modifiedElements = this.getModifiedElements();

    return {
      historyCount: this.editHistory.length,
      redoCount: this.redoStack.length,
      canUndo:
        this.editHistory.length > 0 &&
        this.editHistory.some((edit) => edit.undoable),
      canRedo: this.redoStack.length > 0,
      totalModifiedElements: modifiedElements.length,
    };
  }

  /**
   * Validate edit history integrity
   */
  private validateEditHistoryIntegrity(): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check for duplicate IDs
    const ids = this.editHistory.map((edit) => edit.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      issues.push('Duplicate edit IDs found in history');
    }

    // Check for invalid selectors
    let invalidSelectors = 0;
    this.editHistory.forEach((edit) => {
      try {
        document.querySelector(edit.mutation.selector);
      } catch (error) {
        invalidSelectors++;
      }
    });

    if (invalidSelectors > 0) {
      issues.push(`${invalidSelectors} edits have invalid selectors`);
    }

    // Check history size limits
    if (this.editHistory.length > this.maxHistorySize) {
      issues.push(
        `History size (${this.editHistory.length}) exceeds limit (${this.maxHistorySize})`
      );
    }

    if (this.redoStack.length > this.maxHistorySize) {
      issues.push(
        `Redo stack size (${this.redoStack.length}) exceeds limit (${this.maxHistorySize})`
      );
    }

    // Check for chronological order
    for (let i = 1; i < this.editHistory.length; i++) {
      if (this.editHistory[i].timestamp < this.editHistory[i - 1].timestamp) {
        issues.push('Edit history is not in chronological order');
        break;
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Repair edit history by removing invalid entries
   */
  private repairEditHistory(): { repaired: boolean; removedCount: number } {
    const originalHistoryLength = this.editHistory.length;
    const originalRedoLength = this.redoStack.length;

    // Remove edits with invalid selectors
    this.cleanupInvalidHistoryEntries();
    this.cleanupInvalidRedoEntries();

    // Ensure size limits
    if (this.editHistory.length > this.maxHistorySize) {
      this.editHistory = this.editHistory.slice(-this.maxHistorySize);
    }

    if (this.redoStack.length > this.maxHistorySize) {
      this.redoStack = this.redoStack.slice(0, this.maxHistorySize);
    }

    // Sort history by timestamp to ensure chronological order
    this.editHistory.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    const removedCount =
      originalHistoryLength -
      this.editHistory.length +
      (originalRedoLength - this.redoStack.length);

    this.updateUndoRedoButtonStates();

    return {
      repaired: removedCount > 0,
      removedCount,
    };
  }

  /**
   * Clear edit history and redo stack (called on navigation)
   */
  private clearEditHistory(): void {
    this.editHistory = [];
    this.redoStack = [];
    this.updateUndoRedoButtonStates();
    console.log('Edit history cleared');
  }

  /**
   * Handle page navigation - clear edit history and reset state
   */
  private handlePageNavigation(previousUrl: string, currentUrl: string): void {
    console.log(`Navigation detected: ${previousUrl} -> ${currentUrl}`);

    // Clear edit history as per requirement 4.6
    this.clearEditHistory();

    // Reset selected elements
    this.selectedElements.forEach((el) => {
      el.classList.remove(this.CSS_CLASSES.SELECTED);
    });
    this.selectedElements = [];

    // Close chat panel if open
    if (this.chatPanel) {
      this.hideChatPanel();
    }

    // Stop element selection if active
    if (this.isElementSelectionActive) {
      this.stopElementSelection();
    }

    console.log('Page navigation handled - edit session cleared');
  }

  /**
   * Handle page becoming hidden (tab switch, minimize)
   */
  private handlePageHidden(): void {
    // Optionally pause any ongoing operations
    console.log('Page hidden - pausing operations');
  }

  /**
   * Handle page becoming visible again
   */
  private handlePageVisible(): void {
    // Refresh UI state and check for any issues
    console.log('Page visible - resuming operations');

    // Cleanup any invalid history entries
    this.cleanupInvalidHistoryEntries();
    this.cleanupInvalidRedoEntries();
    this.updateUndoRedoButtonStates();
  }

  /**
   * Handle browser session end (beforeunload)
   */
  private handleSessionEnd(): void {
    console.log('Browser session ending - clearing edit history');

    // Clear edit history as per requirement 4.4
    this.clearEditHistory();

    // Perform cleanup
    this.cleanup();
  }

  /**
   * Clean up on page unload
   */
  private cleanup(): void {
    this.stopElementSelection();
    this.removeAllHighlights();
    this.hideElementInfoTooltip();

    // Clear ALL pending timeouts to prevent memory leaks
    if (this.repositionTimeout) {
      clearTimeout(this.repositionTimeout);
      this.repositionTimeout = null;
    }

    if (this.tooltipThrottle) {
      clearTimeout(this.tooltipThrottle);
      this.tooltipThrottle = null;
    }

    if (this.mouseOverThrottle) {
      clearTimeout(this.mouseOverThrottle);
      this.mouseOverThrottle = null;
    }

    // Clean up performance manager
    if (typeof performanceManager !== 'undefined') {
      performanceManager.cleanup();
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
  getEditHistory: () => {
    if (peekberryInstance) {
      const summary = (peekberryInstance as any).getEditHistorySummary();
      console.log('Peekberry: Edit history summary:', summary);
      return summary;
    }
  },
  clearHistory: () => {
    if (peekberryInstance) {
      (peekberryInstance as any).clearEditHistory();
      console.log('Peekberry: Edit history cleared manually');
    }
  },
  testUndo: () => {
    if (peekberryInstance) {
      (peekberryInstance as any).undoLastEdit();
    }
  },
  testRedo: () => {
    if (peekberryInstance) {
      (peekberryInstance as any).redoEdit();
    }
  },
  validateHistory: () => {
    if (peekberryInstance) {
      const validation = (
        peekberryInstance as any
      ).validateEditHistoryIntegrity();
      console.log('Peekberry: History validation:', validation);
      return validation;
    }
  },
  repairHistory: () => {
    if (peekberryInstance) {
      const result = (peekberryInstance as any).repairEditHistory();
      console.log('Peekberry: History repair result:', result);
      return result;
    }
  },
};
