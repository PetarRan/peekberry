import { createRoot } from "react-dom/client";
import FloatingWidget from "./FloatingWidget";
import { ElementHighlighter } from "./ElementHighlighter";
import { ElementContext } from "../../types/extension";

// Content script entry point
// This will be injected into web pages to provide Peekberry functionality

console.log("Peekberry content script loaded");

// Global state
let isExtensionActive = false;
let floatingWidgetRoot: any = null;
let floatingWidgetContainer: HTMLDivElement | null = null;
let elementHighlighter: ElementHighlighter | null = null;
let isWidgetExpanded = false;
let selectedElementContext: ElementContext | null = null;

// Message listener for communication with background script and popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log("Content script received message:", message);

  switch (message.type) {
    case "ACTIVATE_EXTENSION":
      activateExtension();
      sendResponse({ success: true, message: "Extension activated" });
      break;

    case "DEACTIVATE_EXTENSION":
      deactivateExtension();
      sendResponse({ success: true, message: "Extension deactivated" });
      break;

    case "USER_AUTHENTICATED":
      console.log("User authenticated, activating extension");
      activateExtension();
      sendResponse({
        success: true,
        message: "Extension activated after auth",
      });
      break;

    case "GET_PAGE_INFO":
      // Return basic page information
      sendResponse({
        success: true,
        pageInfo: {
          url: window.location.href,
          title: document.title,
          domain: window.location.hostname,
        },
      });
      break;

    default:
      sendResponse({ success: false, error: "Unknown message type" });
  }

  return true; // Keep message channel open for async responses
});

// Activate extension functionality
const activateExtension = () => {
  if (isExtensionActive) {
    console.log("Extension already active, skipping activation");
    return;
  }

  console.log("🚀 Activating Peekberry extension on:", window.location.href);
  isExtensionActive = true;

  // Wait for DOM to be fully ready
  if (document.readyState !== "complete") {
    console.log("DOM not ready, waiting...");
    window.addEventListener("load", () => {
      console.log("DOM ready, creating widget");
      createFloatingWidget();
    });
  } else {
    createFloatingWidget();
  }

  // Initialize element highlighter
  elementHighlighter = new ElementHighlighter(handleElementSelected);
  elementHighlighter.activate();
  console.log("Element highlighter activated");
};

// Deactivate extension functionality
const deactivateExtension = () => {
  if (!isExtensionActive) return;

  console.log("Deactivating Peekberry extension");
  isExtensionActive = false;

  // Remove floating widget
  removeFloatingWidget();

  // Deactivate element highlighter
  if (elementHighlighter) {
    elementHighlighter.destroy();
    elementHighlighter = null;
  }

  // Reset state
  isWidgetExpanded = false;
  selectedElementContext = null;
};

// Create and inject floating widget
const createFloatingWidget = () => {
  if (floatingWidgetContainer) {
    console.log("Floating widget already exists, skipping creation");
    return;
  }

  console.log("Creating floating widget...");

  try {
    // Create container for the floating widget
    floatingWidgetContainer = document.createElement("div");
    floatingWidgetContainer.setAttribute("data-peekberry-widget", "true");
    floatingWidgetContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 999999;
    `;

    document.body.appendChild(floatingWidgetContainer);
    console.log("Widget container added to DOM");

    // Create React root and render FloatingWidget
    floatingWidgetRoot = createRoot(floatingWidgetContainer);
    floatingWidgetRoot.render(
      <FloatingWidget
        onToggle={handleWidgetToggle}
        isExpanded={isWidgetExpanded}
      />
    );
    console.log("FloatingWidget rendered successfully");
  } catch (error) {
    console.error("Error creating floating widget:", error);
  }
};

// Remove floating widget
const removeFloatingWidget = () => {
  if (floatingWidgetRoot) {
    floatingWidgetRoot.unmount();
    floatingWidgetRoot = null;
  }

  if (floatingWidgetContainer) {
    document.body.removeChild(floatingWidgetContainer);
    floatingWidgetContainer = null;
  }
};

// Handle widget toggle (expand/collapse)
const handleWidgetToggle = (expanded: boolean) => {
  isWidgetExpanded = expanded;
  console.log("Widget toggled:", expanded ? "expanded" : "collapsed");

  // Future task: Implement chat interface expansion
  if (expanded) {
    console.log("Chat interface should expand here");
  } else {
    console.log("Chat interface should collapse here");
  }
};

// Handle element selection
const handleElementSelected = (context: ElementContext) => {
  selectedElementContext = context;
  console.log("Element selected:", {
    selector: context.selector,
    tagName: context.tagName,
    className: context.className,
    textContent: context.textContent.substring(0, 50) + "...",
    dimensions: {
      width: context.dimensions.width,
      height: context.dimensions.height,
    },
  });

  // Store selected element context for future use in chat interface
  console.log("Selected element context stored for future chat integration");
};

// Getter function for selected element context (used by future chat interface)
export const getSelectedElementContext = (): ElementContext | null => {
  return selectedElementContext;
};

// Initialize content script
const initializeContentScript = () => {
  console.log("Content script initialized on:", window.location.href);

  // Check if user is authenticated before activating
  checkAuthAndActivate();
};

// Check authentication status and activate if authenticated
const checkAuthAndActivate = async () => {
  try {
    // Check Chrome storage for auth state
    const result = await chrome.storage.local.get(["authState"]);
    const authState = result.authState;

    if (authState?.user) {
      console.log("✅ User is authenticated, activating extension");
      activateExtension();
    } else {
      console.log("❌ User not authenticated, waiting for auth");
      // Listen for auth state changes
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === "local" && changes.authState) {
          const newAuthState = changes.authState.newValue;
          if (newAuthState?.user && !isExtensionActive) {
            console.log("✅ Auth state changed, activating extension");
            activateExtension();
          }
        }
      });
    }
  } catch (error) {
    console.error("Error checking auth state:", error);
    // Fallback: activate anyway for development
    console.log("🔧 DEV MODE: Activating extension without auth");
    activateExtension();
  }
};

// Wait for DOM to be ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeContentScript);
} else {
  initializeContentScript();
}
