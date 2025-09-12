import { createRoot } from "react-dom/client";
import App from "./App";

// Create a container in the page
const container = document.createElement("div");
container.id = "dom-extension-root";
container.style.zIndex = "100000";
document.body.appendChild(container);

// Inject our React app into the page DOM
const root = createRoot(container);
root.render(<App />);
