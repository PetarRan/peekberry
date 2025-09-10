/**
 * Performance optimization utilities for Chrome extension
 * Handles cross-browser compatibility and performance monitoring
 */

export interface PerformanceMetrics {
  memoryUsage?: number;
  domNodes?: number;
  eventListeners?: number;
  operationTimes: Map<string, number>;
  errors: Array<{ timestamp: Date; error: string; context?: string }>;
}

export interface BrowserCapabilities {
  supportsWebP: boolean;
  supportsIntersectionObserver: boolean;
  supportsResizeObserver: boolean;
  supportsRequestIdleCallback: boolean;
  supportsPassiveListeners: boolean;
  maxTextureSize?: number;
  devicePixelRatio: number;
}

class PerformanceManager {
  private metrics: PerformanceMetrics = {
    operationTimes: new Map(),
    errors: [],
  };

  private capabilities: BrowserCapabilities;
  private observers: Map<string, any> = new Map();
  private throttledFunctions: Map<string, Function> = new Map();
  private debouncedFunctions: Map<string, Function> = new Map();

  constructor() {
    this.capabilities = this.detectBrowserCapabilities();
    this.initializePerformanceMonitoring();
  }

  /**
   * Detect browser capabilities for optimization
   */
  private detectBrowserCapabilities(): BrowserCapabilities {
    const capabilities: BrowserCapabilities = {
      supportsWebP: false,
      supportsIntersectionObserver: 'IntersectionObserver' in window,
      supportsResizeObserver: 'ResizeObserver' in window,
      supportsRequestIdleCallback: 'requestIdleCallback' in window,
      supportsPassiveListeners: this.detectPassiveListenerSupport(),
      devicePixelRatio: window.devicePixelRatio || 1,
    };

    // Test WebP support
    this.testWebPSupport().then((supported) => {
      capabilities.supportsWebP = supported;
    });

    // Detect max texture size for canvas operations
    try {
      const canvas = document.createElement('canvas');
      const gl =
        canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl && 'getParameter' in gl) {
        const webglContext = gl as WebGLRenderingContext;
        capabilities.maxTextureSize = webglContext.getParameter(
          webglContext.MAX_TEXTURE_SIZE
        );
      }
    } catch (e) {
      // WebGL not supported
    }

