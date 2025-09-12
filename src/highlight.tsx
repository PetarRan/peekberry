/* eslint-disable @typescript-eslint/no-explicit-any */
let highlightBox: HTMLDivElement | null = null;
let labelBox: HTMLDivElement | null = null;
let clickHandler: any = null;
let moveHandler: any = null;
let currentOnSelect:
  | ((selector: string, html?: string, element?: Element) => void)
  | null = null;
let shouldDisableAfterSelection = true;

// Generate a CSS selector for the given element
function generateSelector(element: Element): string {
  if (element.id) {
    return `#${element.id}`;
  }

  let selector = element.tagName.toLowerCase();

  // Add class names if available
  if (element.className && typeof element.className === "string") {
    const classes = element.className
      .trim()
      .split(/\s+/)
      .filter((cls) => cls.length > 0);
    if (classes.length > 0) {
      selector += "." + classes.join(".");
    }
  }

  // If we still don't have a unique selector, add nth-child
  const parent = element.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children).filter(
      (child) => child.tagName === element.tagName
    );
    if (siblings.length > 1) {
      const index = siblings.indexOf(element) + 1;
      selector += `:nth-child(${index})`;
    }
  }

  return selector;
}

export function enableHighlight(
  onSelect: (selector: string, html?: string, element?: Element) => void,
  disableAfterSelection: boolean = true
) {
  currentOnSelect = onSelect;
  shouldDisableAfterSelection = disableAfterSelection;

  if (!highlightBox) {
    highlightBox = document.createElement("div");
    highlightBox.style.position = "absolute";
    highlightBox.style.background = "rgba(0, 123, 255, 0.2)";
    highlightBox.style.border = "2px solid #007bff";
    highlightBox.style.pointerEvents = "none";
    highlightBox.style.zIndex = "99998";
    document.body.appendChild(highlightBox);
  }
  if (!labelBox) {
    labelBox = document.createElement("div");
    labelBox.style.position = "absolute";
    labelBox.style.background = "#007bff";
    labelBox.style.color = "#fff";
    labelBox.style.fontSize = "12px";
    labelBox.style.padding = "2px 4px";
    labelBox.style.pointerEvents = "none";
    labelBox.style.zIndex = "99999";
    document.body.appendChild(labelBox);
  }

  moveHandler = (e: MouseEvent) => {
    const el = e.target as HTMLElement;
    if (!el) return;

    // Don't highlight if hovering over our own UI elements
    if (el.closest("[data-peek-ui]")) return;

    const rect = el.getBoundingClientRect();
    highlightBox!.style.top = rect.top + window.scrollY + "px";
    highlightBox!.style.left = rect.left + window.scrollX + "px";
    highlightBox!.style.width = rect.width + "px";
    highlightBox!.style.height = rect.height + "px";
    highlightBox!.style.display = "block";

    let name = el.tagName.toLowerCase();
    if (el.id) name += `#${el.id}`;
    else if (el.className)
      name += `.${el.className.toString().split(" ").join(".")}`;
    labelBox!.textContent = name;
    labelBox!.style.top = rect.top + window.scrollY - 20 + "px";
    labelBox!.style.left = rect.left + window.scrollX + "px";
    labelBox!.style.display = "block";
  };

  clickHandler = (e: MouseEvent) => {
    const el = e.target as Element;

    // Don't select our own UI elements
    if (el.closest("[data-peek-ui]")) return;

    e.preventDefault();
    e.stopPropagation();

    const selector = generateSelector(el);

    // Log the HTML content of the selected element
    console.log("Selected element HTML:", el.outerHTML);
    console.log("Selected element inner HTML:", el.innerHTML);
    console.log("Selected element:", el);

    // Pass HTML content to the callback
    if (currentOnSelect) {
      currentOnSelect(selector, el.outerHTML, el);
    }

    // Only disable if specified
    if (shouldDisableAfterSelection) {
      disableHighlight();
    }
  };

  document.addEventListener("mousemove", moveHandler, true);
  document.addEventListener("click", clickHandler, true);
  document.body.style.cursor = "crosshair";
}

export function disableHighlight() {
  if (moveHandler) {
    document.removeEventListener("mousemove", moveHandler, true);
    moveHandler = null;
  }
  if (clickHandler) {
    document.removeEventListener("click", clickHandler, true);
    clickHandler = null;
  }
  if (highlightBox) highlightBox.style.display = "none";
  if (labelBox) labelBox.style.display = "none";
  document.body.style.cursor = "default";
  currentOnSelect = null;
}
