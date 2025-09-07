// Popup script for Peekberry Chrome extension

document.addEventListener('DOMContentLoaded', () => {
  const openDashboardBtn = document.getElementById('openDashboard');
  const toggleExtensionBtn = document.getElementById('toggleExtension');
  const statusDiv = document.getElementById('status');

  // Open dashboard in new tab
  openDashboardBtn?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:3000/dashboard' });
  });

  // Toggle extension functionality
  toggleExtensionBtn?.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (tab.id) {
        // Send message to content script to toggle functionality
        chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_EXTENSION' });

        if (statusDiv) {
          statusDiv.textContent = 'Extension toggled';
        }
      }
    } catch (error) {
      console.error('Error toggling extension:', error);
      if (statusDiv) {
        statusDiv.textContent = 'Error toggling extension';
      }
    }
  });

  // Check auth status
  checkAuthStatus();
});

async function checkAuthStatus() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_AUTH_TOKEN',
    });
    const statusDiv = document.getElementById('status');

    if (statusDiv) {
      if (response) {
        statusDiv.textContent = 'Authenticated ✓';
        statusDiv.style.color = '#059669';
      } else {
        statusDiv.textContent = 'Please authenticate in dashboard';
        statusDiv.style.color = '#dc2626';
      }
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
  }
}
