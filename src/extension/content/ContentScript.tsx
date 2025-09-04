// Content script entry point
// This will be injected into web pages to provide Peekberry functionality

console.log('Peekberry content script loaded')

// Message listener for communication with background script and popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('Content script received message:', message)
  
  switch (message.type) {
    case 'ACTIVATE_EXTENSION':
      // Future task will implement FloatingWidget injection
      console.log('Extension activation requested')
      sendResponse({ success: true, message: 'Extension activated' })
      break
      
    case 'DEACTIVATE_EXTENSION':
      // Future task will implement widget removal
      console.log('Extension deactivation requested')
      sendResponse({ success: true, message: 'Extension deactivated' })
      break
      
    case 'GET_PAGE_INFO':
      // Return basic page information
      sendResponse({
        success: true,
        pageInfo: {
          url: window.location.href,
          title: document.title,
          domain: window.location.hostname
        }
      })
      break
      
    default:
      sendResponse({ success: false, error: 'Unknown message type' })
  }
  
  return true // Keep message channel open for async responses
})

// Initialize content script
const initializeContentScript = () => {
  // Check if extension should be active on this page
  // Future tasks will implement FloatingWidget and element highlighting
  console.log('Content script initialized on:', window.location.href)
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeContentScript)
} else {
  initializeContentScript()
}