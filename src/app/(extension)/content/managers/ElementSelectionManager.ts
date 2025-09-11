/**
 * Element Selection Manager
 * Handles DOM element selection, highlighting, and interaction
 */

import { performanceManager } from '../../utils/performance';

export interface ElementContext {
  selector: string;
  tagName: string;
  id?: string;
  className?: string;
  textContent?: string;
  computedStyles: Partial<CSSStyleDeclaration>;
  boundingRect: DOMRect;
}

export class ElementSelectionManager {
  private isActive = false;
  private selectedElements: HTMLElement[] = [];
  private highlightedElement: HTMLElement | null = null;
  private lastHighlightedElement: HTMLElement | null = null;
  private lastMouseOverTime = 0;
  private elementInfoTooltip: HTMLElement | null = null;
  private tooltipThrottle: ReturnType<typeof setTimeout> | null = null;

  private readonly CSS_CLASSES = {
    HIGHLIGHT: 'peekberry-highlight',
    SELECTED: 'peekberry-selected',
  };

  constructor() {
    this.setupEventHandlers();
  }

  /**
   * Enable element selection mode
   */
  public enable(): void {
    if (this.isActive) return;

    console.log('Peekberry: Enabling PERFORMANT element selection');
    this.isActive = true;
    this.startListening();

    console.log('Peekberry: DOM selection enabled - hover and click elements to select');
  }

  /**
   * Disable element selection mode
   */
  public disable(): void {
    if (!this.isActive) return;

    console.log('Peekberry: Disabling element selection');
    this.isActive = false;
    this.stopListening();
  }

  /**
   * Check if selection is active
   */
  public isSelectionActive(): boolean {
    return this.isActive;
  }

  /**
   * Get selected elements
   */
  public getSelectedElements(): HTMLElement[] {
    return [...this.selectedElements];
  }

  /**
   * Clear selected elements
   */
  public clearSelection(): void {
    this.selectedElements.forEach((el) => {
      el.classList.remove(this.CSS_CLASSES.SELECTED);
    });
    this.selectedElements = [];
  }

  /**
   * Remove selected element by index
   */
  public removeSelectedElement(index: number): void {
    const element = this.selectedElements[index];
    if (element) {
      element.classList.remove(this.CSS_CLASSES.SELECTED);
      this.selectedElements.splice(index, 1);
    }
  }

  /**
   * Start listening for mouse events
   */
  private startListening(): void {
    document.addEventListener('mouseover', this.handleMouseOverThrottled, {
      capture: true,
      passive: true,
    });
    document.addEventListener('mouseout', this.handleMouseOutThrottled, {
      capture: true,
      passive: true,
    });
    document.addEventListener('click', this.handleElementClick, {
      capture: true,
    });

    console.log('Peekberry: PERFORMANT element selection listeners attached');
  }

  /**
   * Stop listening for mouse events
   */
  private stopListening(): void {
    document.removeEventListener('mouseover', this.handleMouseOverThrottled, {
      capture: true,
    });
    document.removeEventListener('mouseout', this.handleMouseOutThrottled, {
      capture: true,
    });
    document.removeEventListener('click', this.handleElementClick, {
      capture: true,
    });

    if (this.highlightedElement) {
      this.removeHighlight(this.highlightedElement);
      this.highlightedElement = null;
      this.lastHighlightedElement = null;
    }

    this.hideElementTooltip();
    this.lastMouseOverTime = 0;

    console.log('Peekberry: PERFORMANT element selection listeners removed');
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.handleMouseOverThrottled = this.handleMouseOverThrottled.bind(this);
    this.handleMouseOutThrottled = this.handleMouseOutThrottled.bind(this);
    this.handleElementClick = this.handleElementClick.bind(this);
  }

  /**
   * PERFORMANT throttled mouse over handler
   */
  private handleMouseOverThrottled = (e: MouseEvent): void => {
    if (!this.isActive) return;

    // AGGRESSIVE throttling - only process every 200ms
    const now = Date.now();
    if (now - this.lastMouseOverTime < 200) {
      return;
    }
    this.lastMouseOverTime = now;

    const target = e.target as HTMLElement;

    // Skip Peekberry elements
    if (this.isPeekberryElement(target)) {
      return;
    }

    // Skip non-selectable elements
    if (this.isNonSelectableElement(target)) {
      return;
    }

    // Find selectable element (cached to avoid repeated queries)
    const selectableElement = this.findSelectableElement(target);
    if (
      !selectableElement ||
      selectableElement === this.lastHighlightedElement
    ) {
      return;
    }

    // Remove previous highlight
    if (this.highlightedElement) {
      this.removeHighlight(this.highlightedElement);
    }

    // Add new highlight
    this.highlightElement(selectableElement);
    this.highlightedElement = selectableElement;
    this.lastHighlightedElement = selectableElement;
  };

