import { createRoot } from "react-dom/client";
import App from "./App";

// Inject React app into page
const container = document.createElement("div");
container.id = "dom-extension-root";
container.style.zIndex = "100000";
document.body.appendChild(container);

const root = createRoot(container);
root.render(<App />);

// Minimal screenshot helper (can be called from your App buttons)
export async function takeScreenshot(prompt: string, action: string) {
  const dataUrl = await chrome.tabs.captureVisibleTab();
  const pageUrl = window.location.href;

  chrome.runtime.sendMessage({
    type: "UPLOAD_SCREENSHOT",
    dataUrl,
    pageUrl,
    prompt,
    action,
  });
}