/**
 * Status indicator component for Chrome extension
 * Shows connection and performance status
 */

import { integrationManager, IntegrationStatus } from '../utils/integration';
import { performanceManager } from '../utils/performance';

export interface StatusIndicatorOptions {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showPerformance?: boolean;
  autoHide?: boolean;
  hideDelay?: number;
}

export class StatusIndicator {
  private container: HTMLElement | null = null;
  private options: StatusIndicatorOptions;
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(options: StatusIndicatorOptions = {}) {
    this.options = {
      position: 'top-right',
      showPerformance: false,
      autoHide: true,
      hideDelay: 5000,
      ...options,
    };

    this.initialize();
  }

  /**
   * Initialize status indicator
   */
  private initialize(): void {
    this.createContainer();
    this.setupEventListeners();
    this.startUpdating();
    this.injectStyles();
  }

  /**
   * Create status indicator container
   */
  private createContainer(): void {
    this.container = document.createElement('div');
    this.container.className = 'peekberry-status-indicator';
    this.container.setAttribute('data-peekberry-element', 'true');

    this.positionContainer();
    this.updateStatus();

    document.body.appendChild(this.container);

    // Auto-hide if enabled
    if (this.options.autoHide) {
      this.scheduleHide();
    }
  }

  /**
   * Position container based on options
   */
  private positionContainer(): void {
    if (!this.container) return;

    const positions = {
      'top-left': { top: '20px', left: '20px' },
      'top-right': { top: '20px', right: '20px' },
      'bottom-left': { bottom: '20px', left: '20px' },
      'bottom-right': { bottom: '20px', right: '20px' },
    };

    const position = positions[this.options.position!];
    Object.assign(this.container.style, {
      position: 'fixed',
      zIndex: '2147483644',
      ...position,
    });
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Show on hover if auto-hidden
    if (this.options.autoHide && this.container) {
      this.container.addEventListener('mouseenter', () => {
        this.show();
      });

      this.container.addEventListener('mouseleave', () => {
        this.scheduleHide();
      });
    }

    // Listen for integration status changes
    document.addEventListener('peekberry-loading-state-change', () => {
      this.updateStatus();
    });
  }

  /**
   * Start periodic updates
   */
  private startUpdating(): void {
    this.updateInterval = setInterval(() => {
      this.updateStatus();
    }, 2000); // Update every 2 seconds
  }

  /**
   * Update status display
   */
  private updateStatus(): void {
    if (!this.container) return;

    const integrationStatus = integrationManager.getConnectionStatus();
    const performanceMetrics = this.options.showPerformance
      ? performanceManager.getMetrics()
      : null;
    const isPerformanceDegraded = performanceManager.isPerformanceDegraded();

    this.container.innerHTML = this.createStatusHTML(
      integrationStatus,
      performanceMetrics,
      isPerformanceDegraded
    );

    // Update container class based on status
    this.container.className = `peekberry-status-indicator ${this.getStatusClass(integrationStatus, isPerformanceDegraded)}`;
  }

  /**
   * Create status HTML
   */
  private createStatusHTML(
    status: IntegrationStatus,
    metrics: any,
    isPerformanceDegraded: boolean
  ): string {
    const connectionIcon = this.getConnectionIcon(status);
    const performanceIcon = isPerformanceDegraded ? '⚠️' : '✅';

    let html = `
      <div class="peekberry-status-content">
        <div class="peekberry-status-row">
          <span class="peekberry-status-icon">${connectionIcon}</span>
          <span class="peekberry-status-text">${this.getConnectionText(status)}</span>
        </div>
    `;

    if (this.options.showPerformance) {
      html += `
        <div class="peekberry-status-row">
          <span class="peekberry-status-icon">${performanceIcon}</span>
          <span class="peekberry-status-text">${isPerformanceDegraded ? 'Performance Issues' : 'Performance OK'}</span>
        </div>
      `;

      if (metrics) {
        html += `
          <div class="peekberry-status-details">
            ${metrics.memoryUsage ? `<div>Memory: ${Math.round(metrics.memoryUsage / 1024 / 1024)}MB</div>` : ''}
            ${metrics.domNodes ? `<div>DOM: ${metrics.domNodes} nodes</div>` : ''}
          </div>
        `;
      }
    }

    html += '</div>';
    return html;
  }

