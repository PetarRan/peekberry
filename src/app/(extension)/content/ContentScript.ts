/**
 * Peekberry Chrome Extension Content Script
 * Main orchestrator for all content script functionality
 */

import { ElementSelectionManager } from './managers/ElementSelectionManager';
import { UIManager } from './managers/UIManager';
import { EditHistoryManager } from './managers/EditHistoryManager';
import { MutationManager } from './managers/MutationManager';
import { EventManager } from './managers/EventManager';
import { integrationManager, withLoadingState } from '../utils/integration';
import { showQuickStatus } from '../components/StatusIndicator';

export class PeekberryContentScript {
  private isInitialized = false;
  private elementSelectionManager: ElementSelectionManager;
  private uiManager: UIManager;
  private editHistoryManager: EditHistoryManager;
  private mutationManager: MutationManager;
  private eventManager: EventManager;

  constructor() {
    this.initializeManagers();
    this.initializeContentScript();
  }

  /**
   * Initialize all manager instances
   */
  private initializeManagers(): void {
    // Create managers in dependency order
    this.elementSelectionManager = new ElementSelectionManager();
    this.editHistoryManager = new EditHistoryManager();
    this.mutationManager = new MutationManager();

    this.uiManager = new UIManager(
      this.elementSelectionManager,
      this.editHistoryManager
    );

    this.eventManager = new EventManager(
      this.elementSelectionManager,
      this.uiManager,
      this.editHistoryManager,
      this.mutationManager
    );
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

    // Check if we're on a valid page
    if (this.isInvalidPage()) {
      console.log('Peekberry: Invalid page, skipping initialization');
      return;
    }

    console.log('Peekberry: Valid page, proceeding with initialization');

    // Initialize integration manager first
    try {
      await integrationManager.initialize();
      console.log('Peekberry: Integration manager initialized');
    } catch (error) {
      console.warn('Peekberry: Integration manager initialization failed:', error);
      // Continue with limited functionality
    }

    // Check authentication status with timeout
    try {
      const authStatus = await Promise.race([
        this.checkAuthStatus(),
        new Promise<{ isAuthenticated: boolean }>((_, reject) =>
          setTimeout(() => reject(new Error('Auth check timeout')), 5000)
        ),
      ]);

      console.log('Peekberry: Auth status:', authStatus);

      // Create UI and setup based on auth status
      this.uiManager.createBubble(authStatus.isAuthenticated);

      if (authStatus.isAuthenticated) {
        console.log('Peekberry: User authenticated, enabling features');
        this.elementSelectionManager.enable();
      } else {
        console.log('Peekberry: User not authenticated, limited features');
        this.elementSelectionManager.disable();
      }
    } catch (error) {
      console.error('Peekberry: Auth check failed:', error);
      console.log(
        'Peekberry: Showing bubble in unauthenticated state as fallback'
      );
      this.uiManager.createBubble(false);
      this.elementSelectionManager.disable();
    }

    this.isInitialized = true;
    console.log('Peekberry content script initialized successfully');

    // Set up periodic health check
    this.setupHealthCheck();

    // Check auth when page becomes visible (user comes back from auth)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        console.log('Peekberry: Page visible, checking auth status...');
        this.checkAuthStatus()
          .then((authStatus) => {
            if (authStatus.isAuthenticated) {
              this.elementSelectionManager.enable();
              this.uiManager.createBubble(true);
              console.log('Peekberry: User is now authenticated!');
            }
          })
          .catch(() => {
            // Keep current state on error
          });
      }
    });
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
      url.includes('peekberry.app') // Don't inject on our own webapp
    );
  }

  /**
   * Check authentication status with background script
   */
  private async checkAuthStatus(): Promise<{
    isAuthenticated: boolean;
    userId?: string;
  }> {
    return withLoadingState(
      'auth_check',
      async () => {
        const result = await integrationManager.sendMessage('GET_AUTH_STATUS');
        return result?.data || { isAuthenticated: false };
      },
      'Checking authentication'
    );
  }

  /**
   * Setup periodic health check to ensure bubble stays visible
   */
  private setupHealthCheck(): void {
    setInterval(() => {
      const bubble = this.uiManager.getBubble();
      if (!bubble || !document.body.contains(bubble)) {
        console.log('Peekberry: Health check - bubble missing, recreating...');
        this.checkAuthStatus()
          .then((authStatus) => {
            this.uiManager.createBubble(authStatus.isAuthenticated);
          })
          .catch(() => {
            // If auth check fails, show unauthenticated bubble
            this.uiManager.createBubble(false);
          });
      }
    }, 5000); // Check every 5 seconds

    // Also check auth status periodically
    setInterval(() => {
      this.checkAuthStatus()
        .then((authStatus) => {
          if (authStatus.isAuthenticated) {
            // Only enable selection if it's not manually disabled
            if (this.elementSelectionManager.isSelectionActive()) {
              this.elementSelectionManager.enable();
            }
            this.uiManager.createBubble(true);
          } else {
            this.elementSelectionManager.disable();
            this.uiManager.createBubble(false);
          }
        })
        .catch(() => {
          // Keep current state on error
        });
    }, 10000); // Check auth every 10 seconds
  }

  /**
   * Get debug information
   */
  public getDebugInfo(): any {
    return {
      isInitialized: this.isInitialized,
      isSelectionActive: this.elementSelectionManager.isSelectionActive(),
      selectedElementsCount:
        this.elementSelectionManager.getSelectedElements().length,
      editHistory: this.editHistoryManager.getHistorySummary(),
      modifiedElementsCount: this.mutationManager.getModifiedElements().length,
      hasBubble: !!this.uiManager.getBubble(),
      hasChatPanel: !!this.uiManager.getChatPanel(),
      currentUrl: window.location.href,
    };
  }

  /**
   * Force refresh authentication status
   */
  public async refreshAuth(): Promise<void> {
    const authStatus = await this.checkAuthStatus();
    this.uiManager.createBubble(authStatus.isAuthenticated);

    if (authStatus.isAuthenticated) {
      this.elementSelectionManager.enable();
    } else {
      this.elementSelectionManager.disable();
    }
  }

  /**
   * Emergency cleanup and restore
   */
  public emergencyRestore(): void {
    if (
      confirm('Restore all Peekberry modifications? This cannot be undone.')
    ) {
      this.mutationManager.restoreAllModifications();
      this.editHistoryManager.clearHistory();
      showQuickStatus('All modifications restored', 'success', 3000);
    }
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.eventManager.cleanup();
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

// Add global debug methods
(window as any).peekberryDebug = {
  getInfo: () => {
    if (peekberryInstance) {
      const info = peekberryInstance.getDebugInfo();
      console.log('Peekberry Debug Info:', info);
      return info;
    }
  },

  refreshAuth: async () => {
    if (peekberryInstance) {
      await peekberryInstance.refreshAuth();
      console.log('Peekberry: Auth status refreshed');
    }
  },

  emergencyRestore: () => {
    if (peekberryInstance) {
      peekberryInstance.emergencyRestore();
    }
  },

  reinitialize: () => {
    console.log('Peekberry: Reinitializing...');
    if (peekberryInstance) {
      peekberryInstance.cleanup();
    }
    peekberryInstance = new PeekberryContentScript();
  },

  // Test method to manually trigger auth refresh
  testAuthRefresh: () => {
    console.log('Peekberry: Testing auth refresh...');
    if (peekberryInstance) {
      peekberryInstance.refreshAuth();
    }
  },

  // Force check auth status from background
  forceCheckAuth: async () => {
    console.log('Peekberry: Force checking auth from background...');
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_AUTH_STATUS' });
      console.log('Peekberry: Background auth response:', response);
      if (peekberryInstance) {
        await peekberryInstance.refreshAuth();
      }
    } catch (error) {
      console.error('Peekberry: Error checking auth:', error);
    }
  },
};
