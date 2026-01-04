import { toast } from "sonner";
import { registerSW } from "virtual:pwa-register";

const UPDATE_CHECK_INTERVAL = 60 * 1000; // Check every 60 seconds

export function registerMoneyQuestSW() {
  // Avoid any SW shenanigans during local dev
  if (import.meta.env.DEV) return;

  let updateAvailable = false;

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateAvailable = true;
      
      // Auto-update if page is hidden (user not actively using)
      if (document.hidden) {
        console.info("[MoneyQuest] Auto-updating in background...");
        updateSW(true);
        return;
      }
      
      toast.message("Atualização disponível", {
        description: "Uma nova versão do MoneyQuest está pronta.",
        duration: 10000,
        action: {
          label: "Atualizar",
          onClick: async () => {
            await updateSW(true);
          },
        },
      });
    },
    onOfflineReady() {
      // Keep silent (avoid noise); PWA requirement still met.
    },
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;

      // Proactively check for updates when tab regains focus
      const checkForUpdate = async () => {
        try {
          await registration.update();
        } catch {
          // ignore network errors
        }
      };

      window.addEventListener("focus", checkForUpdate);
      
      // Also check periodically
      setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL);

      // Auto-apply update when user leaves the page
      document.addEventListener("visibilitychange", () => {
        if (document.hidden && updateAvailable) {
          console.info("[MoneyQuest] Applying update while page hidden...");
          updateSW(true);
        }
      });
    },
    onRegisterError(error) {
      // This should never block the app.
      console.warn("SW registration error:", error);
    },
  });
}
