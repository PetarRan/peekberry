/**
 * Peekberry Chrome Extension Popup Script
 * Handles popup UI interactions and authentication status
 */

interface AuthStatus {
  isAuthenticated: boolean;
  userId?: string;
}

class PeekberryPopup {
  private readonly WEBAPP_URL =
    typeof process !== 'undefined' && process.env.NODE_ENV === 'production'
      ? 'https://peekberry.app'
      : 'http://localhost:3000';

  private isSelectionActive = false;

  private elements: {
    loading: HTMLElement;
    content: HTMLElement;
    authStatus: HTMLElement;
    authText: HTMLElement;
    authButton: HTMLButtonElement;
    quickActions: HTMLElement;
    toggleSelection: HTMLButtonElement;
    captureScreenshot: HTMLButtonElement;
    openDashboard: HTMLButtonElement;
    helpLink: HTMLAnchorElement;
  };

  constructor() {
    this.initializeElements();
    this.setupEventListeners();
    this.initializePopup();
  }

  /**
   * Initialize DOM element references
   */
  private initializeElements(): void {
    this.elements = {
      loading: document.getElementById('loading')!,
      content: document.getElementById('content')!,
      authStatus: document.getElementById('auth-status')!,
      authText: document.getElementById('auth-text')!,
      authButton: document.getElementById('auth-button') as HTMLButtonElement,
      quickActions: document.getElementById('quick-actions')!,
      toggleSelection: document.getElementById(
        'toggle-selection'
      ) as HTMLButtonElement,
      captureScreenshot: document.getElementById(
        'capture-screenshot'
      ) as HTMLButtonElement,
      openDashboard: document.getElementById(
        'open-dashboard'
      ) as HTMLButtonElement,
      helpLink: document.getElementById('help-link') as HTMLAnchorElement,
    };
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    this.elements.authButton.addEventListener('click', () => {
      this.handleSignIn();
    });

    this.elements.toggleSelection.addEventListener('click', () => {
      this.handleToggleSelection();
    });

    this.elements.captureScreenshot.addEventListener('click', () => {
      this.handleCaptureScreenshot();
    });

    this.elements.openDashboard.addEventListener('click', () => {
      this.handleOpenDashboard();
    });

    this.elements.helpLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleHelpLink();
    });
  }

  /**
   * Initialize popup state
   */
  private async initializePopup(): Promise<void> {
    try {
      // Check authentication status
      const authStatus = await this.checkAuthStatus();
      this.updateAuthUI(authStatus);

      // Check selection state
      await this.checkSelectionState();

      // Show content and hide loading
      this.elements.loading.style.display = 'none';
      this.elements.content.style.display = 'block';
    } catch (error) {
      console.error('Error initializing popup:', error);
      this.showError('Failed to initialize extension');
    }
  }

  /**
   * Check authentication status with background script
   */
  private async checkAuthStatus(): Promise<AuthStatus> {
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
   * Update authentication UI based on status
   */
  private updateAuthUI(authStatus: AuthStatus): void {
    const statusIndicator =
      this.elements.authStatus.querySelector('.status-indicator')!;

    if (authStatus.isAuthenticated) {
      // User is authenticated
      this.elements.authStatus.className = 'auth-status authenticated';
      statusIndicator.className = 'status-indicator online';
      this.elements.authText.textContent = 'Signed in and ready to use';
      this.elements.authButton.style.display = 'none';
      this.elements.quickActions.style.display = 'block';
    } else {
      // User is not authenticated
      this.elements.authStatus.className = 'auth-status not-authenticated';
      statusIndicator.className = 'status-indicator offline';
      this.elements.authText.textContent = 'Sign in required';
      this.elements.authButton.style.display = 'block';
      this.elements.authButton.textContent = 'Sign In to Peekberry';
      this.elements.quickActions.style.display = 'none';
    }
  }

  /**
   * Handle sign in button click
   */
  private handleSignIn(): void {
    console.log('Opening auth page...');
    
    // Open webapp in new tab for authentication
    chrome.tabs.create({
      url: `${this.WEBAPP_URL}/extension-auth`,
      active: true,
    });

    // Set up a listener for when the user comes back
    this.setupAuthListener();

    // Show loading state instead of closing
    this.elements.authText.textContent = 'Please complete authentication in the new tab...';
    this.elements.authButton.textContent = 'Waiting for auth...';
    this.elements.authButton.disabled = true;
  }

  /**
   * Set up listener for authentication completion
   */
  private setupAuthListener(): void {
    let syncAttempts = 0;
    const maxAttempts = 10;
    
    // Listen for tab updates to detect when auth is complete
    const listener = (
      tabId: number,
      changeInfo: chrome.tabs.TabChangeInfo,
      tab: chrome.tabs.Tab
    ) => {
      if (
        changeInfo.status === 'complete' &&
        tab.url?.includes('/extension-auth')
      ) {
        console.log('Extension auth page loaded, attempting to sync...');
        
        // Try to sync auth with retries
        const attemptSync = () => {
          syncAttempts++;
          console.log(`Auth sync attempt ${syncAttempts}/${maxAttempts}`);
          
          chrome.runtime.sendMessage(
            { type: 'SYNC_AUTH_FROM_WEBAPP' },
            (response) => {
              if (response?.success) {
                console.log('Auth sync completed successfully');
                // Refresh the popup to show updated auth status
                this.initializePopup();
                chrome.tabs.onUpdated.removeListener(listener);
              } else {
                console.log(`Auth sync failed (attempt ${syncAttempts}):`, response);
                if (syncAttempts < maxAttempts) {
                  // Retry after 1 second
                  setTimeout(attemptSync, 1000);
                } else {
                  // Show manual refresh option
                  this.elements.authText.textContent = 'Auth completed but sync failed. Click to refresh.';
                  this.elements.authButton.textContent = 'Refresh Auth Status';
                  this.elements.authButton.disabled = false;
                  this.elements.authButton.onclick = () => this.initializePopup();
                }
              }
            }
          );
        };
        
        // Start sync attempts after a delay
        setTimeout(attemptSync, 2000);
      }
    };

    chrome.tabs.onUpdated.addListener(listener);

    // Clean up listener after 5 minutes
    setTimeout(
      () => {
        chrome.tabs.onUpdated.removeListener(listener);
      },
      5 * 60 * 1000
    );
  }

  /**
   * Handle toggle element selection
   */
  private async handleToggleSelection(): Promise<void> {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab.id) {
        throw new Error('No active tab found');
      }

      // Update button state immediately for better UX
      this.isSelectionActive = !this.isSelectionActive;
      this.updateToggleButton();

      // Send message to content script
      chrome.tabs.sendMessage(
        tab.id,
        { type: 'TOGGLE_ELEMENT_SELECTION' },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error(
              'Error toggling selection:',
              chrome.runtime.lastError
            );
            // Revert button state on error
            this.isSelectionActive = !this.isSelectionActive;
            this.updateToggleButton();
            this.showError('Failed to toggle element selection');
          } else {
            // Close popup after successful action
            window.close();
          }
        }
      );
    } catch (error) {
      console.error('Error in toggle selection:', error);
      // Revert button state on error
      this.isSelectionActive = !this.isSelectionActive;
      this.updateToggleButton();
      this.showError('Failed to toggle element selection');
    }
  }

  /**
   * Check current selection state from content script
   */
  private async checkSelectionState(): Promise<void> {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab.id) {
        return;
      }

      chrome.tabs.sendMessage(
        tab.id,
        { type: 'GET_SELECTION_STATE' },
        (response) => {
          if (!chrome.runtime.lastError && response?.success) {
            this.isSelectionActive = response.isActive || false;
            this.updateToggleButton();
          }
        }
      );
    } catch (error) {
      console.error('Error checking selection state:', error);
    }
  }

  /**
   * Update toggle button appearance and text
   */
  private updateToggleButton(): void {
    if (this.isSelectionActive) {
      this.elements.toggleSelection.textContent = 'Stop Element Selection';
      this.elements.toggleSelection.style.background = '#ef4444';
      this.elements.toggleSelection.style.borderColor = '#dc2626';
    } else {
      this.elements.toggleSelection.textContent = 'Start Element Selection';
      this.elements.toggleSelection.style.background = '#22c55e';
      this.elements.toggleSelection.style.borderColor = '#16a34a';
    }
  }

  /**
   * Handle capture screenshot
   */
  private async handleCaptureScreenshot(): Promise<void> {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab.id) {
        throw new Error('No active tab found');
      }

      // Send message to content script
      chrome.tabs.sendMessage(
        tab.id,
        { type: 'CAPTURE_SCREENSHOT' },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error(
              'Error capturing screenshot:',
              chrome.runtime.lastError
            );
            this.showError('Failed to capture screenshot');
          } else {
            // Close popup after successful action
            window.close();
          }
        }
      );
    } catch (error) {
      console.error('Error in capture screenshot:', error);
      this.showError('Failed to capture screenshot');
    }
  }

  /**
   * Handle open dashboard
   */
  private handleOpenDashboard(): void {
    chrome.tabs.create({
      url: `${this.WEBAPP_URL}/dashboard`,
      active: true,
    });

    // Close popup
    window.close();
  }

  /**
   * Handle help link
   */
  private handleHelpLink(): void {
    chrome.tabs.create({
      url: `${this.WEBAPP_URL}/help`,
      active: true,
    });

    // Close popup
    window.close();
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.elements.authText.textContent = message;
    this.elements.authStatus.className = 'auth-status not-authenticated';

    // Reset after 3 seconds
    setTimeout(() => {
      this.initializePopup();
    }, 3000);
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PeekberryPopup();
});
