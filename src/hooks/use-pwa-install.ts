import { useCallback, useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type InstallPlatform = "ios" | "android" | "desktop";
export type InstallOutcome = "accepted" | "dismissed" | "unavailable";

function detectPlatform(): InstallPlatform {
  const ua = window.navigator.userAgent || "";
  // iPadOS 會把自己裝成 Mac，靠多點觸控判斷
  const isIpadOs = /macintosh/i.test(ua) && window.navigator.maxTouchPoints > 1;

  if (/iphone|ipad|ipod/i.test(ua) || isIpadOs) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
}

/** 是否已經以獨立視窗（已安裝的 App）開啟 */
function detectStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * 安裝成 App 的狀態。
 *
 * 支援的瀏覽器（Chrome／Edge／Android Chrome）會發出 beforeinstallprompt，
 * 我們記下它並在使用者按下按鈕時呼叫；iOS Safari 不支援，所以要改用文字教學。
 */
export function usePwaInstall() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform] = useState<InstallPlatform>(detectPlatform);

  useEffect(() => {
    setIsInstalled(detectStandalone());

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    }

    function onInstalled() {
      setPromptEvent(null);
      setIsInstalled(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<InstallOutcome> => {
    if (!promptEvent) return "unavailable";

    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;

    // 這個事件只能用一次
    setPromptEvent(null);

    return outcome;
  }, [promptEvent]);

  return { canPrompt: Boolean(promptEvent), isInstalled, platform, promptInstall };
}
