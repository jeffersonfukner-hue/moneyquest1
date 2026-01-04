import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerMoneyQuestSW } from "./pwa/registerMoneyQuestSW";

const BUILD_VERSION = import.meta.env.VITE_BUILD_VERSION || "unknown";
const STORAGE_KEY = "mq_build_version";

// Helper to clear all caches and reload
async function clearCachesAndReload() {
  try {
    if (typeof caches !== "undefined") {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
    }
  } catch {
    // Ignore cache API errors
  }
  location.reload();
}

// Proactive version check: detect stale cache before errors occur
function checkVersionAndReload(): boolean {
  const storedVersion = localStorage.getItem(STORAGE_KEY);
  
  if (storedVersion && storedVersion !== BUILD_VERSION) {
    console.info(`[MoneyQuest] Version mismatch: ${storedVersion} → ${BUILD_VERSION}. Clearing cache...`);
    localStorage.setItem(STORAGE_KEY, BUILD_VERSION);
    clearCachesAndReload();
    return true;
  }
  
  // Store current version
  localStorage.setItem(STORAGE_KEY, BUILD_VERSION);
  return false;
}

// Recover from stale cached chunks (common after SW + deploy)
function handleChunkError(event: Event) {
  const message = String((event as ErrorEvent).message || "");
  if (
    message.includes("Loading chunk") ||
    message.includes("ChunkLoadError") ||
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("error loading dynamically imported module")
  ) {
    console.warn("[MoneyQuest] Chunk load error detected. Forcing reload...");
    clearCachesAndReload();
  }
}

// Also catch unhandled promise rejections (dynamic imports throw these)
function handleRejection(event: PromiseRejectionEvent) {
  const reason = String(event.reason?.message || event.reason || "");
  if (
    reason.includes("Failed to fetch dynamically imported module") ||
    reason.includes("error loading dynamically imported module") ||
    reason.includes("Loading chunk")
  ) {
    console.warn("[MoneyQuest] Dynamic import rejection detected. Forcing reload...");
    event.preventDefault();
    clearCachesAndReload();
  }
}

// Run version check first - if reload needed, stop here
if (!checkVersionAndReload()) {
  // Only proceed if no reload is happening
  window.addEventListener("error", handleChunkError);
  window.addEventListener("unhandledrejection", handleRejection);
  
  registerMoneyQuestSW();
  
  createRoot(document.getElementById("root")!).render(<App />);
}
