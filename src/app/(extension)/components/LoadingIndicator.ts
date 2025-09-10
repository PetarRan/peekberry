/**
 * Loading indicator component for Chrome extension
 * Provides visual feedback for operations and data sync
 */

import { integrationManager, LoadingState } from '../utils/integration';

export interface LoadingIndicatorOptions {
  position?: 'top-right' | 'bottom-right' | 'center';
  theme?: 'dark' | 'light';
  showProgress?: boolean;
  showText?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export class LoadingIndicator {
  private container: HTMLElement | null = null;
  private activeIndicators: Map<string, HTMLElement> = new Map();
  private options: LoadingIndicatorOptions;

  constructor(options: LoadingIndicatorOptions = {}) {
    this.options = {
      position: 'top-right',
      theme: 'dark',
      showProgress: true,
      showText: true,
      size: 'medium',
      ...options,
    };

    this.initialize();
  }

  /**
   * Initialize loading indicator system
   */
  private initialize(): void {
    this.createContainer();
    this.setupEventListeners();
    this.injectStyles();
  }

  /**
   * Create container for loading indicators
   */
  private createContainer(): void {
    this.container = document.createElement('div');
    this.container.className = 'peekberry-loading-container';
    this.container.setAttribute('data-peekberry-element', 'true');

    // Position container based on options
    this.positionContainer();

    document.body.appendChild(this.container);
  }

  /**
   * Position container based on options
   */
  private positionContainer(): void {
    if (!this.container) return;

    const positions = {
      'top-right': {
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: '2147483645',
      },
      'bottom-right': {
        position: 'fixed',
        bottom: '80px', // Above bubble
        right: '20px',
        zIndex: '2147483645',
      },
      center: {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: '2147483645',
      },
    };

    const positionStyles = positions[this.options.position!];
    Object.assign(this.container.style, positionStyles);
  }

  /**
   * Setup event listeners for loading state changes
   */
  private setupEventListeners(): void {
    document.addEventListener(
      'peekberry-loading-state-change',
      (event: any) => {
        const { operationId, state } = event.detail;
        this.handleLoadingStateChange(operationId, state);
      }
    );
  }

  /**
   * Handle loading state changes
   */
  private handleLoadingStateChange(
    operationId: string,
    state: LoadingState
  ): void {
    if (state.isLoading) {
      this.showIndicator(operationId, state);
    } else {
      this.hideIndicator(operationId);
    }
  }

  /**
   * Show loading indicator for operation
   */
  public showIndicator(operationId: string, state: LoadingState): void {
    if (!this.container) return;

    // Remove existing indicator if present
    this.hideIndicator(operationId);

    const indicator = this.createIndicatorElement(operationId, state);
    this.activeIndicators.set(operationId, indicator);
    this.container.appendChild(indicator);

    // Animate in
    requestAnimationFrame(() => {
      indicator.classList.add('peekberry-loading-show');
    });
  }

  /**
   * Hide loading indicator for operation
   */
  public hideIndicator(operationId: string): void {
    const indicator = this.activeIndicators.get(operationId);
    if (!indicator) return;

    indicator.classList.add('peekberry-loading-hide');

    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
      this.activeIndicators.delete(operationId);
    }, 300);
  }

  /**
   * Create indicator element
   */
  private createIndicatorElement(
    operationId: string,
    state: LoadingState
  ): HTMLElement {
    const indicator = document.createElement('div');
    indicator.className = `peekberry-loading-indicator peekberry-loading-${this.options.theme} peekberry-loading-${this.options.size}`;
    indicator.setAttribute('data-operation-id', operationId);

    const content = this.createIndicatorContent(state);
    indicator.appendChild(content);

    return indicator;
  }

  /**
   * Create indicator content based on state
   */
  private createIndicatorContent(state: LoadingState): HTMLElement {
    const content = document.createElement('div');
    content.className = 'peekberry-loading-content';

    // Spinner
    const spinner = document.createElement('div');
    spinner.className = 'peekberry-loading-spinner';
    spinner.innerHTML = this.getSpinnerSVG();
    content.appendChild(spinner);

    // Text and progress
    if (this.options.showText || this.options.showProgress) {
      const textContainer = document.createElement('div');
      textContainer.className = 'peekberry-loading-text-container';

      if (this.options.showText && state.operation) {
        const text = document.createElement('div');
        text.className = 'peekberry-loading-text';
        text.textContent = state.operation;
        textContainer.appendChild(text);
      }

      if (this.options.showProgress && typeof state.progress === 'number') {
        const progressContainer = document.createElement('div');
        progressContainer.className = 'peekberry-loading-progress-container';

        const progressBar = document.createElement('div');
        progressBar.className = 'peekberry-loading-progress-bar';

        const progressFill = document.createElement('div');
        progressFill.className = 'peekberry-loading-progress-fill';
        progressFill.style.width = `${Math.max(0, Math.min(100, state.progress))}%`;

        progressBar.appendChild(progressFill);
        progressContainer.appendChild(progressBar);
        textContainer.appendChild(progressContainer);
      }

      content.appendChild(textContainer);
    }

    return content;
  }

  /**
   * Get spinner SVG
   */
  private getSpinnerSVG(): string {
    return `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="31.416" stroke-dashoffset="31.416">
          <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
          <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
        </circle>
      </svg>
    `;
  }

  /**
   * Update indicator progress
   */
  public updateProgress(operationId: string, progress: number): void {
    const indicator = this.activeIndicators.get(operationId);
    if (!indicator) return;

    const progressFill = indicator.querySelector(
      '.peekberry-loading-progress-fill'
    ) as HTMLElement;
    if (progressFill) {
      progressFill.style.width = `${Math.max(0, Math.min(100, progress))}%`;
    }
  }

  /**
   * Show global loading state
   */
  public showGlobalLoading(message: string = 'Loading...'): void {
    this.showIndicator('global', {
      isLoading: true,
      operation: message,
    });
  }

  /**
   * Hide global loading state
   */
  public hideGlobalLoading(): void {
    this.hideIndicator('global');
  }

  /**
   * Check if any indicators are active
   */
  public hasActiveIndicators(): boolean {
    return this.activeIndicators.size > 0;
  }

  /**
   * Clear all indicators
   */
  public clearAll(): void {
    const operationIds = Array.from(this.activeIndicators.keys());
    operationIds.forEach((id) => this.hideIndicator(id));
  }

  /**
   * Inject CSS styles
   */
  private injectStyles(): void {
    if (document.querySelector('#peekberry-loading-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'peekberry-loading-styles';
    style.textContent = `
      .peekberry-loading-container {
        pointer-events: none;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .peekberry-loading-indicator {
        pointer-events: auto;
        background: rgba(30, 30, 30, 0.95);
        backdrop-filter: blur(8px);
        border-radius: 8px;
        padding: 12px 16px;
        margin-bottom: 8px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
        min-width: 200px;
        max-width: 300px;
      }

      .peekberry-loading-indicator.peekberry-loading-light {
        background: rgba(255, 255, 255, 0.95);
        border-color: rgba(0, 0, 0, 0.1);
        color: #374151;
      }

      .peekberry-loading-show {
        opacity: 1;
        transform: translateX(0);
      }

      .peekberry-loading-hide {
        opacity: 0;
        transform: translateX(100%);
      }

      .peekberry-loading-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .peekberry-loading-spinner {
        flex-shrink: 0;
        color: #3b82f6;
        width: 20px;
        height: 20px;
      }

      .peekberry-loading-dark .peekberry-loading-spinner {
        color: #60a5fa;
      }

      .peekberry-loading-light .peekberry-loading-spinner {
        color: #3b82f6;
      }

      .peekberry-loading-text-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .peekberry-loading-text {
        font-size: 13px;
        font-weight: 500;
        color: #f0f0f0;
        line-height: 1.2;
      }

      .peekberry-loading-light .peekberry-loading-text {
        color: #374151;
      }

      .peekberry-loading-progress-container {
        width: 100%;
      }

      .peekberry-loading-progress-bar {
        width: 100%;
        height: 3px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
        overflow: hidden;
      }

      .peekberry-loading-light .peekberry-loading-progress-bar {
        background: rgba(0, 0, 0, 0.1);
      }

      .peekberry-loading-progress-fill {
        height: 100%;
        background: #3b82f6;
        border-radius: 2px;
        transition: width 0.3s ease;
      }

      .peekberry-loading-small {
        padding: 8px 12px;
        min-width: 150px;
      }

      .peekberry-loading-small .peekberry-loading-spinner {
        width: 16px;
        height: 16px;
      }

      .peekberry-loading-small .peekberry-loading-text {
        font-size: 12px;
      }

      .peekberry-loading-large {
        padding: 16px 20px;
        min-width: 250px;
      }

      .peekberry-loading-large .peekberry-loading-spinner {
        width: 24px;
        height: 24px;
      }

      .peekberry-loading-large .peekberry-loading-text {
        font-size: 14px;
      }

      /* Center position adjustments */
      .peekberry-loading-container[style*="transform: translate(-50%, -50%)"] .peekberry-loading-indicator {
        transform: scale(0.8);
        margin-bottom: 0;
      }

      .peekberry-loading-container[style*="transform: translate(-50%, -50%)"] .peekberry-loading-show {
        transform: scale(1);
      }

      .peekberry-loading-container[style*="transform: translate(-50%, -50%)"] .peekberry-loading-hide {
        transform: scale(0.8);
      }

      /* Mobile responsive */
      @media (max-width: 480px) {
        .peekberry-loading-indicator {
          min-width: 180px;
          max-width: calc(100vw - 40px);
        }
      }

      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .peekberry-loading-indicator {
          transition: opacity 0.2s ease;
        }
        
        .peekberry-loading-spinner svg {
          animation: none;
        }
        
        .peekberry-loading-progress-fill {
          transition: none;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.clearAll();

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    this.activeIndicators.clear();
    this.container = null;
  }
}

// Export singleton instance
export const loadingIndicator = new LoadingIndicator();

// Utility functions
export function showLoading(
  operationId: string,
  operation: string,
  progress?: number
): void {
  loadingIndicator.showIndicator(operationId, {
    isLoading: true,
    operation,
    progress,
  });
}

export function hideLoading(operationId: string): void {
  loadingIndicator.hideIndicator(operationId);
}

export function updateLoadingProgress(
  operationId: string,
  progress: number
): void {
  loadingIndicator.updateProgress(operationId, progress);
}
