/**
 * Edit History Manager
 * Handles undo/redo functionality and edit tracking
 */

export interface DOMMutation {
  type: 'style' | 'attribute' | 'content';
  selector: string;
  property: string;
  value: string;
  previousValue?: string;
}

export interface EditAction {
  id: string;
  type: 'style' | 'attribute' | 'content';
  element: any; // ElementContext
  mutation: DOMMutation;
  timestamp: Date;
  undoable: boolean;
}

export class EditHistoryManager {
  private editHistory: EditAction[] = [];
  private redoStack: EditAction[] = [];
  private maxHistorySize = 50;

  /**
   * Add edit to history
   */
  public addEdit(editAction: EditAction): void {
    // Clear redo stack when new edit is added
    this.redoStack = [];

    // Add to history
    this.editHistory.push(editAction);

    // Maintain history size limit
    if (this.editHistory.length > this.maxHistorySize) {
      const removedEdit = this.editHistory.shift();
      if (removedEdit) {
        console.log('Removed oldest edit from history due to size limit');
      }
    }
  }

  /**
   * Undo last edit
   */
  public undo(): boolean {
    if (this.editHistory.length === 0) {
      console.warn('No edits to undo');
      return false;
    }

    const lastEdit = this.editHistory.pop();
    if (!lastEdit || !lastEdit.undoable) {
      console.warn('Cannot undo this edit');
      if (lastEdit) {
        this.editHistory.push(lastEdit);
      }
      return false;
    }

    try {
      // Find the target element
      const targetElement = this.findElementBySelector(
        lastEdit.mutation.selector
      );

      if (!targetElement) {
        console.error('Cannot undo: target element not found');
        this.cleanupInvalidHistoryEntries();
        return false;
      }

      // Store current state for potential redo
      const currentState = this.captureElementState(
        targetElement,
        lastEdit.mutation
      );

      // Revert the mutation
      this.revertMutation(targetElement, lastEdit.mutation);

      // Update the edit with current state for redo
      lastEdit.mutation.previousValue = currentState;

      // Add to redo stack
      this.addToRedoStack(lastEdit);

      console.log('Undid edit:', lastEdit);
      return true;
    } catch (error) {
      console.error('Error undoing edit:', error);
      this.editHistory.push(lastEdit);
      return false;
    }
  }

  /**
   * Redo previously undone edit
   */
  public redo(): boolean {
    if (this.redoStack.length === 0) {
      console.warn('No edits to redo');
      return false;
    }

    const editToRedo = this.redoStack.pop();
    if (!editToRedo) {
      return false;
    }

    try {
      // Find the target element
      const targetElement = this.findElementBySelector(
        editToRedo.mutation.selector
      );

      if (!targetElement) {
        console.error('Cannot redo: target element not found');
        this.cleanupInvalidRedoEntries();
        return false;
      }

      // Reapply the mutation
      this.applyMutation(targetElement, editToRedo.mutation);

      // Add back to history
      this.addEdit(editToRedo);

      console.log('Redid edit:', editToRedo);
      return true;
    } catch (error) {
      console.error('Error redoing edit:', error);
      this.redoStack.push(editToRedo);
      return false;
    }
  }

  /**
   * Check if can undo
   */
  public canUndo(): boolean {
    return (
      this.editHistory.length > 0 &&
      this.editHistory.some((edit) => edit.undoable)
    );
  }

  /**
   * Check if can redo
   */
  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Get history count
   */
  public getHistoryCount(): number {
    return this.editHistory.length;
  }

  /**
   * Get redo count
   */
  public getRedoCount(): number {
    return this.redoStack.length;
  }

  /**
   * Clear all history
   */
  public clearHistory(): void {
    this.editHistory = [];
    this.redoStack = [];
    console.log('Edit history cleared');
  }

  /**
   * Get edit history summary
   */
  public getHistorySummary(): {
    historyCount: number;
    redoCount: number;
    canUndo: boolean;
    canRedo: boolean;
  } {
    return {
      historyCount: this.editHistory.length,
      redoCount: this.redoStack.length,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    };
  }

