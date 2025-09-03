// Background script for extension lifecycle management

console.log("Peekberry background script loaded");

// Extension installation handler
chrome.runtime.onInstalled.addListener(() => {
  console.log("Peekberry extension installed");
});

// Basic background script setup
// Future tasks will expand this with API communication and messaging
