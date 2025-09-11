/**
 * Event Manager
 * Handles all event listeners and message passing
 */

import { ElementSelectionManager } from './ElementSelectionManager';
import { UIManager } from './UIManager';
import { EditHistoryManager } from './EditHistoryManager';
import { MutationManager } from './MutationManager';
import { integrationManager, withLoadingState } from '../../utils/integration';
import { showSuccess, showError, showWarning } from '../../utils/notifications';

export class EventManager {
  private elementSelectionManager: ElementSelectionManager;
  private uiManager: UIManager;
  private editHistoryManager: EditHistoryManager;
  private mutationManager: MutationManager;
  private currentUrl: string;

  constructor(
    elementSelectionManager: ElementSelectionManager,
    uiManager: UIManager,
    editHistoryManager: EditHistoryManager,
    mutationManager: MutationManager
  ) {
    this.elementSelectionManager = elementSelectionManager;
    this.uiManager = uiManager;
    this.editHistoryManager = editHistoryManager;
    this.mutationManager = mutationManager;
    this.currentUrl = window.location.href;

    this.setupEventListeners();
  }

  /**
   * Setup all event listeners
   */
  private setupEventListeners(): void {
    // Chrome extension message listener
    this.setupChromeMessageListener();

    // DOM mutation observer
    this.setupDOMObserver();

    // Page lifecycle events
    this.setupPageLifecycleEvents();

    // Navigation detection
    this.setupNavigationDetection();

    // Keyboard shortcuts
    this.setupKeyboardShortcuts();

    // Custom events from UI components
    this.setupCustomEvents();

    // Window events
    this.setupWindowEvents();
  }

