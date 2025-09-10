/**
 * Simplified notification system for Chrome extension
 * (Copied from src/utils/notifications.ts to avoid import issues)
 */

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationOptions {
  type: NotificationType;
  message: string;
  duration?: number;
  persistent?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

export interface NotificationElement extends HTMLElement {
  _peekberryNotificationId?: string;
}

class NotificationManager {
  private notifications: Map<string, NotificationElement> = new Map();
  private container: HTMLElement | null = null;
  private notificationCounter = 0;

  public show(options: NotificationOptions): string {
    const id = `peekberry-notification-${++this.notificationCounter}`;

    this.ensureContainer();

    const notification = this.createNotificationElement(id, options);

    if (this.container) {
      this.container.appendChild(notification);
      this.notifications.set(id, notification);

      requestAnimationFrame(() => {
        notification.classList.add('peekberry-notification-show');
      });

      if (!options.persistent) {
        const duration =
          options.duration || this.getDefaultDuration(options.type);
        setTimeout(() => {
          this.hide(id);
        }, duration);
      }
    }

    return id;
  }

  public hide(id: string): void {
    const notification = this.notifications.get(id);
    if (!notification) return;

    notification.classList.add('peekberry-notification-hide');

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      this.notifications.delete(id);
    }, 300);
  }

  public hideAll(): void {
    const ids = Array.from(this.notifications.keys());
    for (const id of ids) {
      this.hide(id);
    }
  }

  public success(
    message: string,
    options?: Partial<NotificationOptions>
  ): string {
    return this.show({
      type: 'success',
      message,
      ...options,
    });
  }

  public error(
    message: string,
    options?: Partial<NotificationOptions>
  ): string {
    return this.show({
      type: 'error',
      message,
      duration: 8000,
      ...options,
    });
  }

  public warning(
    message: string,
    options?: Partial<NotificationOptions>
  ): string {
    return this.show({
      type: 'warning',
      message,
      duration: 6000,
      ...options,
    });
  }

  public info(message: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      type: 'info',
      message,
      ...options,
    });
  }

  public authError(message: string = 'Please sign in to continue'): string {
    return this.show({
      type: 'error',
      message,
      persistent: true,
      actionLabel: 'Sign In',
      onAction: () => {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          chrome.runtime.sendMessage({ type: 'SYNC_AUTH_FROM_WEBAPP' });
        }
      },
    });
  }

  public retryError(message: string, retryFn: () => void): string {
    return this.show({
      type: 'error',
      message,
      persistent: true,
      actionLabel: 'Retry',
      onAction: retryFn,
    });
  }

  private ensureContainer(): void {
    if (this.container && document.body.contains(this.container)) {
      return;
    }

    this.container = document.createElement('div');
    this.container.className = 'peekberry-notifications-container';
    this.container.setAttribute('data-peekberry-element', 'true');

    this.injectStyles();

    document.body.appendChild(this.container);
  }

  private createNotificationElement(
    id: string,
    options: NotificationOptions
  ): NotificationElement {
    const notification = document.createElement('div') as NotificationElement;
    notification.className = `peekberry-notification peekberry-notification-${options.type}`;
    notification.setAttribute('data-peekberry-element', 'true');
    notification._peekberryNotificationId = id;

    const icon = this.getIconForType(options.type);

    notification.innerHTML = `
      <div class="peekberry-notification-content">
        <div class="peekberry-notification-icon">${icon}</div>
        <div class="peekberry-notification-message">${this.escapeHtml(options.message)}</div>
        <div class="peekberry-notification-actions">
          ${options.actionLabel ? `<button class="peekberry-notification-action" type="button">${this.escapeHtml(options.actionLabel)}</button>` : ''}
          <button class="peekberry-notification-close" type="button" title="Close">×</button>
        </div>
      </div>
    `;

    const closeBtn = notification.querySelector(
      '.peekberry-notification-close'
    );
    closeBtn?.addEventListener('click', () => this.hide(id));

    const actionBtn = notification.querySelector(
      '.peekberry-notification-action'
    );
    if (actionBtn && options.onAction) {
      actionBtn.addEventListener('click', () => {
        options.onAction!();
        this.hide(id);
      });
    }

    return notification;
  }

  private getIconForType(type: NotificationType): string {
    switch (type) {
      case 'success':
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;

      case 'error':
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"/>
          <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/>
        </svg>`;

      case 'warning':
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" stroke-width="2"/>
          <circle cx="12" cy="17" r="1" fill="currentColor"/>
        </svg>`;

      case 'info':
      default:
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <path d="M12 16v-4M12 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
    }
  }

  private getDefaultDuration(type: NotificationType): number {
    switch (type) {
      case 'success':
        return 4000;
      case 'error':
        return 8000;
      case 'warning':
        return 6000;
      case 'info':
      default:
        return 5000;
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private injectStyles(): void {
    if (document.querySelector('#peekberry-notification-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'peekberry-notification-styles';
    style.textContent = `
      .peekberry-notifications-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 2147483646;
        pointer-events: none;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .peekberry-notification {
        pointer-events: auto;
        background: #ffffff;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        margin-bottom: 12px;
        max-width: 400px;
        min-width: 300px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border-left: 4px solid #e5e7eb;
      }

      .peekberry-notification-show {
        opacity: 1;
        transform: translateX(0);
      }

      .peekberry-notification-hide {
        opacity: 0;
        transform: translateX(100%);
      }

      .peekberry-notification-success {
        border-left-color: #22c55e;
      }

      .peekberry-notification-error {
        border-left-color: #ef4444;
      }

      .peekberry-notification-warning {
        border-left-color: #f59e0b;
      }

      .peekberry-notification-info {
        border-left-color: #3b82f6;
      }

      .peekberry-notification-content {
        display: flex;
        align-items: flex-start;
        padding: 16px;
        gap: 12px;
      }

      .peekberry-notification-icon {
        flex-shrink: 0;
        margin-top: 2px;
      }

      .peekberry-notification-success .peekberry-notification-icon {
        color: #22c55e;
      }

      .peekberry-notification-error .peekberry-notification-icon {
        color: #ef4444;
      }

      .peekberry-notification-warning .peekberry-notification-icon {
        color: #f59e0b;
      }

      .peekberry-notification-info .peekberry-notification-icon {
        color: #3b82f6;
      }

      .peekberry-notification-message {
        flex: 1;
        font-size: 14px;
        line-height: 1.4;
        color: #374151;
        margin-top: 1px;
      }

      .peekberry-notification-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }

      .peekberry-notification-action {
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 4px 12px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;
      }

      .peekberry-notification-action:hover {
        background: #2563eb;
      }

      .peekberry-notification-close {
        background: none;
        border: none;
        color: #9ca3af;
        cursor: pointer;
        font-size: 18px;
        line-height: 1;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 2px;
        transition: color 0.2s;
      }

      .peekberry-notification-close:hover {
        color: #6b7280;
      }

      @media (max-width: 480px) {
        .peekberry-notifications-container {
          left: 10px;
          right: 10px;
          top: 10px;
        }

        .peekberry-notification {
          min-width: auto;
          max-width: none;
        }
      }
    `;

    document.head.appendChild(style);
  }
}

export const notifications = new NotificationManager();

export const showNotification = (options: NotificationOptions) =>
  notifications.show(options);
export const showSuccess = (
  message: string,
  options?: Partial<NotificationOptions>
) => notifications.success(message, options);
export const showError = (
  message: string,
  options?: Partial<NotificationOptions>
) => notifications.error(message, options);
export const showWarning = (
  message: string,
  options?: Partial<NotificationOptions>
) => notifications.warning(message, options);
export const showInfo = (
  message: string,
  options?: Partial<NotificationOptions>
) => notifications.info(message, options);
export const showAuthError = (message?: string) =>
  notifications.authError(message);
export const showRetryError = (message: string, retryFn: () => void) =>
  notifications.retryError(message, retryFn);
export const hideNotification = (id: string) => notifications.hide(id);
export const hideAllNotifications = () => notifications.hideAll();