  /**
   * PERFORMANT throttled mouse out handler
   */
  private handleMouseOutThrottled = (e: MouseEvent): void => {
    if (!this.isActive) return;

    const target = e.target as HTMLElement;
    if (
      this.isPeekberryElement(target) ||
      this.isNonSelectableElement(target)
    ) {
      return;
    }

    // Simple delayed cleanup
    setTimeout(() => {
      if (
        this.highlightedElement &&
        !this.highlightedElement.matches(':hover')
      ) {
        this.removeHighlight(this.highlightedElement);
        this.highlightedElement = null;
        this.lastHighlightedElement = null;
      }
    }, 100);
  };

  /**
   * Handle element click for selection
   */
  private handleElementClick = (e: MouseEvent): void => {
    if (!this.isActive) return;

    const target = e.target as HTMLElement;

    // IMPORTANT: Let Peekberry elements handle their own clicks!
    if (this.isPeekberryElement(target)) {
      return; // Don't prevent default, let the bubble/chat work normally
    }

    // Only prevent default for non-Peekberry elements
    e.preventDefault();
    e.stopPropagation();

    this.selectElement(target);

    // Show success feedback
    console.log(`Peekberry: Selected: ${this.getElementDisplayName(target)}`);
  };

  /**
   * Select an element
   */
  private selectElement(element: HTMLElement): void {
    if (!this.selectedElements.includes(element)) {
      this.selectedElements.push(element);
      element.classList.add(this.CSS_CLASSES.SELECTED);
    }
  }

  /**
   * Highlight an element
   */
  private highlightElement(element: HTMLElement): void {
    // Remove any existing highlights first
    this.removeAllHighlights();

    // Add highlight class
    element.classList.add(this.CSS_CLASSES.HIGHLIGHT);

    // Store original styles to restore later if needed
    const originalOutline = element.style.outline;
    const originalOutlineOffset = element.style.outlineOffset;

    element.setAttribute('data-peekberry-original-outline', originalOutline);
    element.setAttribute(
      'data-peekberry-original-outline-offset',
      originalOutlineOffset
    );
  }

  /**
   * Remove highlight from an element
   */
  private removeHighlight(element: HTMLElement): void {
    element.classList.remove(this.CSS_CLASSES.HIGHLIGHT);

    // Restore original outline styles
    const originalOutline = element.getAttribute(
      'data-peekberry-original-outline'
    );
    const originalOutlineOffset = element.getAttribute(
      'data-peekberry-original-outline-offset'
    );

    if (originalOutline !== null) {
      element.style.outline = originalOutline;
      element.removeAttribute('data-peekberry-original-outline');
    }

    if (originalOutlineOffset !== null) {
      element.style.outlineOffset = originalOutlineOffset;
      element.removeAttribute('data-peekberry-original-outline-offset');
    }
  }

  /**
   * Remove all highlights from the page
   */
  private removeAllHighlights(): void {
    const highlightedElements = document.querySelectorAll(
      `.${this.CSS_CLASSES.HIGHLIGHT}`
    );
    highlightedElements.forEach((element) => {
      this.removeHighlight(element as HTMLElement);
    });
    this.hideElementTooltip();
  }

  /**
   * Hide element tooltip
   */
  private hideElementTooltip(): void {
    if (this.elementInfoTooltip) {
      this.elementInfoTooltip.remove();
      this.elementInfoTooltip = null;
    }
    if (this.tooltipThrottle) {
      clearTimeout(this.tooltipThrottle);
      this.tooltipThrottle = null;
    }
  }

  /**
   * Check if element is part of Peekberry UI
   */
  private isPeekberryElement(element: HTMLElement): boolean {
    return (
      element.closest('.peekberry-bubble') !== null ||
      element.closest('.peekberry-chat-panel') !== null ||
      element.hasAttribute('data-peekberry-element')
    );
  }

  /**
   * Check if element should not be selectable
   */
  private isNonSelectableElement(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();

    // Skip script, style, meta, and other non-visual elements
    const nonVisualTags = ['script', 'style', 'meta', 'link', 'title', 'head'];
    if (nonVisualTags.includes(tagName)) {
      return true;
    }

    // Skip elements that are not visible
    const computedStyle = window.getComputedStyle(element);
    if (
      computedStyle.display === 'none' ||
      computedStyle.visibility === 'hidden' ||
      computedStyle.opacity === '0'
    ) {
      return true;
    }

    // Skip very small elements (likely decorative)
    const rect = element.getBoundingClientRect();
    if (rect.width < 5 || rect.height < 5) {
      return true;
    }

    return false;
  }