  /**
   * Add to redo stack with size management
   */
  private addToRedoStack(editAction: EditAction): void {
    this.redoStack.push(editAction);

    if (this.redoStack.length > this.maxHistorySize) {
      this.redoStack.shift();
    }
  }

  /**
   * Find element by selector
   */
  private findElementBySelector(selector: string): HTMLElement | null {
    try {
      let element = document.querySelector(selector) as HTMLElement;

      if (element) {
        return element;
      }

      // Fallback strategies
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
   * Capture current element state
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
   * Apply mutation to element
   */
  private applyMutation(element: HTMLElement, mutation: DOMMutation): void {
    switch (mutation.type) {
      case 'style':
        (element.style as any)[mutation.property] = mutation.value;
        break;
      case 'attribute':
        if (mutation.value === null || mutation.value === '') {
          element.removeAttribute(mutation.property);
        } else {
          element.setAttribute(mutation.property, mutation.value);
        }
        break;
      case 'content':
        element.textContent = mutation.value;
        break;
    }
  }

  /**
   * Revert mutation
   */
  private revertMutation(element: HTMLElement, mutation: DOMMutation): void {
    switch (mutation.type) {
      case 'style':
        this.revertStyleMutation(element, mutation);
        break;
      case 'attribute':
        this.revertAttributeMutation(element, mutation);
        break;
      case 'content':
        this.revertContentMutation(element, mutation);
        break;
    }
  }

  /**
   * Revert style mutation
   */
  private revertStyleMutation(
    element: HTMLElement,
    mutation: DOMMutation
  ): void {
    const originalAttrName = 'data-peekberry-original-' + mutation.property;
    const originalValue = element.getAttribute(originalAttrName);

    if (originalValue !== null) {
      if (originalValue === '' || originalValue === 'initial') {
        (element.style as any)[mutation.property] = '';
      } else {
        (element.style as any)[mutation.property] = originalValue;
      }
      element.removeAttribute(originalAttrName);
    } else if (mutation.previousValue && mutation.previousValue !== 'initial') {
      (element.style as any)[mutation.property] = mutation.previousValue;
    } else {
      (element.style as any)[mutation.property] = '';
    }
  }

  /**
   * Revert attribute mutation
   */
  private revertAttributeMutation(
    element: HTMLElement,
    mutation: DOMMutation
  ): void {
    const originalAttrName =
      'data-peekberry-original-attr-' + mutation.property;
    const originalValue = element.getAttribute(originalAttrName);

    if (originalValue !== null) {
      if (originalValue === '') {
        element.removeAttribute(mutation.property);
      } else {
        element.setAttribute(mutation.property, originalValue);
      }
      element.removeAttribute(originalAttrName);
    } else if (mutation.previousValue) {
      element.setAttribute(mutation.property, mutation.previousValue);
    } else {
      element.removeAttribute(mutation.property);
    }
  }

  /**
   * Revert content mutation
   */
  private revertContentMutation(
    element: HTMLElement,
    mutation: DOMMutation
  ): void {
    const originalContent = element.getAttribute(
      'data-peekberry-original-content'
    );

    if (originalContent !== null) {
      element.textContent = originalContent;
      element.removeAttribute('data-peekberry-original-content');
    } else if (mutation.previousValue !== undefined) {
      element.textContent = mutation.previousValue;
    }
  }

  /**
   * Clean up invalid history entries
   */
  private cleanupInvalidHistoryEntries(): void {
    const validHistory = this.editHistory.filter((edit) => {
      const element = this.findElementBySelector(edit.mutation.selector);
      return element !== null;
    });

    const removedCount = this.editHistory.length - validHistory.length;
    if (removedCount > 0) {
      console.log(`Cleaned up ${removedCount} invalid history entries`);
      this.editHistory = validHistory;
    }
  }

  /**
   * Clean up invalid redo entries
   */
  private cleanupInvalidRedoEntries(): void {
    const validRedo = this.redoStack.filter((edit) => {
      const element = this.findElementBySelector(edit.mutation.selector);
      return element !== null;
    });

    const removedCount = this.redoStack.length - validRedo.length;
    if (removedCount > 0) {
      console.log(`Cleaned up ${removedCount} invalid redo entries`);
      this.redoStack = validRedo;
    }
  }
}