    return capabilities;
  }

  /**
   * Test passive listener support
   */
  private detectPassiveListenerSupport(): boolean {
    let supportsPassive = false;
    try {
      const opts = Object.defineProperty({}, 'passive', {
        get: () => {
          supportsPassive = true;
          return true;
        },
      });
      window.addEventListener('testPassive', () => {}, opts);
      window.removeEventListener('testPassive', () => {}, opts);
    } catch (e) {
      // Not supported
    }
    return supportsPassive;
  }

  /**
   * Test WebP support
   */
  private async testWebPSupport(): Promise<boolean> {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src =
        'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    // Monitor memory usage if available
    if ('memory' in performance) {
      setInterval(() => {
        this.updateMemoryMetrics();
      }, 30000); // Every 30 seconds
    }

    // Monitor DOM changes
    if (this.capabilities.supportsResizeObserver) {
      this.setupDOMMonitoring();
    }

    // Monitor errors
    window.addEventListener('error', (event) => {
      this.recordError(event.error?.message || 'Unknown error', 'global');
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.recordError(
        event.reason?.message || 'Unhandled promise rejection',
        'promise'
      );
    });
  }

  /**
   * Update memory metrics
   */
  private updateMemoryMetrics(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize;
    }

    // Count DOM nodes
    this.metrics.domNodes = document.querySelectorAll('*').length;
  }

  /**
   * Setup DOM monitoring
   */
  private setupDOMMonitoring(): void {
    if (!this.capabilities.supportsResizeObserver) return;

    const resizeObserver = new ResizeObserver((entries) => {
      // Throttle resize handling
      this.throttle(
        'resize-handler',
        () => {
          this.handleResize(entries);
        },
        100
      )();
    });

    // Observe document body
    resizeObserver.observe(document.body);
    this.observers.set('resize', resizeObserver);
  }

  /**
   * Handle resize events
   */
  private handleResize(entries: ResizeObserverEntry[]): void {
    // Notify components about layout changes
    const event = new CustomEvent('peekberry-layout-change', {
      detail: { entries },
    });
    document.dispatchEvent(event);
  }

  /**
   * Record performance timing
   */
  public startTiming(operation: string): () => void {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.metrics.operationTimes.set(operation, duration);

      // Log slow operations
      if (duration > 100) {
        console.warn(
          `Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`
        );
      }
    };
  }

  /**
   * Record error
   */
  public recordError(error: string, context?: string): void {
    this.metrics.errors.push({
      timestamp: new Date(),
      error,
      context,
    });

    // Keep only last 50 errors
    if (this.metrics.errors.length > 50) {
      this.metrics.errors = this.metrics.errors.slice(-50);
    }
  }

  /**
   * Throttle function execution
   */
  public throttle(key: string, func: Function, delay: number): Function {
    if (this.throttledFunctions.has(key)) {
      return this.throttledFunctions.get(key)!;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let lastExecTime = 0;

    const throttledFunc = (...args: any[]) => {
      const currentTime = Date.now();

      if (currentTime - lastExecTime > delay) {
        func.apply(this, args);
        lastExecTime = currentTime;
      } else {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(
          () => {
            func.apply(this, args);
            lastExecTime = Date.now();
          },
          delay - (currentTime - lastExecTime)
        );
      }
    };

    this.throttledFunctions.set(key, throttledFunc);
    return throttledFunc;
  }

  /**
   * Debounce function execution
   */
  public debounce(key: string, func: Function, delay: number): Function {
    if (this.debouncedFunctions.has(key)) {
      return this.debouncedFunctions.get(key)!;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const debouncedFunc = (...args: any[]) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };

    this.debouncedFunctions.set(key, debouncedFunc);
    return debouncedFunc;
  }

  /**
   * Optimize image for current browser
   */
  public optimizeImageFormat(originalFormat: string): string {
    if (this.capabilities.supportsWebP && originalFormat !== 'svg') {
      return 'webp';
    }
    return originalFormat;
  }

  /**
   * Get optimal canvas size for device
   */
  public getOptimalCanvasSize(
    width: number,
    height: number
  ): { width: number; height: number } {
    const maxSize = this.capabilities.maxTextureSize || 4096;
    const ratio = Math.min(maxSize / width, maxSize / height, 1);

    return {
      width: Math.floor(width * ratio),
      height: Math.floor(height * ratio),
    };
  }

  /**
   * Add event listener with optimal options
   */
  public addEventListener(
    element: Element | Window | Document,
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions
  ): void {
    const optimizedOptions = {
      ...options,
      passive:
        this.capabilities.supportsPassiveListeners &&
        options?.passive !== false &&
        ['scroll', 'wheel', 'touchstart', 'touchmove'].includes(event),
    };

    element.addEventListener(event, handler, optimizedOptions);
  }

  /**
   * Schedule work during idle time
   */
  public scheduleIdleWork(callback: () => void, timeout: number = 5000): void {
    if (this.capabilities.supportsRequestIdleCallback) {
      requestIdleCallback(callback, { timeout });
    } else {
      // Fallback to setTimeout
      setTimeout(callback, 0);
    }
  }

  /**
   * Batch DOM operations for better performance
   */
  public batchDOMOperations(operations: Array<() => void>): void {
    requestAnimationFrame(() => {
      // Use document fragment for multiple DOM insertions
      const fragment = document.createDocumentFragment();
      let useFragment = false;

      operations.forEach((operation) => {
        try {
          operation();
        } catch (error) {
          this.recordError(
            error instanceof Error ? error.message : 'DOM operation failed',
            'batch-dom'
          );
        }
      });
    });
  }

  /**
   * Monitor intersection for lazy loading
   */
  public observeIntersection(
    elements: Element[],
    callback: (entries: IntersectionObserverEntry[]) => void,
    options?: IntersectionObserverInit
  ): IntersectionObserver | null {
    if (!this.capabilities.supportsIntersectionObserver) {
      // Fallback: trigger callback immediately
      setTimeout(() => {
        const mockEntries = elements.map((el) => ({
          target: el,
          isIntersecting: true,
        })) as IntersectionObserverEntry[];
        callback(mockEntries);
      }, 0);
      return null;
    }

    const observer = new IntersectionObserver(callback, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options,
    });

    elements.forEach((el) => observer.observe(el));
    return observer;
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    this.updateMemoryMetrics();
    return { ...this.metrics };
  }

  /**
   * Get browser capabilities
   */
  public getCapabilities(): BrowserCapabilities {
    return { ...this.capabilities };
  }

  /**
   * Check if performance is degraded
   */
  public isPerformanceDegraded(): boolean {
    const metrics = this.getMetrics();

    // Check memory usage (if available)
    if (metrics.memoryUsage && metrics.memoryUsage > 100 * 1024 * 1024) {
      // 100MB
      return true;
    }

    // Check DOM node count
    if (metrics.domNodes && metrics.domNodes > 10000) {
      return true;
    }

    // Check for recent errors
    const recentErrors = metrics.errors.filter(
      (error) => Date.now() - error.timestamp.getTime() < 60000 // Last minute
    );
    if (recentErrors.length > 5) {
      return true;
    }

    return false;
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    // Disconnect observers
    this.observers.forEach((observer) => {
      if (observer && typeof observer.disconnect === 'function') {
        observer.disconnect();
      }
    });
    this.observers.clear();

    // Clear cached functions
    this.throttledFunctions.clear();
    this.debouncedFunctions.clear();

    // Clear metrics
    this.metrics.operationTimes.clear();
    this.metrics.errors.length = 0;
  }
}

// Export singleton instance
export const performanceManager = new PerformanceManager();

// Utility functions
export function measurePerformance<T>(
  operation: string,
  func: () => T | Promise<T>
): T | Promise<T> {
  const endTiming = performanceManager.startTiming(operation);

  try {
    const result = func();

    if (result instanceof Promise) {
      return result.finally(() => {
        endTiming();
      });
    } else {
      endTiming();
      return result;
    }
  } catch (error) {
    endTiming();
    performanceManager.recordError(
      error instanceof Error ? error.message : 'Unknown error',
      operation
    );
    throw error;
  }
}

export function optimizeForDevice<T>(
  mobileCallback: () => T,
  desktopCallback: () => T
): T {
  const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
  return isMobile ? mobileCallback() : desktopCallback();
}

export function isLowEndDevice(): boolean {
  const capabilities = performanceManager.getCapabilities();

  // Check various indicators of low-end device
  const indicators = [
    navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2,
    capabilities.devicePixelRatio < 2,
    !capabilities.supportsWebP,
    !capabilities.supportsIntersectionObserver,
  ];

  return indicators.filter(Boolean).length >= 2;
}
