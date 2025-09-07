// Background script for Peekberry Chrome extension
// Handles API communication and storage management

console.log('Peekberry background script loaded');

// Extension installation handler
chrome.runtime.onInstalled.addListener(() => {
  console.log('Peekberry extension installed');
});

// Message handler for communication with content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  // Handle different message types
  switch (message.type) {
    case 'GET_AUTH_TOKEN':
      getAuthToken().then(sendResponse);
      return true; // Keep message channel open for async response

    case 'STORE_AUTH_TOKEN':
      storeAuthToken(message.token).then(() => sendResponse({ success: true }));
      return true;

    default:
      console.warn('Unknown message type:', message.type);
  }
});

// Auth token management
async function getAuthToken(): Promise<string | null> {
  try {
    const result = await chrome.storage.local.get(['authToken']);
    return result.authToken || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

async function storeAuthToken(token: string): Promise<void> {
  try {
    await chrome.storage.local.set({ authToken: token });
    console.log('Auth token stored successfully');
  } catch (error) {
    console.error('Error storing auth token:', error);
  }
}
