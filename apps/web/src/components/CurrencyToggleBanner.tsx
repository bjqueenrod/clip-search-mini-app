import { useCurrencyPreference } from '../hooks/useCurrencyPreference';

type CurrencyToggleBannerProps = {
  onBackClick?: () => void;
  showBackButton?: boolean;
  alignRight?: boolean;
  syncWithServer?: boolean;
  debugInfo?: {
    isTelegram: boolean;
    hasInitData: boolean;
    source: string;
    telegramUserId?: number | null;
  };
};

export function CurrencyToggleBanner({
  onBackClick,
  showBackButton = false,
  alignRight = false,
  syncWithServer = false,
  debugInfo,
}: CurrencyToggleBannerProps) {
  const [currency, setCurrency] = useCurrencyPreference(syncWithServer);

  return (
    <div
      className={`dev-banner currency-banner${showBackButton ? ' currency-banner--with-back' : ''}${
        alignRight ? ' currency-banner--right-aligned' : ''
      }`}
    >
      <div className="currency-banner__row">
        {showBackButton ? (
          <button type="button" className="currency-banner__back" onClick={onBackClick} aria-label="Back to Home">
            ← Back
          </button>
        ) : null}
        <div className="currency-banner__toggle" role="group" aria-label="Choose currency">
          <button
            type="button"
            className={`currency-pill ${currency === 'GBP' ? 'is-active' : ''}`}
            onClick={() => setCurrency('GBP')}
            aria-pressed={currency === 'GBP'}
          >
            £ GBP
          </button>
          <button
            type="button"
            className={`currency-pill ${currency === 'USD' ? 'is-active' : ''}`}
            onClick={() => setCurrency('USD')}
            aria-pressed={currency === 'USD'}
          >
            $ USD
          </button>
        </div>
      </div>
      {debugInfo ? (
        <div className="currency-banner__debug">
          <span>isTelegram: {debugInfo.isTelegram ? 'true' : 'false'}</span>
          <span>hasInitData: {debugInfo.hasInitData ? 'true' : 'false'}</span>
          <span>source: {debugInfo.source}</span>
          <span>telegram_user_id: {debugInfo.telegramUserId ?? 'n/a'}</span>
        </div>
      ) : null}
    </div>
  );
}
