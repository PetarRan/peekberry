import { ElementContext } from "../../types/extension";

export class ElementHighlighter {
  private hoveredElement: HTMLElement | null = null;
  private selectedElement: HTMLElement | null = null;
  private hoverOverlay: HTMLDivElement | null = null;
  private selectionOverlay: HTMLDivElement | null = null;
  private isActive: boolean = false;
  private onElementSelected?: (context: ElementContext) => void;

  constructor(onElementSelected?: (context: ElementContext) => void) {
    this.onElementSelected = onElementSelected;
    this.createOverlays();
  }

  private createOverlays() {
    // Create hover overlay
    this.hoverOverlay = document.createElement("div");
    this.hoverOverlay.style.cssText = `
      position: absolute;
      pointer-events: none;
      border: 2px dashed #6366f1;
      background: rgba(99, 102, 241, 0.1);
      z-index: 999998;
      display: none;
      transition: all 0.1s ease;
    `;
    document.body.appendChild(this.hoverOverlay);

    // Create selection overlay
    this.selectionOverlay = document.createElement("div");
    this.selectionOverlay.style.cssText = `
      position: absolute;
      pointer-events: none;
      border: 3px solid #f59e0b;
      background: rgba(245, 158, 11, 0.1);
      z-index: 999997;
      display: none;
    `;
    document.body.appendChild(this.selectionOverlay);
  }

  activate() {
    if (this.isActive) return;

    this.isActive = true;
    document.addEventListener("mouseover", this.handleMouseOver);
    document.addEventListener("mouseout", this.handleMouseOut);
    document.addEventListener("click", this.handleClick, true);
  }

  deactivate() {
    if (!this.isActive) return;

    this.isActive = false;
    document.removeEventListener("mouseover", this.handleMouseOver);
    document.removeEventListener("mouseout", this.handleMouseOut);
    document.removeEventListener("click", this.handleClick, true);

    this.hideHoverOverlay();
    this.hideSelectionOverlay();
    this.hoveredElement = null;
    this.selectedElement = null;
  }

  private handleMouseOver = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    // Skip if it's our own overlay or floating widget
    if (this.isOurElement(target)) return;

    this.hoveredElement = target;
    this.showHoverOverlay(target);
  };

  private handleMouseOut = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    if (this.hoveredElement === target) {
      this.hideHoverOverlay();
      this.hoveredElement = null;
    }
  };

  private handleClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    // Skip if it's our own element
    if (this.isOurElement(target)) return;

    event.preventDefault();
    event.stopPropagation();

    this.selectElement(target);
  };

  private isOurElement(element: HTMLElement): boolean {
    // Check if element is part of Peekberry extension
    return (
      element === this.hoverOverlay ||
      element === this.selectionOverlay ||
      element.closest("[data-peekberry-widget]") !== null ||
      element.style.zIndex === "999999" ||
      element.style.zIndex === "999998" ||
      element.style.zIndex === "999997"
    );
  }

  private showHoverOverlay(element: HTMLElement) {
    if (!this.hoverOverlay) return;

    const rect = element.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    this.hoverOverlay.style.display = "block";
    this.hoverOverlay.style.left = `${rect.left + scrollX}px`;
    this.hoverOverlay.style.top = `${rect.top + scrollY}px`;
    this.hoverOverlay.style.width = `${rect.width}px`;
    this.hoverOverlay.style.height = `${rect.height}px`;
  }

  private hideHoverOverlay() {
    if (this.hoverOverlay) {
      this.hoverOverlay.style.display = "none";
    }
  }

  private showSelectionOverlay(element: HTMLElement) {
    if (!this.selectionOverlay) return;

    const rect = element.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    this.selectionOverlay.style.display = "block";
    this.selectionOverlay.style.left = `${rect.left + scrollX}px`;
    this.selectionOverlay.style.top = `${rect.top + scrollY}px`;
    this.selectionOverlay.style.width = `${rect.width}px`;
    this.selectionOverlay.style.height = `${rect.height}px`;
  }

  private hideSelectionOverlay() {
    if (this.selectionOverlay) {
      this.selectionOverlay.style.display = "none";
    }
  }

  private selectElement(element: HTMLElement) {
    // Clear previous selection
    this.hideSelectionOverlay();

    // Set new selection
    this.selectedElement = element;
    this.showSelectionOverlay(element);

    // Capture element context
    const context = this.captureElementContext(element);

    // Notify callback
    if (this.onElementSelected) {
      this.onElementSelected(context);
    }
  }

  private captureElementContext(element: HTMLElement): ElementContext {
    const computedStyles = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    // Generate a unique selector for the element
    const selector = this.generateSelector(element);

    return {
      selector,
      tagName: element.tagName.toLowerCase(),
      className: element.className || "",
      computedStyles: computedStyles,
      dimensions: rect,
      textContent: element.textContent?.trim() || "",
      parentContext: element.parentElement
        ? this.captureElementContext(element.parentElement)
        : undefined,
    };
  }

  private generateSelector(element: HTMLElement): string {
    // Simple selector generation - can be enhanced later
    let selector = element.tagName.toLowerCase();

    if (element.id) {
      selector += `#${element.id}`;
    }

    if (element.className) {
      const classes = element.className.split(" ").filter((c) => c.trim());
      if (classes.length > 0) {
        selector += "." + classes.join(".");
      }
    }

    return selector;
  }

  getSelectedElement(): HTMLElement | null {
    return this.selectedElement;
  }

  clearSelection() {
    this.hideSelectionOverlay();
    this.selectedElement = null;
  }

  destroy() {
    this.deactivate();

    if (this.hoverOverlay) {
      document.body.removeChild(this.hoverOverlay);
      this.hoverOverlay = null;
    }

    if (this.selectionOverlay) {
      document.body.removeChild(this.selectionOverlay);
      this.selectionOverlay = null;
    }
  }
}
