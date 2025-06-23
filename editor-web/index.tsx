import { createRoot } from "react-dom/client";
import { AdvancedEditor } from "./AdvancedEditor";

/**
 * This is the entrypoint for the "web" part of our editor that will be built with vite
 */

// Extend the Window interface to include the contentInjected flag
declare global {
  interface Window {
    contentInjected?: boolean;
  }
}

// Helper to check if the native bridge has injected our bundle
const isContentInjected = () => window.contentInjected === true;

// Poll for content injection before mounting the React app
const mountEditor = () => {
  const container = document.getElementById("root");
  if (!container) {
    console.error("Root container not found");
    return;
  }
  const root = createRoot(container);
  root.render(<AdvancedEditor />);
};

let interval: number | undefined;
interval = window.setInterval(() => {
  if (!isContentInjected()) return;
  mountEditor();
  if (interval) window.clearInterval(interval);
}, 1);
