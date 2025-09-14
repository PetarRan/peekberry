/**
 * Takes a screenshot of the current viewport (excluding the extension UI)
 * and uploads it to Supabase
 */
export const takeScreenshot = async (): Promise<string | null> => {
  try {
    // Use Chrome's captureVisibleTab API to take a screenshot
    const dataUrl = await chrome.tabs.captureVisibleTab({
      format: 'png',
      quality: 80
    });

    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // Create FormData for upload
    const formData = new FormData();
    formData.append('file', blob, `screenshot-${Date.now()}.png`);

    // Upload to your edge function
    const uploadResponse = await fetch('/api/upload-screenshot', {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload screenshot');
    }

    const result = await uploadResponse.json();
    return result.url; // Return the uploaded file URL

  } catch (error) {
    console.error('Error taking screenshot:', error);
    return null;
  }
};

/**
 * Takes a screenshot and saves it to Supabase with metadata
 */
export const saveScreenshotToSupabase = async (metadata?: {
  selectedElements?: string[];
  prompt?: string;
  model?: string;
}): Promise<boolean> => {
  try {
    const screenshotUrl = await takeScreenshot();
    
    if (!screenshotUrl) {
      return false;
    }

    // Save metadata to Supabase
    const response = await fetch('/api/save-screenshot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        screenshotUrl,
        metadata: {
          timestamp: new Date().toISOString(),
          ...metadata,
        },
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error saving screenshot to Supabase:', error);
    return false;
  }
};
