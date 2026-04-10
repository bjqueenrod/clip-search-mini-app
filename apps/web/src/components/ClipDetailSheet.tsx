import { MouseEvent, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { openBotDeepLink, sendBotWebAppData } from '../app/telegram';
import { trackClipBotCtaClick, trackClipDetailView, trackClipTagSelect } from '../features/clips/analytics';
import { ClipItem } from '../features/clips/types';
import { CurrencyCode, formatDuration, formatPrice } from '../utils/format';
import { resolvePriceLabel } from '../utils/pricing';
import { PreviewPlayer } from './PreviewPlayer';
import { PaymentSheet } from './PaymentSheet';

export function ClipDetailSheet({ clip, loading, currency = 'GBP' }: { clip?: ClipItem; loading?: boolean; currency?: CurrencyCode }) {
  const location = useLocation();
  const lastTrackedClipIdRef = useRef('');
  const [showPayment, setShowPayment] = useState<null | 'stream' | 'download'>(null);
  const backTarget = `/clips${location.search}`;
  const tagHref = (tag: string) => {
    const params = new URLSearchParams();
    params.set('q', `#${tag}`);
    return `/clips?${params.toString()}`;
  };
  const handleBotAction = (url: string, ctaType: 'stream' | 'download') => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (clip) {
      trackClipBotCtaClick({ clip, ctaType });
    }
    const payload = ctaType === 'stream' ? `stream_${clip?.id}` : `download_${clip?.id}`;
    const isTelegramWebApp = Boolean(window.Telegram?.WebApp);
    const productId = ctaType === 'stream' ? clip?.watchProductId : clip?.downloadProductId;

    if (productId) {
      setShowPayment(ctaType);
      return;
    }

    if (clip && isTelegramWebApp && sendBotWebAppData(payload)) {
      return;
    }
    if (isTelegramWebApp) {
      return;
    }
    openBotDeepLink(url);
  };

  useEffect(() => {
    const scrollY = window.scrollY;
    const { body } = document;
    const root = document.documentElement;
    const previousBody = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };
    const previousRootOverflow = root.style.overflow;

    root.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';

    return () => {
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBody.overflow;
      body.style.position = previousBody.position;
      body.style.top = previousBody.top;
      body.style.width = previousBody.width;
      window.scrollTo(0, scrollY);
    };
  }, []);

  useEffect(() => {
    if (!clip || lastTrackedClipIdRef.current === clip.id) {
      return;
    }
    lastTrackedClipIdRef.current = clip.id;
    trackClipDetailView(clip);
  }, [clip]);

  const streamPriceLabel = clip
    ? resolvePriceLabel({
        currency,
        pricings: [clip.streamPricing, clip.watchPricing, clip.pricing],
        fallbackAmountPenceCandidates: [clip.streamPricePence, clip.watchPricePence, clip.pricePence],
        fallbackAmountCandidates: [clip.streamPrice, clip.price],
        fallbackLabelCandidates: [clip.streamPriceLabel, clip.watchPriceLabel, clip.priceLabel],
        defaultLabel: formatPrice(clip.streamPrice ?? clip.price, currency),
      })
    : undefined;

  const downloadPriceLabel = clip
    ? resolvePriceLabel({
        currency,
        pricings: [clip.downloadPricing, clip.pricing],
        fallbackAmountPenceCandidates: [clip.downloadPricePence, clip.pricePence],
        fallbackAmountCandidates: [clip.downloadPrice, clip.price],
        fallbackLabelCandidates: [clip.downloadPriceLabel, clip.priceLabel],
        defaultLabel: formatPrice(clip.downloadPrice ?? clip.price, currency),
      })
    : undefined;

  const streamUnitPence =
    clip?.streamPricePence ??
    clip?.watchPricePence ??
    clip?.pricePence ??
    Math.round(100 * (clip?.streamPrice ?? clip?.price ?? 0));
  const downloadUnitPence =
    clip?.downloadPricePence ??
    clip?.pricePence ??
    Math.round(100 * (clip?.downloadPrice ?? clip?.price ?? 0));

  return (
    <div className="detail-sheet__backdrop">
      <div className="detail-sheet">
        <div className="detail-sheet__header">
          <Link to={backTarget} className="detail-sheet__back">
            Back
          </Link>
          <span>Clip Preview</span>
        </div>
        {loading && <div className="detail-sheet__loading">Loading clip...</div>}
        {!loading && clip && (
          <>
            <PreviewPlayer
              embedUrl={clip.previewEmbedUrl}
              thumbnailUrl={clip.thumbnailUrl}
              previewImageUrl={clip.previewWebpUrl}
              title={clip.title}
            />
            <div className="detail-sheet__body">
              <div className="detail-sheet__eyebrow">
                <span>{clip.category || 'Library'}</span>
                  <span>{formatDuration(clip.durationLabel, clip.durationSeconds)}</span>
                </div>
              <h2>{clip.title}</h2>
              <p>{clip.description || clip.shortDescription}</p>
              <div className="detail-sheet__tags">
                {clip.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={tagHref(tag)}
                    state={{ pinSearchPanel: true }}
                    onClick={() => trackClipTagSelect({ tag, source: 'detail_sheet', clip })}
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
            <div className="detail-sheet__actions">
              <a
                href={clip.botStreamUrl}
                target="_blank"
                rel="noreferrer"
                className="detail-sheet__action detail-sheet__action--stream"
                onClick={handleBotAction(clip.botStreamUrl, 'stream')}
              >
                <div className="detail-sheet__action-stack">
                  <span aria-hidden="true">🎬</span>
                  <strong>Stream Now</strong>
                  <span>{streamPriceLabel}</span>
                </div>
              </a>
              <a
                href={clip.botDownloadUrl}
                target="_blank"
                rel="noreferrer"
                className="detail-sheet__action detail-sheet__action--download"
                onClick={handleBotAction(clip.botDownloadUrl, 'download')}
              >
                <div className="detail-sheet__action-stack">
                  <span aria-hidden="true">📥</span>
                  <strong>Download Now</strong>
                  <span>{downloadPriceLabel}</span>
                </div>
              </a>
            </div>
            {showPayment && clip ? (
              <PaymentSheet
                productId={showPayment === 'stream' ? String(clip.watchProductId) : String(clip.downloadProductId)}
                quantity={1}
                mode={showPayment === 'stream' ? 'watch' : 'download'}
                priceLabel={showPayment === 'stream' ? streamPriceLabel : downloadPriceLabel}
                botFallbackUrl={showPayment === 'stream' ? clip.botStreamUrl : clip.botDownloadUrl}
                itemContext={{
                  unitPriceCents: showPayment === 'stream' ? streamUnitPence : downloadUnitPence,
                  clipId: clip.id,
                }}
                onClose={() => setShowPayment(null)}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
