/**
 * Mutation Manager
 * Handles DOM mutations and element modifications
 */

import { DOMMutation, EditAction } from './EditHistoryManager';
import { ElementContext } from './ElementSelectionManager';
import {
  performanceManager,
  measurePerformance,
  optimizeForDevice,
} from '../../utils/performance';
import {
  PeekberryError,
  ERROR_CODES,
  logError,
  createPeekberryError,
} from '../../utils/errorHandling';
import { showError, showSuccess } from '../../utils/notifications';

export class MutationManager {
  /**
   * Apply DOM mutation safely
   */
  public applyMutation(mutation: DOMMutation): void {
    measurePerformance('applyMutation', () => {
      const context = {
        component: 'MutationManager',
        operation: 'applyMutation',
        url: window.location.href,
        timestamp: new Date(),
      };

      try {
        console.log('Applying mutation:', mutation);

        // Validate mutation before applying
        if (!this.validateMutation(mutation)) {
          const error = new PeekberryError(
            'Mutation validation failed',
            ERROR_CODES.DOM_MUTATION_FAILED,
            context
          );
          logError(error);
          showError('Cannot apply unsafe changes to this element');
          return;
        }

        // Find the target element using the selector
        const targetElement = this.findElementBySelector(mutation.selector);

        if (!targetElement) {
          const error = new PeekberryError(
            `Target element not found for selector: ${mutation.selector}`,
            ERROR_CODES.DOM_ELEMENT_NOT_FOUND,
            context
          );
          logError(error);
          showError(
            'Selected element is no longer available. Please select a new element.'
          );
          return;
        }

        // Verify this is not a Peekberry element
        if (this.isPeekberryElement(targetElement)) {
          console.warn('Attempted to modify Peekberry element, skipping');
          return;
        }

        // Capture current state before applying mutation for undo functionality
        if (!mutation.previousValue) {
          mutation.previousValue = this.captureElementState(
            targetElement,
            mutation
          );
        }

        // Use performance-optimized DOM operations
        performanceManager.batchDOMOperations([
          () => {
            // Apply the mutation based on type
            switch (mutation.type) {
              case 'style':
                this.applyStyleMutation(targetElement, mutation);
                break;
              case 'attribute':
                this.applyAttributeMutation(targetElement, mutation);
                break;
              case 'content':
                this.applyContentMutation(targetElement, mutation);
                break;
              default:
                const error = new PeekberryError(
                  `Unknown mutation type: ${mutation.type}`,
                  ERROR_CODES.DOM_MUTATION_FAILED,
                  context
                );
                logError(error);
                showError('Unable to apply this type of change');
                return;
            }

            // Mark element as modified by Peekberry for tracking
            this.markElementAsModified(targetElement);
          },
        ]);

        // Show success feedback (optimized for device)
        optimizeForDevice(
          () => showSuccess('Applied'), // Mobile: shorter message
          () => showSuccess('Changes applied successfully') // Desktop: full message
        );
      } catch (error) {
        const peekberryError = createPeekberryError(
          error as Error,
          ERROR_CODES.DOM_MUTATION_FAILED,
          context
        );
        logError(peekberryError);
        performanceManager.recordError(peekberryError.message, 'applyMutation');
        showError('Failed to apply changes to the selected element');
      }
    });
  }

  /**
   * Apply style mutation to element
   */
  private applyStyleMutation(
    element: HTMLElement,
    mutation: DOMMutation
  ): void {
    try {
      // Store original value if not already stored
      if (
        !element.hasAttribute('data-peekberry-original-' + mutation.property)
      ) {
        const originalValue =
          window
            .getComputedStyle(element)
            .getPropertyValue(mutation.property) || '';
        element.setAttribute(
          'data-peekberry-original-' + mutation.property,
          originalValue
        );
      }

      // Apply the new style
      (element.style as any)[mutation.property] = mutation.value;

      console.log(
        `Applied style: ${mutation.property} = ${mutation.value} to`,
        element
      );
    } catch (error) {
      console.error('Error applying style mutation:', error);
      throw error;
    }
  }

  /**
   * Apply attribute mutation to element
   */
  private applyAttributeMutation(
    element: HTMLElement,
    mutation: DOMMutation
  ): void {
    try {
      // Store original value if not already stored
      const originalAttrName =
        'data-peekberry-original-attr-' + mutation.property;
      if (!element.hasAttribute(originalAttrName)) {
        const originalValue = element.getAttribute(mutation.property) || '';
        element.setAttribute(originalAttrName, originalValue);
      }

      // Apply the new attribute value
      if (mutation.value === null || mutation.value === '') {
        element.removeAttribute(mutation.property);
      } else {
        element.setAttribute(mutation.property, mutation.value);
      }

      console.log(
        `Applied attribute: ${mutation.property} = ${mutation.value} to`,
        element
      );
    } catch (error) {
      console.error('Error applying attribute mutation:', error);
      throw error;
    }
  }

  /**
   * Apply content mutation to element
   */
  private applyContentMutation(
    element: HTMLElement,
    mutation: DOMMutation
  ): void {
    try {
      // Store original content if not already stored
      if (!element.hasAttribute('data-peekberry-original-content')) {
        const originalContent = element.textContent || '';
        element.setAttribute(
          'data-peekberry-original-content',
          originalContent
        );
      }

      // Apply the new content based on property type
      switch (mutation.property) {
        case 'textContent':
          element.textContent = mutation.value;
          break;
        case 'innerHTML':
          // Be careful with innerHTML for security
          if (this.isSafeHTML(mutation.value)) {
            element.innerHTML = mutation.value;
          } else {
            console.warn('Unsafe HTML detected, using textContent instead');
            element.textContent = mutation.value;
          }
          break;
        default:
          element.textContent = mutation.value;
      }

      console.log(
        `Applied content: ${mutation.property} = ${mutation.value} to`,
        element
      );
    } catch (error) {
      console.error('Error applying content mutation:', error);
      throw error;
    }
  }

