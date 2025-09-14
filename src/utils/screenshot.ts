/**
 * Ask background.ts to take a screenshot of the active tab
 */
export const takeScreenshot = async (): Promise<string | null> => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "CAPTURE_SCREENSHOT" }, (response) => {
      if (response?.dataUrl) {
        resolve(response.dataUrl);
      } else {
        console.error("Failed to capture screenshot", response?.error);
        resolve(null);
      }
    });
  });
};

/**
 * Save screenshot to Supabase
 */
export const saveScreenshotToSupabase = async (_metadata?: {
  selectedElements?: string[];
  prompt?: string;
  model?: string;
}): Promise<boolean> => {
  try {
    const dataUrl = await takeScreenshot();
    if (!dataUrl) return false;

    const pageUrl = window.location.href;

    // Import and use the direct Supabase functions
    const { saveScreenshotToSupabase: saveScreenshot, saveHistoryToSupabase } = await import("./supabaseClient");

    const screenshotSuccess = await saveScreenshot(pageUrl, dataUrl);
    const historySuccess = await saveHistoryToSupabase(
      _metadata?.prompt || "Screenshot taken",
      "screenshot"
    );

    return screenshotSuccess && historySuccess;
  } catch (error) {
    console.error("Error saving screenshot to Supabase:", error);
    return false;
  }
};