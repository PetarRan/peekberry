/**
 * Peekberry Chrome Extension Background Script
 * Handles API communication, authentication, and cross-tab messaging
 */

import {
  PeekberryError,
  ERROR_CODES,
  logError,
  retryWithBackoff,
  safeAsyncOperation,
  getUserFriendlyMessage,
  createPeekberryError,
} from './utils/errorHandling';

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
   * Handle messages from content scripts and popup with comprehensive error handling
   */
  private async handleMessage(
    message: ExtensionMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): Promise<void> {
    const context = {
      component: 'BackgroundScript',
      operation: message.type,
      url: sender.tab?.url || 'unknown',
      timestamp: new Date(),
    };

    try {
      switch (message.type) {
        case 'GET_AUTH_STATUS':
          const authStatus = await safeAsyncOperation(
            () => this.getAuthStatus(),
            context,
            { isAuthenticated: false }
          );
          sendResponse({ success: true, data: authStatus });
          break;

        case 'STORE_AUTH_TOKEN':
          console.log('Received STORE_AUTH_TOKEN message:', message.payload);
          await safeAsyncOperation(
            () => this.storeAuthToken(message.payload),
            context
          );
          // Notify content scripts about auth change
          await this.notifyContentScriptsAuthChange();
          sendResponse({ success: true });
          break;

        case 'CLEAR_AUTH_TOKEN':
          await safeAsyncOperation(() => this.clearAuthToken(), context);
          sendResponse({ success: true });
          break;

        case 'OPEN_AUTH_PAGE':
          await safeAsyncOperation(() => this.openAuthPage(), context);
          sendResponse({ success: true });
          break;

        case 'SYNC_AUTH_FROM_WEBAPP':
          await safeAsyncOperation(() => this.syncAuthFromWebapp(), context);
          const newAuthStatus = await this.getAuthStatus();
          await this.notifyContentScriptsAuthChange();
          sendResponse({ success: true, data: newAuthStatus });
          break;

        case 'VERIFY_TOKEN':
          const verificationResult = await safeAsyncOperation(
            () => this.verifyTokenWithServer(),
            context,
            { valid: false }
          );
          sendResponse({ success: true, data: verificationResult });
          break;

        case 'API_REQUEST':
          const apiResponse = await this.makeAPIRequest(message.payload);
          sendResponse(apiResponse);
          break;

        case 'PROCESS_EDIT_COMMAND':
          const commandResult = await this.processEditCommand(message.payload);
          sendResponse(commandResult);
          break;

        case 'CAPTURE_SCREENSHOT':
          const screenshotResult = await this.captureScreenshot(
            message.payload,
            sender.tab?.id
          );
          sendResponse(screenshotResult);
          break;

        default:
          const error = new PeekberryError(
            `Unknown message type: ${message.type}`,
            ERROR_CODES.UNKNOWN_ERROR,
            context
          );
          logError(error);
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      const peekberryError =
        error instanceof PeekberryError
          ? error
          : createPeekberryError(
              error as Error,
              ERROR_CODES.BACKGROUND_SCRIPT_ERROR,
              context
            );

      logError(peekberryError);
      sendResponse({
        success: false,
        error: getUserFriendlyMessage(peekberryError),
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
    console.log('Storing auth token:', { 
      token: tokenData.token?.substring(0, 10) + '...', 
      userId: tokenData.userId,
      expiresAt: new Date(tokenData.expiresAt).toISOString()
    });
    
    await chrome.storage.local.set({
      [this.STORAGE_KEYS.AUTH_TOKEN]: tokenData.token,
      [this.STORAGE_KEYS.USER_ID]: tokenData.userId,
      peekberry_token_expires: tokenData.expiresAt,
    });
    
    console.log('Auth token stored successfully');
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
      console.log('Starting auth sync from webapp...');
      
      // Find the webapp tab (extension-auth page)
      const tabs = await chrome.tabs.query({
        url: `${this.API_BASE_URL}/extension-auth*`,
      });

      console.log(`Found ${tabs.length} webapp tabs:`, tabs.map(t => ({ id: t.id, url: t.url })));

      if (tabs.length === 0) {
        console.log('No webapp tab found, creating new one');
        // Create a new tab if none exists
        const tab = await chrome.tabs.create({
          url: `${this.API_BASE_URL}/extension-auth`,
          active: false,
        });

        // Wait for the page to load and try to get the token
        setTimeout(async () => {
          if (tab.id) {
            console.log('Attempting to extract token from new tab:', tab.id);
            await this.extractTokenFromTab(tab.id);
          }
        }, 3000);
        return;
      }

      // Use the existing webapp tab
      const webappTab = tabs[0];
      console.log('Using existing webapp tab:', webappTab.id);
      if (webappTab.id) {
        await this.extractTokenFromTab(webappTab.id);
      }
    } catch (error) {
      console.error('Error syncing auth from webapp:', error);
    }
  }

  /**
   * Extract token from a specific tab
   */
  private async extractTokenFromTab(tabId: number): Promise<void> {
    try {
      console.log(`Extracting token from tab ${tabId}...`);
      
      // Execute script to check for auth token
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const tokenData = localStorage.getItem('peekberry_extension_token');
          console.log('Token data from localStorage:', tokenData);
          return tokenData ? JSON.parse(tokenData) : null;
        },
      });

      console.log('Script execution results:', results);

      if (results && results[0] && results[0].result) {
        const tokenData = results[0].result;
        console.log('Found token data:', tokenData);
        await this.storeAuthToken(tokenData);
        console.log('Successfully synced auth token from webapp');
        
        // Notify content scripts about auth change
        await this.notifyContentScriptsAuthChange();
      } else {
        console.log('No auth token found in webapp localStorage');
      }
    } catch (error) {
      console.error('Error extracting token from tab:', error);
    }
  }

  /**
   * Open authentication page
   */
  private async openAuthPage(): Promise<void> {
    try {
      await chrome.tabs.create({
        url: `${this.API_BASE_URL}/extension-auth`,
        active: true,
      });
      console.log('Opened auth page');
    } catch (error) {
      console.error('Error opening auth page:', error);
      throw error;
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
      console.log('Notifying content scripts about auth change...');
      const tabs = await chrome.tabs.query({});
      console.log(`Found ${tabs.length} tabs to notify`);

      for (const tab of tabs) {
        if (
          tab.id &&
          tab.url &&
          !tab.url.startsWith('chrome://') &&
          !tab.url.startsWith('chrome-extension://')
        ) {
          try {
            console.log(`Sending REFRESH_AUTH_STATUS to tab ${tab.id}: ${tab.url}`);
            chrome.tabs.sendMessage(tab.id, { type: 'REFRESH_AUTH_STATUS' });
          } catch (error) {
            console.log(`Failed to send message to tab ${tab.id}:`, error instanceof Error ? error.message : String(error));
            // Ignore errors for tabs without content script
          }
        }
      }
      console.log('Finished notifying content scripts');
    } catch (error) {
      console.error('Error notifying content scripts:', error);
    }
  }

  /**
   * Process edit command with AI service
   */
  private async processEditCommand(requestData: {
    command: string;
    context: any;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    const context = {
      component: 'BackgroundScript',
      operation: 'processEditCommand',
      url: 'background',
      timestamp: new Date(),
    };

    try {
      const authData = await this.getStoredAuthToken();

      if (!authData || this.isTokenExpired(authData)) {
        const error = new PeekberryError(
          'Authentication required',
          ERROR_CODES.AUTH_REQUIRED,
          context
        );
        logError(error);
        return { success: false, error: 'Please sign in to continue' };
      }

      // Validate input
      if (!requestData.command?.trim()) {
        const error = new PeekberryError(
          'Empty command provided',
          ERROR_CODES.AI_COMMAND_INVALID,
          context
        );
        logError(error);
        return { success: false, error: 'Please provide a valid command' };
      }

      if (!requestData.context?.selector) {
        const error = new PeekberryError(
          'Missing element context',
          ERROR_CODES.AI_CONTEXT_MISSING,
          context
        );
        logError(error);
        return { success: false, error: 'Element context is required' };
      }

      // Process with retry logic
      const response = await retryWithBackoff(
        async () => {
          const res = await fetch(
            `${this.API_BASE_URL}/api/ai/process-command`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authData.token}`,
              },
              body: JSON.stringify({
                command: requestData.command,
                context: requestData.context,
              }),
            }
          );

          if (!res.ok) {
            if (res.status === 401) {
              // Token expired or invalid
              await this.clearAuthToken();
              throw new PeekberryError(
                'Authentication expired',
                ERROR_CODES.AUTH_TOKEN_EXPIRED,
                context
              );
            }

            if (res.status === 429) {
              throw new PeekberryError(
                'Rate limit exceeded',
                ERROR_CODES.API_RATE_LIMIT,
                context,
                true // retryable
              );
            }

            if (res.status >= 500) {
              throw new PeekberryError(
                'Server error',
                ERROR_CODES.API_SERVER_ERROR,
                context,
                true // retryable
              );
            }

            const errorData = await res.json().catch(() => ({}));
            throw new PeekberryError(
              errorData.error || `API request failed: ${res.statusText}`,
              ERROR_CODES.AI_PROCESSING_FAILED,
              context
            );
          }

          return res;
        },
        {
          maxAttempts: 3,
          baseDelay: 1000,
          maxDelay: 5000,
          backoffMultiplier: 2,
        },
        context
      );

      const data = await response.json();

      if (!data.success) {
        throw new PeekberryError(
          data.error || 'Command processing failed',
          ERROR_CODES.AI_PROCESSING_FAILED,
          context
        );
      }

      return { success: true, data: data.data };
    } catch (error) {
      const peekberryError =
        error instanceof PeekberryError
          ? error
          : createPeekberryError(
              error as Error,
              ERROR_CODES.AI_PROCESSING_FAILED,
              context
            );

      logError(peekberryError);
      return {
        success: false,
        error: getUserFriendlyMessage(peekberryError),
      };
    }
  }

  /**
   * Capture screenshot and upload to webapp
   */
  private async captureScreenshot(
    metadata: {
      pageUrl: string;
      pageTitle: string;
      editCount: number;
      dimensions: { width: number; height: number };
    },
    tabId?: number
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const context = {
      component: 'BackgroundScript',
      operation: 'captureScreenshot',
      url: metadata.pageUrl,
      timestamp: new Date(),
    };

    try {
      if (!tabId) {
        const error = new PeekberryError(
          'No active tab found',
          ERROR_CODES.SCREENSHOT_CAPTURE_FAILED,
          context
        );
        logError(error);
        return {
          success: false,
          error: 'No active tab available for screenshot',
        };
      }

      const authData = await this.getStoredAuthToken();
      if (!authData || this.isTokenExpired(authData)) {
        const error = new PeekberryError(
          'Authentication required for screenshot',
          ERROR_CODES.AUTH_REQUIRED,
          context
        );
        logError(error);
        return {
          success: false,
          error: 'Please sign in to capture screenshots',
        };
      }

      // Capture screenshot using Chrome API with error handling
      const dataUrl = await new Promise<string>((resolve, reject) => {
        chrome.tabs.captureVisibleTab(
          {
            format: 'png',
            quality: 90,
          },
          (dataUrl) => {
            if (chrome.runtime.lastError) {
              const errorMessage =
                chrome.runtime.lastError.message || 'Screenshot capture failed';
              if (errorMessage.includes('permission')) {
                reject(
                  new PeekberryError(
                    'Screenshot permission denied',
                    ERROR_CODES.SCREENSHOT_PERMISSION_DENIED,
                    context
                  )
                );
              } else {
                reject(
                  new PeekberryError(
                    errorMessage,
                    ERROR_CODES.SCREENSHOT_CAPTURE_FAILED,
                    context,
                    true // retryable
                  )
                );
              }
            } else {
              resolve(dataUrl);
            }
          }
        );
      });

      // Convert data URL to blob
      const blob = await this.dataUrlToBlob(dataUrl);

      // Create form data for upload
      const formData = new FormData();
      const filename = `screenshot_${Date.now()}.png`;
      formData.append('file', blob, filename);
      formData.append(
        'metadata',
        JSON.stringify({
          pageUrl: metadata.pageUrl,
          pageTitle: metadata.pageTitle,
          editCount: metadata.editCount,
          dimensions: metadata.dimensions,
        })
      );

      // Upload to webapp with retry logic
      const response = await retryWithBackoff(
        async () => {
          const res = await fetch(`${this.API_BASE_URL}/api/screenshots`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${authData.token}`,
            },
            body: formData,
          });

          if (!res.ok) {
            if (res.status === 401) {
              await this.clearAuthToken();
              throw new PeekberryError(
                'Authentication expired',
                ERROR_CODES.AUTH_TOKEN_EXPIRED,
                context
              );
            }

            if (res.status === 413) {
              throw new PeekberryError(
                'Screenshot file too large',
                ERROR_CODES.SCREENSHOT_UPLOAD_FAILED,
                context
              );
            }

            if (res.status >= 500) {
              throw new PeekberryError(
                'Server error during upload',
                ERROR_CODES.API_SERVER_ERROR,
                context,
                true // retryable
              );
            }

            throw new PeekberryError(
              `Upload failed: ${res.statusText}`,
              ERROR_CODES.SCREENSHOT_UPLOAD_FAILED,
              context
            );
          }

          return res;
        },
        {
          maxAttempts: 2, // Only retry once for uploads
          baseDelay: 2000,
          maxDelay: 5000,
          backoffMultiplier: 2,
        },
        context
      );

      const result = await response.json();

      if (!result.success) {
        throw new PeekberryError(
          result.error || 'Screenshot upload failed',
          ERROR_CODES.SCREENSHOT_UPLOAD_FAILED,
          context
        );
      }

      return { success: true, data: result.data };
    } catch (error) {
      const peekberryError =
        error instanceof PeekberryError
          ? error
          : createPeekberryError(
              error as Error,
              ERROR_CODES.SCREENSHOT_CAPTURE_FAILED,
              context
            );

      logError(peekberryError);
      return {
        success: false,
        error: getUserFriendlyMessage(peekberryError),
      };
    }
  }

  /**
   * Convert data URL to Blob
   */
  private async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const response = await fetch(dataUrl);
    return response.blob();
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