  /**
   * Get connection icon
   */
  private getConnectionIcon(status: IntegrationStatus): string {
    if (!status.isConnected) return '🔴';
    if (!status.isAuthenticated) return '🟡';
    return '🟢';
  }

  /**
   * Get connection text
   */
  private getConnectionText(status: IntegrationStatus): string {
    if (!status.isConnected) return 'Disconnected';
    if (!status.isAuthenticated) return 'Not Authenticated';
    return 'Connected';
  }

  /**
   * Get status class for styling
   */
  private getStatusClass(
    status: IntegrationStatus,
    isPerformanceDegraded: boolean
  ): string {
    if (!status.isConnected) return 'peekberry-status-error';
    if (!status.isAuthenticated || isPerformanceDegraded)
      return 'peekberry-status-warning';
    return 'peekberry-status-success';
  }

  /**
   * Schedule auto-hide
   */
  private scheduleHide(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    if (this.options.autoHide) {
      this.hideTimeout = setTimeout(() => {
        this.hide();
      }, this.options.hideDelay);
    }
  }

  /**
   * Show status indicator
   */
  public show(): void {
    if (this.container) {
      this.container.classList.remove('peekberry-status-hidden');
      this.container.classList.add('peekberry-status-visible');
    }

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  /**
   * Hide status indicator
   */
  public hide(): void {
    if (this.container) {
      this.container.classList.remove('peekberry-status-visible');
      this.container.classList.add('peekberry-status-hidden');
    }
  }

  /**
   * Toggle visibility
   */
  public toggle(): void {
    if (this.container?.classList.contains('peekberry-status-hidden')) {
      this.show();
    } else {
      this.hide();
    }
  }

  /**
   * Inject CSS styles
   */
  private injectStyles(): void {
    if (document.querySelector('#peekberry-status-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'peekberry-status-styles';
    style.textContent = `
      .peekberry-status-indicator {
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(8px);
        border-radius: 8px;
        padding: 8px 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12px;
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
        min-width: 120px;
      }

      .peekberry-status-indicator.peekberry-status-hidden {
        opacity: 0;
        transform: translateY(-10px);
        pointer-events: none;
      }

      .peekberry-status-indicator.peekberry-status-visible {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }

      .peekberry-status-indicator.peekberry-status-success {
        border-color: rgba(34, 197, 94, 0.5);
      }

      .peekberry-status-indicator.peekberry-status-warning {
        border-color: rgba(245, 158, 11, 0.5);
      }

      .peekberry-status-indicator.peekberry-status-error {
        border-color: rgba(239, 68, 68, 0.5);
      }

      .peekberry-status-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .peekberry-status-row {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .peekberry-status-icon {
        font-size: 10px;
        flex-shrink: 0;
      }

      .peekberry-status-text {
        font-weight: 500;
        white-space: nowrap;
      }

      .peekberry-status-details {
        margin-top: 4px;
        padding-top: 4px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        font-size: 10px;
        color: rgba(255, 255, 255, 0.7);
      }

      .peekberry-status-details div {
        margin-bottom: 2px;
      }

      /* Mobile responsive */
      @media (max-width: 480px) {
        .peekberry-status-indicator {
          font-size: 11px;
          padding: 6px 10px;
          min-width: 100px;
        }
      }

      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .peekberry-status-indicator {
          transition: opacity 0.2s ease;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    this.container = null;
  }
}

// Export utility functions
export function createStatusIndicator(
  options?: StatusIndicatorOptions
): StatusIndicator {
  return new StatusIndicator(options);
}

export function showQuickStatus(
  message: string,
  type: 'success' | 'warning' | 'error' = 'success',
  duration: number = 3000
): void {
  const indicator = new StatusIndicator({
    autoHide: true,
    hideDelay: duration,
  });

  // Override the status display temporarily
  if ((indicator as any).container) {
    (indicator as any).container.innerHTML = `
      <div class="peekberry-status-content">
        <div class="peekberry-status-row">
          <span class="peekberry-status-icon">${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '❌'}</span>
          <span class="peekberry-status-text">${message}</span>
        </div>
      </div>
    `;
    (indicator as any).container.className =
      `peekberry-status-indicator peekberry-status-${type} peekberry-status-visible`;
  }

  // Auto-destroy after duration
  setTimeout(() => {
    indicator.destroy();
  }, duration + 500);
}
