const MEASUREMENT_ID = 'G-64CLVK0GHE';
const ANALYTICS_ENABLED = import.meta.env.PROD;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let initialized = false;
let lastTrackedPath = '';

function gtag(...args: unknown[]) {
  window.gtag?.(...args);
}

export function initializeAnalytics() {
  if (!ANALYTICS_ENABLED || initialized || typeof window === 'undefined') {
    return;
  }

  initialized = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function (...args: unknown[]) {
      window.dataLayer?.push(args);
    };

  gtag('js', new Date());
  gtag('config', MEASUREMENT_ID, { send_page_view: false });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  trackPageView(`${window.location.pathname}${window.location.search}`);
}

export function trackPageView(path: string) {
  if (!ANALYTICS_ENABLED || !window.gtag || path === lastTrackedPath) {
    return;
  }

  lastTrackedPath = path;
  gtag('event', 'page_view', {
    page_path: path,
    page_title: document.title,
    page_location: window.location.href,
  });
}

export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (!ANALYTICS_ENABLED || !window.gtag) {
    return;
  }

  gtag('event', eventName, params);
}
