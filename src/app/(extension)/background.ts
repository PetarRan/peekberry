/**
 * Peekberry Chrome Extension Background Script
 * Handles API communication, authentication, and cross-tab messaging
 */

// Types for background script functionality
interface AuthToken {
  token: string;
  expiresAt: number;
  userId: string;
}

interface ExtensionMessage {
  type: string;
  payload?: any;
  tabId?: number;
}

class PeekberryBackground {
  private readonly STORAGE_KEYS = {
    AUTH_TOKEN: 'peekberry_auth_token',
    USER_ID: 'peekberry_user_id',
  };

  private readonly API_BASE_URL =
    typeof process !== 'undefined' && process.env.NODE_ENV === 'production'
      ? 'https://peekberry.app'
      : 'http://localhost:3000';

  constructor() {
    this.initializeExtension();
    this.setupMessageListeners();
  }

  /**
   * Initialize extension on startup
   */
  private initializeExtension(): void {
    console.log('Peekberry extension background script initialized');

    // Check authentication status on startup
    this.checkAuthStatus();
  }

  /**
   * Set up message listeners for communication with content scripts and popup
   */
  private setupMessageListeners(): void {
    chrome.runtime.onMessage.addListener(
      (message: ExtensionMessage, sender, sendResponse) => {
        this.handleMessage(message, sender, sendResponse);
        return true; // Keep message channel open for async responses
      }
    );

    // Listen for tab updates to inject content script if needed
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.onTabUpdated(tabId, tab);
      }
    });
  }

  /**
   * Handle messages from content scripts and popup
   */
  private async handleMessage(
    message: ExtensionMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): Promise<void> {
    try {
      switch (message.type) {
        case 'GET_AUTH_STATUS':
          const authStatus = await this.getAuthStatus();
          sendResponse({ success: true, data: authStatus });
          break;

        case 'STORE_AUTH_TOKEN':
          await this.storeAuthToken(message.payload);
          sendResponse({ success: true });
          break;

        case 'CLEAR_AUTH_TOKEN':
          await this.clearAuthToken();
          sendResponse({ success: true });
          break;

        case 'SYNC_AUTH_FROM_WEBAPP':
          await this.syncAuthFromWebapp();
          const newAuthStatus = await this.getAuthStatus();
          // Notify all content scripts about auth status change
          await this.notifyContentScriptsAuthChange();
          sendResponse({ success: true, data: newAuthStatus });
          break;

        case 'VERIFY_TOKEN':
          const verificationResult = await this.verifyTokenWithServer();
          sendResponse({ success: true, data: verificationResult });
          break;

        case 'API_REQUEST':
          const apiResponse = await this.makeAPIRequest(message.payload);
          sendResponse(apiResponse);
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle tab updates for content script injection
   */
  private async onTabUpdated(
    tabId: number,
    tab: chrome.tabs.Tab
  ): Promise<void> {
    // Skip chrome:// and extension pages
    if (
      !tab.url ||
      tab.url.startsWith('chrome://') ||
      tab.url.startsWith('chrome-extension://')
    ) {
      return;
    }

    // Check if user is authenticated before injecting
    const authStatus = await this.getAuthStatus();
    if (!authStatus.isAuthenticated) {
      return;
    }

    // Content script will be automatically injected via manifest
    // This is just for any additional initialization if needed
  }

  /**
   * Check current authentication status
   */
  private async checkAuthStatus(): Promise<void> {
    const authData = await this.getStoredAuthToken();
    if (authData && this.isTokenExpired(authData)) {
      await this.clearAuthToken();
    }
  }

  /**
   * Get authentication status
   */
  private async getAuthStatus(): Promise<{
    isAuthenticated: boolean;
    userId?: string;
  }> {
    const authData = await this.getStoredAuthToken();

    if (!authData || this.isTokenExpired(authData)) {
      return { isAuthenticated: false };
    }

    return {
      isAuthenticated: true,
      userId: authData.userId,
    };
  }

  /**
   * Store authentication token
   */
  private async storeAuthToken(tokenData: AuthToken): Promise<void> {
    await chrome.storage.local.set({
      [this.STORAGE_KEYS.AUTH_TOKEN]: tokenData.token,
      [this.STORAGE_KEYS.USER_ID]: tokenData.userId,
      peekberry_token_expires: tokenData.expiresAt,
    });
  }

  /**
   * Get stored authentication token
   */
  private async getStoredAuthToken(): Promise<AuthToken | null> {
    const result = await chrome.storage.local.get([
      this.STORAGE_KEYS.AUTH_TOKEN,
      this.STORAGE_KEYS.USER_ID,
      'peekberry_token_expires',
    ]);

    if (!result[this.STORAGE_KEYS.AUTH_TOKEN]) {
      return null;
    }

    return {
      token: result[this.STORAGE_KEYS.AUTH_TOKEN],
      userId: result[this.STORAGE_KEYS.USER_ID],
      expiresAt: result.peekberry_token_expires || 0,
    };
  }

  /**
   * Clear authentication token
   */
  private async clearAuthToken(): Promise<void> {
    await chrome.storage.local.remove([
      this.STORAGE_KEYS.AUTH_TOKEN,
      this.STORAGE_KEYS.USER_ID,
      'peekberry_token_expires',
    ]);
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(authData: AuthToken): boolean {
    return Date.now() > authData.expiresAt;
  }

  /**
   * Sync authentication from webapp
   * This method checks if there's a token available in the webapp's localStorage
   */
  private async syncAuthFromWebapp(): Promise<void> {
    try {
      // Create a new tab to check for auth token in webapp
      const tab = await chrome.tabs.create({
        url: `${this.API_BASE_URL}/extension-auth`,
        active: false,
      });

      // Wait a moment for the page to load and set up auth
      setTimeout(async () => {
        if (tab.id) {
          try {
            // Execute script to check for auth token
            const results = await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: () => {
                const tokenData = localStorage.getItem(
                  'peekberry_extension_token'
                );
                return tokenData ? JSON.parse(tokenData) : null;
              },
            });

            if (results && results[0] && results[0].result) {
              const tokenData = results[0].result;
              await this.storeAuthToken(tokenData);
              console.log('Successfully synced auth token from webapp');
            }

            // Close the tab
            chrome.tabs.remove(tab.id);
          } catch (error) {
            console.error('Error executing script in webapp tab:', error);
            if (tab.id) {
              chrome.tabs.remove(tab.id);
            }
          }
        }
      }, 2000);
    } catch (error) {
      console.error('Error syncing auth from webapp:', error);
    }
  }

  /**
   * Verify token with server
   */
  private async verifyTokenWithServer(): Promise<{
    valid: boolean;
    userId?: string;
  }> {
    try {
      const authData = await this.getStoredAuthToken();

      if (!authData) {
        return { valid: false };
      }

      const response = await fetch(
        `${this.API_BASE_URL}/api/extension/auth/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: authData.token }),
        }
      );

      if (!response.ok) {
        return { valid: false };
      }

      const result = await response.json();

      if (result.success && result.data.valid) {
        return { valid: true, userId: result.data.userId };
      } else {
        // Token is invalid, clear it
        await this.clearAuthToken();
        return { valid: false };
      }
    } catch (error) {
      console.error('Error verifying token with server:', error);
      return { valid: false };
    }
  }

  /**
   * Notify all content scripts about authentication status change
   */
  private async notifyContentScriptsAuthChange(): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({});

      for (const tab of tabs) {
        if (
          tab.id &&
          tab.url &&
          !tab.url.startsWith('chrome://') &&
          !tab.url.startsWith('chrome-extension://')
        ) {
          try {
            chrome.tabs.sendMessage(tab.id, { type: 'REFRESH_AUTH_STATUS' });
          } catch (error) {
            // Ignore errors for tabs without content script
          }
        }
      }
    } catch (error) {
      console.error('Error notifying content scripts:', error);
    }
  }

  /**
   * Make authenticated API request to webapp
   */
  private async makeAPIRequest(requestData: {
    endpoint: string;
    method?: string;
    body?: any;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const authData = await this.getStoredAuthToken();

      if (!authData || this.isTokenExpired(authData)) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(
        `${this.API_BASE_URL}/api${requestData.endpoint}`,
        {
          method: requestData.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authData.token}`,
          },
          body: requestData.body ? JSON.stringify(requestData.body) : undefined,
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          await this.clearAuthToken();
          return { success: false, error: 'Authentication expired' };
        }
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('API request error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Initialize background script
new PeekberryBackground();