  /**
   * Setup Chrome extension message listener
   */
  private setupChromeMessageListener(): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleChromeMessage(message, sendResponse);
      return true; // Keep message channel open for async responses
    });
  }

  /**
   * Handle Chrome extension messages
   */
  private handleChromeMessage(
    message: any,
    sendResponse: (response?: any) => void
  ): void {
    switch (message.type) {
      case 'TOGGLE_ELEMENT_SELECTION':
        this.elementSelectionManager.isSelectionActive()
          ? this.elementSelectionManager.disable()
          : this.elementSelectionManager.enable();
        sendResponse({ success: true });
        break;

      case 'APPLY_MUTATION':
        this.mutationManager.applyMutation(message.payload);
        sendResponse({ success: true });
        break;

      case 'UNDO_LAST_EDIT':
        const undoSuccess = this.editHistoryManager.undo();
        this.uiManager.updateUndoRedoButtonStates();
        sendResponse({ success: undoSuccess });
        break;

      case 'REDO_EDIT':
        const redoSuccess = this.editHistoryManager.redo();
        this.uiManager.updateUndoRedoButtonStates();
        sendResponse({ success: redoSuccess });
        break;

      case 'GET_SELECTED_ELEMENTS':
        const contexts = this.elementSelectionManager
          .getSelectedElements()
          .map((el) => this.elementSelectionManager.getElementContext(el));
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
   * Setup DOM mutation observer
   */
  private setupDOMObserver(): void {
    const observer = new MutationObserver((mutations) => {
      this.handleDOMChanges(mutations);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Handle DOM changes
   */
  private handleDOMChanges(mutations: MutationRecord[]): void {
    // Check if bubble was removed and re-add it
    const bubble = this.uiManager.getBubble();
    if (bubble && !document.body.contains(bubble)) {
      console.log('Peekberry: Bubble was removed, re-creating...');
      // Re-check auth status and recreate bubble
      this.refreshAuthStatus();
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
      // Debounced repositioning handled by UIManager
    }
  }

  /**
   * Setup page lifecycle events
   */
  private setupPageLifecycleEvents(): void {
    // Only use visibility change events - beforeunload/unload can cause issues in extensions
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handlePageHidden();
      } else {
        this.handlePageVisible();
      }
    });
  }

  /**
   * Setup navigation detection
   */
  private setupNavigationDetection(): void {
    // Check for navigation changes (for SPAs)
    const checkForNavigation = () => {
      if (window.location.href !== this.currentUrl) {
        const previousUrl = this.currentUrl;
        this.currentUrl = window.location.href;
        this.handlePageNavigation(previousUrl, this.currentUrl);
      }
    };

    setInterval(checkForNavigation, 1000);

    // Browser navigation events
    window.addEventListener('popstate', () => {
      setTimeout(checkForNavigation, 100);
    });
  }

  /**
   * Setup keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      // Only handle shortcuts when chat panel is open
      const chatPanel = this.uiManager.getChatPanel();
      if (!chatPanel) return;

      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const success = this.editHistoryManager.undo();
        this.uiManager.updateUndoRedoButtonStates();
        if (success) {
          showSuccess('Edit undone');
        } else {
          showWarning('No edits to undo');
        }
      }

      // Ctrl+Shift+Z or Cmd+Shift+Z for redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        const success = this.editHistoryManager.redo();
        this.uiManager.updateUndoRedoButtonStates();
        if (success) {
          showSuccess('Edit redone');
        } else {
          showWarning('No edits to redo');
        }
      }

      // Ctrl+Alt+R or Cmd+Alt+R for restore all (emergency)
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'r') {
        e.preventDefault();
        if (
          confirm('Restore all Peekberry modifications? This cannot be undone.')
        ) {
          this.mutationManager.restoreAllModifications();
          this.editHistoryManager.clearHistory();
          this.uiManager.updateUndoRedoButtonStates();
        }
      }
    });
  }

  /**
   * Setup custom events from UI components
   */
  private setupCustomEvents(): void {
    // Process command event
    document.addEventListener('peekberry-process-command', (e: any) => {
      this.processEditCommand(e.detail);
    });

    // Screenshot capture event
    document.addEventListener('peekberry-capture-screenshot', () => {
      this.captureScreenshot();
    });
  }

  /**
   * Setup window events
   */
  private setupWindowEvents(): void {
    // Window resize is handled by UIManager
  }

  /**
   * Process edit command
   */
  private async processEditCommand(detail: any): Promise<void> {
    const { input, selectedElements } = detail;
    const command = input?.value.trim();

    if (!command) {
      showWarning('Please enter a command to apply changes');
      return;
    }

    if (selectedElements.length === 0) {
      showWarning('Please select at least one element to modify');
      return;
    }

    try {
      await withLoadingState(
        'process_edit_command',
        async () => {
          let successCount = 0;
          let failureCount = 0;

          for (const element of selectedElements) {
            try {
              const elementContext =
                this.elementSelectionManager.getElementContext(element);

              // Send command to background script for AI processing
              const response = await integrationManager.sendMessage(
                'PROCESS_EDIT_COMMAND',
                {
                  command,
                  context: elementContext,
                },
                {
                  showProgress: false,
                  retryOnFailure: true,
                  timeout: 15000,
                }
              );

              if (response.success && response.data && response.data.mutation) {
                const mutation = response.data.mutation;

                // Apply the mutation
                this.mutationManager.applyMutation(mutation);

                // Add to history
                const editAction = {
                  id:
                    Date.now().toString() +
                    Math.random().toString(36).substr(2, 9),
                  type: mutation.type,
                  element: elementContext,
                  mutation: mutation,
                  timestamp: new Date(),
                  undoable: true,
                };

                this.editHistoryManager.addEdit(editAction);
                successCount++;
              } else {
                failureCount++;
              }
            } catch (error) {
              failureCount++;
              console.error('Error processing element:', error);
            }
          }

          // Clear input and show results
          if (input) {
            input.value = '';
          }

          if (successCount > 0 && failureCount === 0) {
            showSuccess(`Changes applied to ${successCount} element(s)`);
          } else if (successCount > 0 && failureCount > 0) {
            showWarning(
              `Changes applied to ${successCount} element(s), ${failureCount} failed`
            );
          } else {
            showError('Failed to apply changes to any elements');
          }

          // Update UI
          this.uiManager.updateSelectedElementsDisplay();
          this.uiManager.updateUndoRedoButtonStates();
        },
        `Processing ${selectedElements.length} element(s)`
      );
    } catch (error) {
      console.error('Error processing edit command:', error);
      showError('Failed to process edit command');
    }
  }

  /**
   * Capture screenshot
   */
  private async captureScreenshot(): Promise<any> {
    try {
      return await withLoadingState(
        'capture_screenshot',
        async () => {
          const metadata = {
            pageUrl: window.location.href,
            pageTitle: document.title,
            editCount: this.editHistoryManager.getHistoryCount(),
            dimensions: {
              width: window.innerWidth,
              height: window.innerHeight,
            },
          };

          const response = await integrationManager.sendMessage(
            'CAPTURE_SCREENSHOT',
            metadata,
            {
              showProgress: true,
              retryOnFailure: true,
              timeout: 20000,
            }
          );

          if (response.success && response.data) {
            showSuccess('Screenshot captured and saved to your dashboard!');
            return response.data;
          } else {
            throw new Error(response.error || 'Failed to capture screenshot');
          }
        },
        'Capturing and uploading screenshot'
      );
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      showError('Failed to capture screenshot');
      return null;
    }
  }

  /**
   * Refresh authentication status
   */
  private async refreshAuthStatus(): Promise<void> {
    try {
      console.log('Peekberry: Refreshing auth status...');
      const response = await integrationManager.sendMessage('GET_AUTH_STATUS');
      const authStatus = response?.data || { isAuthenticated: false };

      console.log('Peekberry: Auth status response:', authStatus);

      // Update UI based on auth status
      this.uiManager.createBubble(authStatus.isAuthenticated);

      if (authStatus.isAuthenticated) {
        console.log('Peekberry: Enabling element selection');
        this.elementSelectionManager.enable();
      } else {
        console.log('Peekberry: Disabling element selection');
        this.elementSelectionManager.disable();
      }

      console.log('Peekberry: Auth status refreshed successfully:', authStatus);
    } catch (error) {
      console.error('Peekberry: Error refreshing auth status:', error);
      // Fallback to unauthenticated state
      this.uiManager.createBubble(false);
      this.elementSelectionManager.disable();
    }
  }

  /**
   * Handle page navigation
   */
  private handlePageNavigation(previousUrl: string, currentUrl: string): void {
    console.log(`Navigation detected: ${previousUrl} -> ${currentUrl}`);

    // Clear edit history
    this.editHistoryManager.clearHistory();

    // Reset selected elements
    this.elementSelectionManager.clearSelection();

    // Close chat panel if open
    const chatPanel = this.uiManager.getChatPanel();
    if (chatPanel) {
      this.uiManager.hideChatPanel();
    }

    // Update UI
    this.uiManager.updateSelectedElementsDisplay();
    this.uiManager.updateUndoRedoButtonStates();

    console.log('Page navigation handled - edit session cleared');
  }

  /**
   * Handle page becoming hidden
   */
  private handlePageHidden(): void {
    console.log('Page hidden - pausing operations');
  }

  /**
   * Handle page becoming visible
   */
  private handlePageVisible(): void {
    console.log('Page visible - resuming operations');

    // Cleanup any invalid history entries
    // Note: These methods would need to be exposed by EditHistoryManager
    this.uiManager.updateUndoRedoButtonStates();
  }

  /**
   * Handle session end
   */
  private handleSessionEnd(): void {
    console.log('Browser session ending - clearing edit history');
    this.editHistoryManager.clearHistory();
    this.cleanup();
  }

  /**
   * Cleanup all resources
   */
  public cleanup(): void {
    this.elementSelectionManager.cleanup();
    this.uiManager.cleanup();
  }
}