  /**
   * Find the most appropriate element for selection
   */
  private findSelectableElement(element: HTMLElement): HTMLElement | null {
    let current = element;
    let iterations = 0;
    const maxIterations = 10; // Prevent infinite loops

    while (current && current !== document.body && iterations < maxIterations) {
      iterations++;

      // Skip if this is a non-selectable element
      if (this.isNonSelectableElement(current)) {
        current = current.parentElement!;
        continue;
      }

      // Prefer elements with semantic meaning
      const tagName = current.tagName.toLowerCase();
      const semanticTags = [
        'button',
        'a',
        'input',
        'select',
        'textarea',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'p',
        'div',
        'section',
        'article',
        'nav',
        'header',
        'footer',
        'main',
        'aside',
      ];

      if (semanticTags.includes(tagName)) {
        return current;
      }

      // Check if element has meaningful content or styling
      const rect = current.getBoundingClientRect();
      const hasContent = current.textContent?.trim().length > 0;
      const hasBackground =
        window.getComputedStyle(current).backgroundColor !== 'rgba(0, 0, 0, 0)';
      const hasBorder = window.getComputedStyle(current).borderWidth !== '0px';
      const isLargeEnough = rect.width > 20 && rect.height > 20;

      if ((hasContent || hasBackground || hasBorder) && isLargeEnough) {
        return current;
      }

      current = current.parentElement!;
    }

    return element; // Fallback to original element
  }

  /**
   * Get display name for element
   */
  public getElementDisplayName(element: HTMLElement): string {
    const tagName = element.tagName.toLowerCase();

    if (element.id) {
      return `${tagName}#${element.id}`;
    }

    if (element.className && typeof element.className === 'string') {
      const classes = element.className
        .split(' ')
        .filter((c) => c.trim())
        .slice(0, 2);
      if (classes.length > 0) {
        return `${tagName}.${classes.join('.')}`;
      }
    }

    // For text content
    if (element.textContent && element.textContent.trim().length > 0) {
      const text = element.textContent.trim().substring(0, 20);
      return `${tagName} "${text}${text.length > 20 ? '...' : ''}"`;
    }

    return tagName;
  }

  /**
   * Get comprehensive element context for AI processing
   */
  public getElementContext(element: HTMLElement): ElementContext {
    const rect = element.getBoundingClientRect();
    const computedStyles = window.getComputedStyle(element);

    // Extract comprehensive style information
    const styleContext = {
      // Layout properties
      display: computedStyles.display,
      position: computedStyles.position,
      width: computedStyles.width,
      height: computedStyles.height,
      margin: computedStyles.margin,
      padding: computedStyles.padding,

      // Typography
      color: computedStyles.color,
      backgroundColor: computedStyles.backgroundColor,
      fontSize: computedStyles.fontSize,
      fontFamily: computedStyles.fontFamily,
      fontWeight: computedStyles.fontWeight,
      lineHeight: computedStyles.lineHeight,
      textAlign: computedStyles.textAlign,

      // Border and visual
      border: computedStyles.border,
      borderRadius: computedStyles.borderRadius,
      boxShadow: computedStyles.boxShadow,
      opacity: computedStyles.opacity,

      // Flexbox/Grid
      flexDirection: computedStyles.flexDirection,
      justifyContent: computedStyles.justifyContent,
      alignItems: computedStyles.alignItems,
      gridTemplateColumns: computedStyles.gridTemplateColumns,
      gridTemplateRows: computedStyles.gridTemplateRows,

      // Transform and animation
      transform: computedStyles.transform,
      transition: computedStyles.transition,

      // Z-index and overflow
      zIndex: computedStyles.zIndex,
      overflow: computedStyles.overflow,
    };

    return {
      selector: this.generateSelector(element),
      tagName: element.tagName.toLowerCase(),
      id: element.id || undefined,
      className: element.className || undefined,
      textContent: element.textContent?.trim() || undefined,
      computedStyles: styleContext,
      boundingRect: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
      } as DOMRect,
    };
  }

  /**
   * Generate a robust and unique selector for an element
   */
  public generateSelector(element: HTMLElement): string {
    // Try ID first (most specific)
    if (element.id && /^[a-zA-Z][\w-]*$/.test(element.id)) {
      return `#${element.id}`;
    }

    // Try data attributes for unique identification
    const dataId =
      element.getAttribute('data-id') || element.getAttribute('data-testid');
    if (dataId) {
      return `[data-id="${dataId}"]`;
    }

    // Build a path-based selector
    const path: string[] = [];
    let current = element;

    while (
      current &&
      current !== document.body &&
      current !== document.documentElement
    ) {
      let selector = current.tagName.toLowerCase();

      // Add class if it exists and looks stable (not generated)
      if (current.className) {
        const classes = current.className
          .split(' ')
          .filter(
            (cls) => cls && !cls.match(/^(css-|MuiBox-|makeStyles-|jss\d+)/)
          )
          .slice(0, 2); // Limit to first 2 stable classes

        if (classes.length > 0) {
          selector += '.' + classes.join('.');
        }
      }

      // Add nth-child if needed for uniqueness
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(
          (child) => child.tagName === current.tagName
        );

        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `:nth-child(${index})`;
        }
      }

      path.unshift(selector);
      current = current.parentElement!;
    }

    // Limit path depth to avoid overly long selectors
    if (path.length > 5) {
      path.splice(0, path.length - 5);
    }

    return path.join(' > ');
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.disable();
    this.clearSelection();
    this.removeAllHighlights();
    this.hideElementTooltip();
  }
}
