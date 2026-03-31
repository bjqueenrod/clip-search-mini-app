import { MouseEvent, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { TelegramDevBanner } from '../components/TelegramDevBanner';
import { TierDetailSheet } from '../components/TierDetailSheet';
import { TierGrid } from '../components/TierGrid';
import { applyTelegramTheme, openBotDeepLink } from '../app/telegram';
import { useTelegramSession } from '../features/auth/hooks';
import { useTierDetail, useTiers } from '../features/tiers/hooks';
import { getBotRootUrl } from '../features/tiers/presentation';

const VALUE_POINTS = [
  'Personalised to your kinks and toys',
  'Reviewed personally by me',
  'One task at a time',
  'Beginner-friendly to intense',
];

const HOW_IT_WORKS_STEPS = [
  'Choose a package',
  'Submit your preferences',
  'Receive your personalised task',
  'Send proof and continue in the bot',
];

const BUILT_AROUND_YOU_POINTS = [
  'Your kinks',
  'Your limits',
  'Your toy list',
  'Your experience level',
  'Your preferred intensity',
];

const FAQS = [
  {
    question: 'Do I need lots of toys?',
    answer: 'No. Tasks can be tailored to what you actually own.',
  },
  {
    question: 'Can beginners buy?',
    answer: 'Yes. You can choose something softer, simpler, or more intense depending on your experience.',
  },
  {
    question: 'Are the tasks always custom?',
    answer: 'Yes. They are built around your submitted preferences.',
  },
  {
    question: 'What kind of proof is required?',
    answer: 'Proof depends on the task. You will be guided where needed.',
  },
  {
    question: 'How do I pay?',
    answer: 'Choose your package here, then continue in the bot to complete payment.',
  },
];

export function TasksPage() {
  const session = useTelegramSession();
  const { tierId } = useParams();
  const tiersQuery = useTiers();
  const tierDetailQuery = useTierDetail(tierId);
  const botRootUrl = useMemo(() => getBotRootUrl(tiersQuery.data?.items ?? []), [tiersQuery.data?.items]);

  useEffect(() => {
    applyTelegramTheme();
  }, []);

  const handleBotAction = (url?: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (!url) {
      return;
    }
    event.preventDefault();
    openBotDeepLink(url);
  };

  return (
    <AppShell>
      {!session.isTelegram && <TelegramDevBanner />}
      <section className="hero hero--tasks">
        <div className="hero__banner-frame">
          <img className="hero__banner hero__banner--framed" src="/header.png?v=20260401a" alt="Mistress BJQueen Custom Obedience Tasks" />
          <div className="hero__banner-mask" aria-hidden="true" />
          <div className="hero__banner-copy">
            <span className="hero__banner-kicker">Mistress BJQueen&apos;s</span>
            <strong>Custom Obedience</strong>
            <span>Personalised obedience packages</span>
          </div>
        </div>
      </section>

      <section className="tasks-hero">
        <p className="hero__eyebrow">Custom Obedience Tasks</p>
        <h1>Choose your Custom Obedience package.</h1>
        <p>Personalised tasks written around your kinks, limits, and toy list.</p>
        <p>Choose your package here, then continue in the bot for payment and fulfilment.</p>
        <div className="tasks-hero__actions">
          <a className="tasks-button tasks-button--primary" href="#packages">
            Choose Your Package
          </a>
          <a
            className="tasks-button tasks-button--secondary"
            href={botRootUrl || '#packages'}
            onClick={handleBotAction(botRootUrl)}
          >
            Back to Bot
          </a>
        </div>
      </section>

      <section className="tasks-strip" aria-label="Why buyers choose custom obedience">
        {VALUE_POINTS.map((point) => (
          <div key={point} className="tasks-chip">
            {point}
          </div>
        ))}
      </section>

      <section className="tasks-panel">
        <div className="tasks-panel__header">
          <p className="hero__eyebrow">How It Works</p>
          <h2>Simple, personal, and guided.</h2>
        </div>
        <div className="tasks-steps">
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <div key={step} className="tasks-step">
              <span className="tasks-step__number">0{index + 1}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>
        <p className="tasks-panel__supporting-copy">
          Tasks are delivered one at a time to keep the experience personal, focused, and interactive.
        </p>
      </section>

      <section className="tasks-section" id="packages">
        <div className="tasks-section__header">
          <p className="hero__eyebrow">Choose Your Package</p>
          {tiersQuery.data && <span className="tasks-section__count">{tiersQuery.data.total} available</span>}
        </div>

        {tiersQuery.isLoading && (
          <div className="tier-grid" aria-hidden="true">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="tier-card tier-card--skeleton">
                <span className="top-sellers__line top-sellers__line--small" />
                <span className="top-sellers__line top-sellers__line--title" />
                <span className="top-sellers__line top-sellers__line--title top-sellers__line--short" />
                <span className="top-sellers__line top-sellers__line--body" />
                <span className="top-sellers__line top-sellers__line--body top-sellers__line--short" />
                <span className="top-sellers__line top-sellers__line--price" />
              </div>
            ))}
          </div>
        )}

        {tiersQuery.isError && <ErrorState message={(tiersQuery.error as Error).message} />}
        {!tiersQuery.isLoading && tiersQuery.data && tiersQuery.data.items.length > 0 && <TierGrid items={tiersQuery.data.items} />}
        {!tiersQuery.isLoading && tiersQuery.data && tiersQuery.data.items.length === 0 && (
          <EmptyState title="No packages available" message="Active custom obedience packages will appear here when they are ready." />
        )}
      </section>

      <section className="tasks-panel">
        <div className="tasks-panel__header">
          <p className="hero__eyebrow">Built Around You</p>
          <h2>Built Around You</h2>
        </div>
        <p className="tasks-panel__body-copy">
          These are not generic tasks. Every assignment is shaped around your kinks, limits, experience level, and the toys you actually own.
        </p>
        <div className="tasks-strip tasks-strip--personal">
          {BUILT_AROUND_YOU_POINTS.map((point) => (
            <div key={point} className="tasks-chip tasks-chip--soft">
              {point}
            </div>
          ))}
        </div>
      </section>

      <section className="tasks-panel">
        <div className="tasks-panel__header">
          <p className="hero__eyebrow">FAQ</p>
          <h2>Questions before you choose?</h2>
        </div>
        <div className="faq-list">
          {FAQS.map((item) => (
            <details key={item.question} className="faq-card">
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="tasks-panel tasks-panel--cta">
        <div className="tasks-panel__header">
          <p className="hero__eyebrow">Ready When You Are</p>
          <h2>Ready for your first assignment?</h2>
        </div>
        <p className="tasks-panel__body-copy">
          Choose your package in the bot and get personalised tasks built around your kinks, limits, and toy list.
        </p>
        <div className="tasks-hero__actions">
          <a
            className="tasks-button tasks-button--primary"
            href={botRootUrl || '#packages'}
            onClick={handleBotAction(botRootUrl)}
          >
            Choose Package in Bot
          </a>
          <a
            className="tasks-button tasks-button--secondary"
            href={botRootUrl || '#packages'}
            onClick={handleBotAction(botRootUrl)}
          >
            Back to Bot
          </a>
        </div>
      </section>

      <div className="sticky-mobile-cta">
        <div className="sticky-mobile-cta__content">
          <span>{tiersQuery.data ? `${tiersQuery.data.total} packages ready` : 'Custom Obedience Tasks'}</span>
          <a
            className="tasks-button tasks-button--primary sticky-mobile-cta__button"
            href={botRootUrl || '#packages'}
            onClick={handleBotAction(botRootUrl)}
          >
            Choose Package in Bot
          </a>
        </div>
      </div>

      {tierId && <TierDetailSheet tier={tierDetailQuery.data} loading={tierDetailQuery.isLoading} />}
    </AppShell>
  );
}
