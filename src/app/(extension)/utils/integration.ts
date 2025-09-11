/**
 * Integration utilities for connecting extension with webapp
 * Handles data flow, loading states, and cross-browser compatibility
 */

import {
  PeekberryError,
  ERROR_CODES,
  logError,
  getUserFriendlyMessage,
  createPeekberryError,
} from './errorHandling';

export interface LoadingState {
  isLoading: boolean;
  operation?: string;
  progress?: number;
}

export interface IntegrationStatus {
  isConnected: boolean;
  isAuthenticated: boolean;
  lastSync?: Date;
  version?: string;
  features?: string[];
}

export interface DataSyncOptions {
  immediate?: boolean;
  retryOnFailure?: boolean;
  showProgress?: boolean;
  timeout?: number;
}

class IntegrationManager {
  private loadingStates: Map<string, LoadingState> = new Map();
  private syncQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;
  private connectionStatus: IntegrationStatus = {
    isConnected: false,
    isAuthenticated: false,
  };

  /**
   * Initialize integration manager
   */
  public async initialize(): Promise<void> {
    try {
      // Check browser compatibility (non-blocking)
      try {
        this.checkBrowserCompatibility();
      } catch (compatibilityError) {
        console.warn('Peekberry: Browser compatibility check failed:', compatibilityError);
        // Continue with limited functionality
      }

      // Initialize connection status
      await this.updateConnectionStatus();

      // Set up periodic health checks
      this.setupHealthChecks();

      console.log('Peekberry integration manager initialized');
    } catch (error) {
      console.warn('Peekberry: Integration manager initialization failed:', error);
      // Don't throw the error, just log it and continue with limited functionality
    }
  }

  /**
   * Check browser compatibility and feature support
   */
  private checkBrowserCompatibility(): void {
    // Features available in content scripts
    const contentScriptFeatures = [
      'chrome.runtime',
      'fetch',
      'Promise',
      'MutationObserver',
    ];

    // Features available in background scripts (not checked in content script)
    const backgroundScriptFeatures = [
      'chrome.storage',
      'chrome.tabs',
    ];

    const missingFeatures: string[] = [];

    // Only check features available in content scripts
    contentScriptFeatures.forEach((feature) => {
      if (feature.includes('.')) {
        const [obj, prop] = feature.split('.');
        if (!(window as any)[obj] || !(window as any)[obj][prop]) {
          missingFeatures.push(feature);
        }
      } else if (!(window as any)[feature]) {
        missingFeatures.push(feature);
      }
    });

    if (missingFeatures.length > 0) {
      throw new PeekberryError(
        `Missing required browser features: ${missingFeatures.join(', ')}`,
        ERROR_CODES.EXTENSION_NOT_AVAILABLE,
        {
          component: 'IntegrationManager',
          operation: 'checkBrowserCompatibility',
          url: window.location.href,
          timestamp: new Date(),
        }
      );
    }

    // Update connection status with supported features
    this.connectionStatus.features = [...contentScriptFeatures, ...backgroundScriptFeatures];
    this.connectionStatus.version = chrome.runtime.getManifest().version;
  }

  /**
   * Update connection status with webapp
   */
  private async updateConnectionStatus(): Promise<void> {
    try {
      // Check if extension runtime is available
      if (!chrome?.runtime) {
        this.connectionStatus.isConnected = false;
        return;
      }

      // Check authentication status
      const authStatus = await this.sendMessage('GET_AUTH_STATUS');
      this.connectionStatus.isAuthenticated =
        authStatus?.data?.isAuthenticated || false;
      this.connectionStatus.isConnected = true;
      this.connectionStatus.lastSync = new Date();
    } catch (error) {
      this.connectionStatus.isConnected = false;
      this.connectionStatus.isAuthenticated = false;
    }
  }

