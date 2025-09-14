// src/background.ts
import { supabase } from "./utils/supabase";

// Listen for messages from content scripts / popup / dashboard
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "CAPTURE_SCREENSHOT") {
    chrome.tabs
      .captureVisibleTab({ format: "png", quality: 80 })
      .then((dataUrl) => {
        console.log("Background script: Screenshot captured successfully");
        sendResponse({ dataUrl });
      })
      .catch((error) => {
        console.error("Background script: Error taking screenshot:", error);
        sendResponse({
          error: error instanceof Error ? error.message : "Unknown error",
        });
      });

    return true;
  }

  if (msg.type === "SET_TOKEN") {
    // Store token & userId in extension storage
    chrome.storage.local.set({
      token: msg.token,
      refreshToken: msg.refreshToken,
      userId: msg.userId,
    });
    console.log("Token saved in extension storage:", msg.token);

    // Initialize Supabase session in the extension
    supabase.auth.setSession({
      access_token: msg.token,
      refresh_token: msg.refreshToken,
    });
  }

});