  /**
   * Find element by selector with fallback strategies
   */
  private findElementBySelector(selector: string): HTMLElement | null {
    try {
      // Try direct selector first
      let element = document.querySelector(selector) as HTMLElement;

      if (element) {
        return element;
      }

      // If direct selector fails, try to find by ID or class as fallback
      if (selector.includes('#')) {
        const id = selector.split('#')[1]?.split(/[\s.>+~]/)[0];
        if (id) {
          element = document.getElementById(id) as HTMLElement;
          if (element) return element;
        }
      }

      if (selector.includes('.')) {
        const className = selector.split('.')[1]?.split(/[\s#>+~]/)[0];
        if (className) {
          element = document.querySelector(`.${className}`) as HTMLElement;
          if (element) return element;
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding element by selector:', selector, error);
      return null;
    }
  }

  /**
   * Mark element as modified by Peekberry for tracking
   */
  private markElementAsModified(element: HTMLElement): void {
    element.setAttribute('data-peekberry-modified', 'true');
    element.setAttribute(
      'data-peekberry-modified-at',
      new Date().toISOString()
    );
  }

  /**
   * Check if HTML content is safe to insert
   */
  private isSafeHTML(html: string): boolean {
    // Basic safety check - reject script tags and event handlers
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i, // event handlers like onclick, onload, etc.
      /<iframe/i,
      /<object/i,
      /<embed/i,
    ];

    return !dangerousPatterns.some((pattern) => pattern.test(html));
  }

  /**
   * Validate that mutation is safe and scoped properly
   */
  private validateMutation(mutation: DOMMutation): boolean {
    // Check if selector is valid
    try {
      document.querySelector(mutation.selector);
    } catch (error) {
      console.error('Invalid selector in mutation:', mutation.selector);
      return false;
    }

    // Ensure we're not targeting critical page elements
    const criticalSelectors = [
      'html',
      'head',
      'body',
      'script',
      'style',
      'meta',
      'link[rel="stylesheet"]',
    ];

    const isCritical = criticalSelectors.some((selector) => {
      try {
        return (
          document.querySelector(selector) ===
          document.querySelector(mutation.selector)
        );
      } catch {
        return false;
      }
    });

    if (isCritical) {
      console.error(
        'Attempted to modify critical page element:',
        mutation.selector
      );
      return false;
    }

    // Validate mutation values
    if (mutation.type === 'content' && mutation.property === 'innerHTML') {
      if (!this.isSafeHTML(mutation.value)) {
        console.error('Unsafe HTML content in mutation');
        return false;
      }
    }

    return true;
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
   * Capture current element state for undo/redo operations
   */
  private captureElementState(
    element: HTMLElement,
    mutation: DOMMutation
  ): string {
    switch (mutation.type) {
      case 'style':
        return (
          window
            .getComputedStyle(element)
            .getPropertyValue(mutation.property) || ''
        );
      case 'attribute':
        return element.getAttribute(mutation.property) || '';
      case 'content':
        return element.textContent || '';
      default:
        return '';
    }
  }

  /**
   * Get all elements currently modified by Peekberry
   */
  public getModifiedElements(): HTMLElement[] {
    return Array.from(
      document.querySelectorAll('[data-peekberry-modified="true"]')
    ) as HTMLElement[];
  }

  /**
   * Restore all Peekberry modifications (emergency cleanup)
   */
  public restoreAllModifications(): void {
    const modifiedElements = this.getModifiedElements();

    modifiedElements.forEach((element) => {
      try {
        // Restore all style properties
        const styleAttrs = Array.from(element.attributes).filter(
          (attr) =>
            attr.name.startsWith('data-peekberry-original-') &&
            !attr.name.includes('-attr-')
        );

        styleAttrs.forEach((attr) => {
          const property = attr.name.replace('data-peekberry-original-', '');
          const originalValue = attr.value;

          if (originalValue === '' || originalValue === 'initial') {
            (element.style as any)[property] = '';
          } else {
            (element.style as any)[property] = originalValue;
          }

          element.removeAttribute(attr.name);
        });

        // Restore all attributes
        const attrAttrs = Array.from(element.attributes).filter((attr) =>
          attr.name.startsWith('data-peekberry-original-attr-')
        );

        attrAttrs.forEach((attr) => {
          const property = attr.name.replace(
            'data-peekberry-original-attr-',
            ''
          );
          const originalValue = attr.value;

          if (originalValue === '') {
            element.removeAttribute(property);
          } else {
            element.setAttribute(property, originalValue);
          }

          element.removeAttribute(attr.name);
        });

        // Restore content
        const originalContent = element.getAttribute(
          'data-peekberry-original-content'
        );
        if (originalContent !== null) {
          element.textContent = originalContent;
          element.removeAttribute('data-peekberry-original-content');
        }

        // Remove Peekberry tracking attributes
        element.removeAttribute('data-peekberry-modified');
        element.removeAttribute('data-peekberry-modified-at');
      } catch (error) {
        console.error('Error restoring element:', element, error);
      }
    });

    console.log(`Restored ${modifiedElements.length} modified elements`);
    showSuccess(`Restored ${modifiedElements.length} modifications`);
  }
}
