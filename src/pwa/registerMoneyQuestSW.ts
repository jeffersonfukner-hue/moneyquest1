import { toast } from "sonner";
import { registerSW } from "virtual:pwa-register";

export function registerMoneyQuestSW() {
  // Avoid any SW shenanigans during local dev
  if (import.meta.env.DEV) return;

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      toast.message("Atualização disponível", {
        description: "Uma nova versão do MoneyQuest está pronta. Atualize para evitar tela branca.",
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
    onRegisteredSW(_, registration) {
      // Proactively check for updates when tab regains focus.
      const onFocus = async () => {
        try {
          await registration?.update();
        } catch {
          // ignore
        }
      };
      window.addEventListener("focus", onFocus);
    },
    onRegisterError(error) {
      // This should never block the app.
      console.warn("SW registration error:", error);
    },
  });
}
