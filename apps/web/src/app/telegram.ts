import { retrieveLaunchParams } from '@tma.js/sdk';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready?: () => void;
        expand?: () => void;
        close?: () => void;
        themeParams?: Record<string, string>;
        initData?: string;
        initDataUnsafe?: { user?: { id: number; username?: string; first_name?: string } };
      };
    };
  }
}

export type TelegramContext = {
  isTelegram: boolean;
  initData?: string;
  user?: { id: number; username?: string; firstName?: string };
  close?: () => void;
};

export function getTelegramContext(): TelegramContext {
  const webApp = window.Telegram?.WebApp;
  try {
    const launch = retrieveLaunchParams() as {
      initData?: { user?: { id: number; username?: string; firstName?: string } };
      initDataRaw?: string;
    };
    const user = launch.initData?.user;
    webApp?.ready?.();
    webApp?.expand?.();
    return {
      isTelegram: true,
      initData: webApp?.initData || launch.initDataRaw || undefined,
      user: user ? { id: user.id, username: user.username, firstName: user.firstName } : undefined,
      close: () => webApp?.close?.(),
    };
  } catch {
    const unsafe = webApp?.initDataUnsafe?.user;
    return {
      isTelegram: Boolean(webApp),
      initData: webApp?.initData,
      user: unsafe ? { id: unsafe.id, username: unsafe.username, firstName: unsafe.first_name } : undefined,
      close: () => webApp?.close?.(),
    };
  }
}

export function applyTelegramTheme(): void {
  const theme = window.Telegram?.WebApp?.themeParams ?? {};
  const root = document.documentElement;
  Object.entries(theme).forEach(([key, value]) => {
    root.style.setProperty(`--tg-${key}`, value);
  });
}
