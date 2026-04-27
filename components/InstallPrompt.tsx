"use client";

import { useEffect, useState } from "react";
import { X, Share, BookOpen } from "lucide-react";

type Platform = "android" | "ios" | null;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "pwa-install-dismissed";

export default function InstallPrompt() {
  const [platform, setPlatform] = useState<Platform>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;
    // Already running as installed PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if ((window.navigator as { standalone?: boolean }).standalone === true) return;

    const ua = window.navigator.userAgent;
    const isIOS =
      /iphone|ipad|ipod/i.test(ua) &&
      /safari/i.test(ua) &&
      !/chrome|crios|fxios/i.test(ua);

    if (isIOS) {
      setPlatform("ios");
      const t = setTimeout(() => setVisible(true), 12000);
      return () => clearTimeout(t);
    }

    // Android / Chrome — defer until browser fires the install event
    let t: ReturnType<typeof setTimeout>;
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setPlatform("android");
      t = setTimeout(() => setVisible(true), 12000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(t);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, "1");
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") dismiss();
    setDeferredPrompt(null);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 z-50 max-w-sm mx-auto animate-fade-in">
      <div className="bg-surface-raised border border-line rounded-xl p-4 shadow-xl">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-surface-overlay border border-line-subtle flex items-center justify-center shrink-0">
            <BookOpen size={18} className="text-gold" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-ink-primary mb-0.5">
              Add to Home Screen
            </p>
            {platform === "ios" ? (
              <p className="text-[12px] text-ink-secondary leading-[1.5] m-0">
                Tap <Share size={11} className="inline align-middle mx-0.5" /> in
                the Safari toolbar, then{" "}
                <span className="text-ink-primary font-semibold">
                  &ldquo;Add to Home Screen&rdquo;
                </span>
                .
              </p>
            ) : (
              <p className="text-[12px] text-ink-secondary m-0">
                Install for quick, offline access.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {platform === "android" && (
              <button
                onClick={handleInstall}
                className="px-3 py-1.5 bg-gold text-surface text-[12px] font-bold rounded-lg border-none cursor-pointer"
              >
                Install
              </button>
            )}
            <button
              onClick={dismiss}
              className="bg-transparent border-none cursor-pointer text-ink-muted p-0.5"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* iOS: nudge toward the share button below */}
        {platform === "ios" && (
          <p className="text-[10px] text-ink-muted text-center mt-2.5 mb-0">
            ↓ Share button is in the Safari toolbar below
          </p>
        )}
      </div>
    </div>
  );
}
