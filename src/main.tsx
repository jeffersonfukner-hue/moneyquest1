import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerMoneyQuestSW } from "./pwa/registerMoneyQuestSW";

// Recover from stale cached chunks (common after SW + deploy)
window.addEventListener("error", (event) => {
  const message = String((event as ErrorEvent).message || "");
  if (message.includes("Loading chunk") || message.includes("ChunkLoadError")) {
    window.location.reload();
  }
});

registerMoneyQuestSW();

createRoot(document.getElementById("root")!).render(<App />);

