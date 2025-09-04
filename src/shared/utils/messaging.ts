// Utility functions for Chrome extension messaging

export interface MessageRequest {
  type: string;
  [key: string]: any;
}

export interface MessageResponse {
  success?: boolean;
  error?: string;
  [key: string]: any;
}

// Send message to background script
export const sendToBackground = (
  message: MessageRequest
): Promise<MessageResponse> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
};

// Send message to content script
export const sendToContentScript = (
  tabId: number,
  message: MessageRequest
): Promise<MessageResponse> => {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
};

// Send message to popup
export const sendToPopup = (
  message: MessageRequest
): Promise<MessageResponse> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
};

// Storage utilities for extension state
export const getExtensionState = async () => {
  try {
    const response = await sendToBackground({ type: "GET_EXTENSION_STATE" });
    return response.extensionState;
  } catch (error) {
    console.error("Failed to get extension state:", error);
    return null;
  }
};

export const updateExtensionState = async (state: any) => {
  try {
    await sendToBackground({ type: "UPDATE_EXTENSION_STATE", state });
    return true;
  } catch (error) {
    console.error("Failed to update extension state:", error);
    return false;
  }
};

// Auth state utilities
export const getAuthState = async () => {
  try {
    const response = await sendToBackground({ type: "GET_AUTH_STATE" });
    return response.authState;
  } catch (error) {
    console.error("Failed to get auth state:", error);
    return null;
  }
};

export const setAuthState = async (authState: any) => {
  try {
    await sendToBackground({ type: "SET_AUTH_STATE", authState });
    return true;
  } catch (error) {
    console.error("Failed to set auth state:", error);
    return false;
  }
};

export const clearAuthState = async () => {
  try {
    await sendToBackground({ type: "CLEAR_AUTH_STATE" });
    return true;
  } catch (error) {
    console.error("Failed to clear auth state:", error);
    return false;
  }
};
