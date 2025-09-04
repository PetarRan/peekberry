// Background script for extension lifecycle management

console.log("Peekberry background script loaded");

// Extension installation handler
chrome.runtime.onInstalled.addListener(() => {
  console.log("Peekberry extension installed");

  // Initialize extension state
  chrome.storage.local.set({
    extensionState: {
      isActive: false,
      selectedElement: null,
      modifications: [],
      chatHistory: [],
    },
  });
});

// Message handling between popup, content script, and background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message);

  switch (message.type) {
    case "GET_AUTH_STATE":
      // Handle auth state requests
      chrome.storage.local.get(["authState"], (result) => {
        sendResponse({ authState: result.authState || null });
      });
      return true; // Keep message channel open for async response

    case "SET_AUTH_STATE":
      // Store auth state
      chrome.storage.local.set({ authState: message.authState }, () => {
        sendResponse({ success: true });
      });
      return true;

    case "CLEAR_AUTH_STATE":
      // Clear auth state on logout
      chrome.storage.local.remove(["authState"], () => {
        sendResponse({ success: true });
      });
      return true;

    case "GET_EXTENSION_STATE":
      // Get current extension state
      chrome.storage.local.get(["extensionState"], (result) => {
        sendResponse({ extensionState: result.extensionState });
      });
      return true;

    case "UPDATE_EXTENSION_STATE":
      // Update extension state
      chrome.storage.local.set({ extensionState: message.state }, () => {
        sendResponse({ success: true });
      });
      return true;

    case "INJECT_CONTENT_SCRIPT":
      // Inject content script into active tab
      if (sender.tab?.id) {
        chrome.scripting.executeScript({
          target: { tabId: sender.tab.id },
          files: ["dist/content.js"],
        });
      }
      sendResponse({ success: true });
      return true;

    default:
      console.log("Unknown message type:", message.type);
      sendResponse({ error: "Unknown message type" });
  }
});

// Handle tab updates to maintain extension state
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    // Reset extension state for new page loads
    chrome.storage.local.get(["extensionState"], (result) => {
      if (result.extensionState?.isActive) {
        const updatedState = {
          ...result.extensionState,
          selectedElement: null,
          modifications: [],
        };
        chrome.storage.local.set({ extensionState: updatedState });
      }
    });
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // This will open the popup, which is handled by manifest.json
  console.log("Extension icon clicked for tab:", tab.id);
});
