import { useState, useEffect } from "react";
import { Download, Smartphone, X, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-card-dismissed";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function PWAInstallCard() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Check if dismissed recently
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissedTime < DISMISS_DURATION) {
        return;
      }
      localStorage.removeItem(DISMISS_KEY);
    }

    // For iOS, always show the card with instructions
    if (isIOSDevice) {
      setIsVisible(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  };

  if (!isVisible || isInstalled) return null;

  return (
    <Card className="bg-gradient-to-r from-primary to-primary/80 border-primary/20 relative overflow-hidden">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition-colors z-10"
        aria-label={t("common.close", "Fechar")}
      >
        <X className="h-4 w-4 text-primary-foreground" />
      </button>
      
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Smartphone className="h-5 w-5 text-primary-foreground" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-primary-foreground text-sm">
              {t("pwa.installTitle", "Instale o MoneyQuest")}
            </h3>
            <p className="text-xs text-primary-foreground/80 mt-0.5">
              {isIOS 
                ? t("pwa.iosInstructions", "Toque em Compartilhar e depois \"Adicionar à Tela de Início\"")
                : t("pwa.installDescription", "Acesse mais rápido direto da sua tela inicial")
              }
            </p>

            {isIOS ? (
              <div className="mt-2 p-2 bg-white/10 rounded-lg">
                <div className="flex items-center gap-2 text-primary-foreground text-xs font-medium">
                  <span className="flex items-center justify-center w-6 h-6 bg-white/20 rounded">1</span>
                  <span>{t("pwa.iosTapShare", "Toque no ícone")}</span>
                  <Share className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 text-primary-foreground text-xs font-medium mt-1.5">
                  <span className="flex items-center justify-center w-6 h-6 bg-white/20 rounded">2</span>
                  <span>{t("pwa.addToHomeScreen", "Adicionar à Tela de Início")}</span>
                </div>
              </div>
            ) : (
              <Button
                onClick={handleInstall}
                size="sm"
                variant="secondary"
                className="mt-2 bg-white hover:bg-white/90 text-primary font-medium"
              >
                <Download className="h-4 w-4 mr-2" />
                {t("pwa.installButton", "Instalar App")}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