  /**
   * Set up periodic health checks
   */
  private setupHealthChecks(): void {
    // Check connection every 30 seconds
    setInterval(async () => {
      await this.updateConnectionStatus();
    }, 30000);

    // Process sync queue every 5 seconds
    setInterval(() => {
      this.processSyncQueue();
    }, 5000);
  }

  /**
   * Send message to background script with enhanced error handling
   */
  public async sendMessage(
    type: string,
    payload?: any,
    options: DataSyncOptions = {}
  ): Promise<any> {
    const operationId = `${type}_${Date.now()}`;

    try {
      // Set loading state
      if (options.showProgress) {
        this.setLoadingState(operationId, {
          isLoading: true,
          operation: type,
        });
      }

      // Create timeout promise
      const timeoutMs = options.timeout || 10000;
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(
            new PeekberryError(
              `Operation ${type} timed out after ${timeoutMs}ms`,
              ERROR_CODES.API_TIMEOUT,
              {
                component: 'IntegrationManager',
                operation: type,
                url: window.location.href,
                timestamp: new Date(),
              },
              true // retryable
            )
          );
        }, timeoutMs);
      });

      // Send message with timeout
      const messagePromise = new Promise((resolve, reject) => {
        if (!chrome?.runtime) {
          reject(
            new PeekberryError(
              'Chrome extension runtime not available',
              ERROR_CODES.EXTENSION_NOT_AVAILABLE,
              {
                component: 'IntegrationManager',
                operation: type,
                url: window.location.href,
                timestamp: new Date(),
              }
            )
          );
          return;
        }

        chrome.runtime.sendMessage({ type, payload }, (response) => {
          if (chrome.runtime.lastError) {
            reject(
              createPeekberryError(
                new Error(chrome.runtime.lastError.message || 'Runtime error'),
                ERROR_CODES.BACKGROUND_SCRIPT_ERROR,
                {
                  component: 'IntegrationManager',
                  operation: type,
                  url: window.location.href,
                  timestamp: new Date(),
                },
                true // retryable
              )
            );
          } else {
            resolve(response);
          }
        });
      });

      const result = await Promise.race([messagePromise, timeoutPromise]);

      // Clear loading state
      if (options.showProgress) {
        this.clearLoadingState(operationId);
      }

      return result;
    } catch (error) {
      // Clear loading state on error
      if (options.showProgress) {
        this.clearLoadingState(operationId);
      }

      // Handle retry logic
      if (
        options.retryOnFailure &&
        error instanceof PeekberryError &&
        error.isRetryable
      ) {
        console.warn(`Retrying operation ${type} due to error:`, error.message);
        // Add to sync queue for retry
        this.addToSyncQueue(() =>
          this.sendMessage(type, payload, { ...options, retryOnFailure: false })
        );
      }

      throw error;
    }
  }

  /**
   * Sync data with webapp
   */
  public async syncWithWebapp(options: DataSyncOptions = {}): Promise<void> {
    try {
      if (options.immediate) {
        await this.performSync();
      } else {
        this.addToSyncQueue(() => this.performSync());
      }
    } catch (error) {
      logError(
        createPeekberryError(error as Error, ERROR_CODES.AUTH_SYNC_FAILED, {
          component: 'IntegrationManager',
          operation: 'syncWithWebapp',
          url: window.location.href,
          timestamp: new Date(),
        })
      );
    }
  }

  /**
   * Perform actual sync operation
   */
  private async performSync(): Promise<void> {
    const operationId = 'sync_webapp';

    try {
      this.setLoadingState(operationId, {
        isLoading: true,
        operation: 'Syncing with webapp',
        progress: 0,
      });

      // Step 1: Sync authentication
      this.updateLoadingProgress(operationId, 25);
      await this.sendMessage('SYNC_AUTH_FROM_WEBAPP');

      // Step 2: Update connection status
      this.updateLoadingProgress(operationId, 50);
      await this.updateConnectionStatus();

      // Step 3: Verify token
      this.updateLoadingProgress(operationId, 75);
      await this.sendMessage('VERIFY_TOKEN');

      // Step 4: Complete
      this.updateLoadingProgress(operationId, 100);

      console.log('Webapp sync completed successfully');
    } finally {
      this.clearLoadingState(operationId);
    }
  }

  /**
   * Add operation to sync queue
   */
  private addToSyncQueue(operation: () => Promise<void>): void {
    this.syncQueue.push(operation);
    this.processSyncQueue();
  }

  /**
   * Process sync queue
   */
  private async processSyncQueue(): Promise<void> {
    if (this.isProcessingQueue || this.syncQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      while (this.syncQueue.length > 0) {
        const operation = this.syncQueue.shift();
        if (operation) {
          try {
            await operation();
          } catch (error) {
            console.error('Sync queue operation failed:', error);
          }
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Set loading state for an operation
   */
  public setLoadingState(operationId: string, state: LoadingState): void {
    this.loadingStates.set(operationId, state);
    this.notifyLoadingStateChange(operationId, state);
  }

  /**
   * Update loading progress
   */
  public updateLoadingProgress(operationId: string, progress: number): void {
    const currentState = this.loadingStates.get(operationId);
    if (currentState) {
      const updatedState = { ...currentState, progress };
      this.loadingStates.set(operationId, updatedState);
      this.notifyLoadingStateChange(operationId, updatedState);
    }
  }

  /**
   * Clear loading state
   */
  public clearLoadingState(operationId: string): void {
    this.loadingStates.delete(operationId);
    this.notifyLoadingStateChange(operationId, { isLoading: false });
  }

  /**
   * Get current loading state
   */
  public getLoadingState(operationId: string): LoadingState | undefined {
    return this.loadingStates.get(operationId);
  }

  /**
   * Get all loading states
   */
  public getAllLoadingStates(): Map<string, LoadingState> {
    return new Map(this.loadingStates);
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): IntegrationStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Notify loading state changes to UI
   */
  private notifyLoadingStateChange(
    operationId: string,
    state: LoadingState
  ): void {
    // Dispatch custom event for UI components to listen to
    const event = new CustomEvent('peekberry-loading-state-change', {
      detail: { operationId, state },
    });
    document.dispatchEvent(event);
  }

  /**
   * Performance optimization: Batch DOM operations
   */
  public batchDOMOperations(operations: Array<() => void>): void {
    // Use requestAnimationFrame for smooth DOM updates
    requestAnimationFrame(() => {
      operations.forEach((operation) => {
        try {
          operation();
        } catch (error) {
          console.error('Batched DOM operation failed:', error);
        }
      });
    });
  }

  /**
   * Memory management: Clean up resources
   */
  public cleanup(): void {
    this.loadingStates.clear();
    this.syncQueue.length = 0;
    this.isProcessingQueue = false;
  }
}

// Export singleton instance
export const integrationManager = new IntegrationManager();

// Don't auto-initialize - let the content script handle initialization
// This prevents errors during module loading when APIs might not be ready

// Export utility functions
export function withLoadingState<T>(
  operationId: string,
  operation: () => Promise<T>,
  operationName?: string
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    try {
      integrationManager.setLoadingState(operationId, {
        isLoading: true,
        operation: operationName || operationId,
      });

      const result = await operation();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      integrationManager.clearLoadingState(operationId);
    }
  });
}

export function isFeatureSupported(feature: string): boolean {
  const status = integrationManager.getConnectionStatus();
  return status.features?.includes(feature) || false;
}

export function getIntegrationHealth(): {
  status: 'healthy' | 'degraded' | 'offline';
  details: IntegrationStatus;
} {
  const status = integrationManager.getConnectionStatus();

  if (!status.isConnected) {
    return { status: 'offline', details: status };
  }

  if (!status.isAuthenticated) {
    return { status: 'degraded', details: status };
  }

  return { status: 'healthy', details: status };
}
