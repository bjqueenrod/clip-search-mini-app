import { MouseEvent, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { TierCarousel } from '../components/TierCarousel';
import { TelegramDevBanner } from '../components/TelegramDevBanner';
import { TierDetailSheet } from '../components/TierDetailSheet';
import { applyTelegramTheme, openBotDeepLink } from '../app/telegram';
import { useTelegramSession } from '../features/auth/hooks';
import { getTierArtworkVariant } from '../features/tiers/artwork';
import { useTierDetail, useTiers } from '../features/tiers/hooks';
import { getBotRootUrl } from '../features/tiers/presentation';

type TaskIconName =
  | 'wand'
  | 'heart'
  | 'clock'
  | 'sparkles'
  | 'package'
  | 'sliders'
  | 'scroll'
  | 'chat'
  | 'shield'
  | 'toy'
  | 'signal'
  | 'help';

const VALUE_POINTS = [
  { label: 'Written around you', icon: 'wand' },
  { label: 'Checked personally', icon: 'shield' },
  { label: 'One step at a time', icon: 'clock' },
  { label: 'Soft to strict', icon: 'sparkles' },
] as const;

const HERO_PRIVATE_POINTS = [
  'Start softer or choose something stricter',
  'Toys optional, limits respected',
  'Works for first orders and experienced buyers',
] as const;

const WHY_CUSTOM_POINTS = [
  {
    title: 'Your yeses and nos lead',
    detail: 'What turns you on, what is off-limits, and what toys you actually own shape the task before it is written.',
    icon: 'sliders',
  },
  {
    title: 'The pace is chosen, not guessed',
    detail: 'You can start softer, stay controlled, or ask for something stricter without being dropped into the wrong intensity.',
    icon: 'clock',
  },
  {
    title: 'It unfolds with attention',
    detail: 'Instead of a dumped script, you get a cleaner step-by-step flow that feels watched, guided, and worth paying for.',
    icon: 'shield',
  },
] as const;

const HOW_IT_WORKS_STEPS = [
  {
    title: 'Choose your package',
    detail: 'Choose the level of pacing, structure, and control you want first.',
    icon: 'package',
  },
  {
    title: 'Set your preferences',
    detail: 'Submit your kinks, limits, toys, and how far you want the task to go.',
    icon: 'sliders',
  },
  {
    title: 'Receive your first instruction',
    detail: 'Your first assignment arrives in the bot shaped around your setup, pace, and preferences.',
    icon: 'scroll',
  },
  {
    title: 'Submit proof and keep progressing',
    detail: 'Reply in the bot, send proof where required, and continue from one controlled step to the next.',
    icon: 'chat',
  },
] as const;

const SAMPLE_TASK_CARDS = [
  {
    eyebrow: 'Soft possession',
    title: 'A calmer, more guided hold',
    body: 'A slower start with cleaner handling, steadier pacing, and reassurance built into each step.',
    icon: 'heart',
  },
  {
    eyebrow: 'Toy-led control',
    title: 'Written for the toys already in your drawer',
    body: 'Tasks shaped around the toys you already own, so the setup feels immediate, personal, and easy to start.',
    icon: 'toy',
  },
  {
    eyebrow: 'Formal obedience',
    title: 'Stricter pacing and clearer control',
    body: 'A firmer step-by-step flow with proof, cleaner instructions, and a stronger sense of deliberate progression.',
    icon: 'scroll',
  },
] as const;

const OFFER_POINTS = [
  {
    title: 'It feels handled, not automated',
    detail: 'The point is not just receiving a task. It is receiving something that lands on your exact nerve and holds your attention.',
    icon: 'scroll',
  },
  {
    title: 'Proof changes the tension',
    detail: 'When proof is required, the task stops feeling hypothetical. It becomes active, accountable, and harder to shrug off.',
    icon: 'shield',
  },
  {
    title: 'Different packages create different moods',
    detail: 'You can choose a softer first order, a steadier build, or a stricter package with more control and momentum.',
    icon: 'sparkles',
  },
] as const;

const REASSURANCE_POINTS = [
  'You can start with a lighter pace and a simpler setup.',
  'You do not need a huge toy collection to buy your first package.',
  'Every package is still tailored, even when you want something softer.',
] as const;

const FAQS = [
  {
    question: 'What makes these tasks custom?',
    answer: 'They are written around your preferences, limits, toys, and desired intensity instead of being sent as a generic prewritten list.',
    icon: 'sparkles',
  },
  {
    question: 'How many tasks do I get?',
    answer: 'That depends on the package you choose. Each tier sets the duration and pace clearly before you buy.',
    icon: 'clock',
  },
  {
    question: 'Do I need lots of toys?',
    answer: 'No. Tasks can be shaped around what you already own, even if your setup is simple.',
    icon: 'toy',
  },
  {
    question: 'What kind of proof is required?',
    answer: 'It depends on the task and the package. You will be told clearly what is needed, and proof is only used where it fits the flow.',
    icon: 'shield',
  },
  {
    question: 'Can beginners buy?',
    answer: 'Yes. You can start with a softer, simpler, more guided package and still receive something written personally for you.',
    icon: 'signal',
  },
  {
    question: 'How do I start?',
    answer: 'Choose your package here, continue in the bot, complete payment, then send your preferences so your first task can be prepared.',
    icon: 'help',
  },
] as const;

function TaskIcon({ name }: { name: TaskIconName }) {
  const commonProps = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'wand':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...commonProps} d="M4 20L14.5 9.5" />
          <path {...commonProps} d="M13 4l.7 1.8L15.5 6.5l-1.8.7L13 9l-.7-1.8L10.5 6.5l1.8-.7L13 4z" />
          <path {...commonProps} d="M18 11l.5 1.2L19.7 13l-1.2.5L18 14.7l-.5-1.2L16.3 13l1.2-.8L18 11z" />
        </svg>
      );
    case 'heart':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...commonProps} d="M12 20s-6.5-4.1-8.3-8.1C2.5 9.1 3.5 6 7 6c2 0 3.2 1 5 3 1.8-2 3-3 5-3 3.5 0 4.5 3.1 3.3 5.9C18.5 15.9 12 20 12 20z" />
        </svg>
      );
    case 'clock':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle {...commonProps} cx="12" cy="12" r="8" />
          <path {...commonProps} d="M12 8v4l2.5 2" />
        </svg>
      );
    case 'sparkles':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...commonProps} d="M12 3l1.1 3.1L16 7.2l-2.9 1.1L12 11.4l-1.1-3.1L8 7.2l2.9-1.1L12 3z" />
          <path {...commonProps} d="M18 12l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z" />
          <path {...commonProps} d="M7 13l.9 2.6L10.5 17l-2.6.9L7 20.5l-.9-2.6L3.5 17l2.6-.9L7 13z" />
        </svg>
      );
    case 'package':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...commonProps} d="M4 8.5L12 4l8 4.5v7L12 20l-8-4.5v-7z" />
          <path {...commonProps} d="M4 8.5L12 13l8-4.5" />
          <path {...commonProps} d="M12 13v7" />
        </svg>
      );
    case 'sliders':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...commonProps} d="M6 5v14M18 5v14M12 5v14" />
          <circle {...commonProps} cx="6" cy="9" r="2" />
          <circle {...commonProps} cx="12" cy="15" r="2" />
          <circle {...commonProps} cx="18" cy="10" r="2" />
        </svg>
      );
    case 'scroll':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...commonProps} d="M8 5h8a3 3 0 010 6H9a3 3 0 100 6h7" />
          <path {...commonProps} d="M8 5a3 3 0 100 6" />
          <path {...commonProps} d="M9 11h7" />
          <path {...commonProps} d="M9 15h5" />
        </svg>
      );
    case 'chat':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...commonProps} d="M6 7h12a2 2 0 012 2v6a2 2 0 01-2 2h-6l-4 3v-3H6a2 2 0 01-2-2V9a2 2 0 012-2z" />
          <path {...commonProps} d="M8.5 11.5h7" />
          <path {...commonProps} d="M8.5 14.5h4.5" />
        </svg>
      );
    case 'shield':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...commonProps} d="M12 4l6 2.5V11c0 4.2-2.3 6.9-6 9-3.7-2.1-6-4.8-6-9V6.5L12 4z" />
          <path {...commonProps} d="M9.5 12l1.7 1.7 3.3-3.4" />
        </svg>
      );
    case 'toy':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle {...commonProps} cx="8" cy="8" r="2.5" />
          <circle {...commonProps} cx="16" cy="8" r="2.5" />
          <path {...commonProps} d="M10.5 8h3" />
          <path {...commonProps} d="M8 10.5V13a4 4 0 004 4 4 4 0 004-4v-2.5" />
        </svg>
      );
    case 'signal':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...commonProps} d="M6 18V14" />
          <path {...commonProps} d="M10 18V11" />
          <path {...commonProps} d="M14 18V8" />
          <path {...commonProps} d="M18 18V5" />
        </svg>
      );
    case 'help':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle {...commonProps} cx="12" cy="12" r="8" />
          <path {...commonProps} d="M9.5 9.5a2.5 2.5 0 114.2 1.8c-.7.7-1.7 1.2-1.7 2.7" />
          <path {...commonProps} d="M12 16.5h0" />
        </svg>
      );
  }
}

export function TasksPage() {
  const session = useTelegramSession();
  const { tierId } = useParams();
  const tiersQuery = useTiers();
  const tierDetailQuery = useTierDetail(tierId);
  const botRootUrl = useMemo(() => getBotRootUrl(tiersQuery.data?.items ?? []), [tiersQuery.data?.items]);
  const tierArtworkVariants = useMemo(
    () =>
      Object.fromEntries((tiersQuery.data?.items ?? []).map((item, index) => [item.id, getTierArtworkVariant(index)])),
    [tiersQuery.data?.items],
  );

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
          <img
            className="hero__banner hero__banner--framed"
            src="/header.png?v=20260405b"
            alt="Mistress BJQueen Custom Obedience Tasks"
          />
          <div className="hero__banner-mask" aria-hidden="true" />
          <div className="hero__banner-copy">
            <span className="hero__banner-kicker">Mistress BJQueen&apos;s</span>
            <strong>Custom Obedience</strong>
            <span>Tailored private obedience packages</span>
          </div>
        </div>
      </section>

      <section className="tasks-hero">
        <div className="tasks-hero__grid">
          <div className="tasks-hero__main">
            <p className="hero__eyebrow">Custom Obedience Tasks</p>
            <h1>Private obedience, written for your kinks, limits, and how far you want to be pushed</h1>
            <p className="tasks-hero__lead">
              Not a generic task list. Your order is shaped around what you crave, what you avoid, the toys you own,
              and whether you want something softer, stricter, or somewhere in between.
            </p>
            <p className="tasks-hero__supporting-copy">
              Delivered step by step in the bot, with proof and personal review where the package calls for it.
            </p>
            <div className="tasks-hero__actions">
              <a className="tasks-button tasks-button--primary" href="#packages">
                View Packages
              </a>
              <a
                className="tasks-button tasks-button--secondary"
                href={botRootUrl || '#packages'}
                onClick={handleBotAction(botRootUrl)}
              >
                Back to Bot
              </a>
            </div>
            <div className="tasks-strip tasks-strip--hero" aria-label="Why buyers choose custom obedience">
              {VALUE_POINTS.map((point) => (
                <div key={point.label} className="tasks-chip">
                  <span className="tasks-chip__icon">
                    <TaskIcon name={point.icon} />
                  </span>
                  <span>{point.label}</span>
                </div>
              ))}
            </div>
          </div>

          <aside className="tasks-hero__aside">
            <article className="tasks-hero__private-card">
              <p className="tasks-hero__private-kicker">Private Offering</p>
              <strong>This should feel like it was prepared for you, not pulled from a generic file.</strong>
              <p>
                A softer first order, a toy-led setup, or something firmer and more obedient. You choose the mood, then
                the package gives it shape.
              </p>
              <div className="tasks-hero__private-list" aria-label="Private offering benefits">
                {HERO_PRIVATE_POINTS.map((point) => (
                  <div key={point} className="tasks-hero__private-item">
                    <span className="tasks-hero__private-dot" aria-hidden="true" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </article>
          </aside>
        </div>
      </section>

      <section className="tasks-manifesto">
        <div className="tasks-manifesto__intro">
          <p className="hero__eyebrow">Why Custom Feels Different</p>
          <h2>This should feel like it was written for you</h2>
          <p className="tasks-panel__body-copy">
            You are not buying a random dump of instructions. You are buying attention, pacing, and something shaped
            around your exact appetite.
          </p>
        </div>
        <div className="tasks-manifesto__quote">
          <strong>Not just personalised. More controlled. More intimate. More worth paying for.</strong>
        </div>
        <div className="tasks-manifesto__grid" aria-label="Why custom feels different">
          {WHY_CUSTOM_POINTS.map((point) => (
            <article key={point.title} className="tasks-manifesto__item">
              <span className="tasks-benefit__icon">
                <TaskIcon name={point.icon} />
              </span>
              <div>
                <strong>{point.title}</strong>
                <p>{point.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="tasks-panel tasks-panel--steps">
        <div className="tasks-panel__header">
          <p className="hero__eyebrow">How It Works</p>
          <h2>Simple to start. Personal from the first step.</h2>
        </div>
        <div className="tasks-stepper">
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <article key={step.title} className="tasks-stepper__item">
              <div className="tasks-stepper__topline">
                <span className="tasks-stepper__number">0{index + 1}</span>
                <span className="tasks-stepper__icon">
                  <TaskIcon name={step.icon} />
                </span>
              </div>
              <strong>{step.title}</strong>
              <p>{step.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="tasks-panel">
        <div className="tasks-panel__header">
          <p className="hero__eyebrow">Example Experiences</p>
          <h2>Choose the flavour of control you want</h2>
        </div>
        <p className="tasks-panel__body-copy">
          Every package is shaped around your submitted preferences, limits, available toys, and chosen intensity.
        </p>
        <div className="tasks-style-grid" aria-label="Examples of custom task styles">
          {SAMPLE_TASK_CARDS.map((card) => (
            <article key={card.title} className="tasks-style-card">
              <div className="tasks-style-card__header">
                <span className="tasks-style-card__icon">
                  <TaskIcon name={card.icon} />
                </span>
                <p className="tasks-style-card__eyebrow">{card.eyebrow}</p>
              </div>
              <strong>{card.title}</strong>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="tasks-section" id="packages">
        <div className="tasks-section__header tasks-section__header--stacked">
          <div className="tasks-section__copy">
            <p className="hero__eyebrow">Packages</p>
            <h2>Choose the package that fits the kind of control you want</h2>
            <p className="tasks-panel__body-copy">
              Start with a lighter first order or choose something fuller, stricter, and more paced. Pick the one that
              matches how you want this to land.
            </p>
          </div>
          {tiersQuery.data && <span className="tasks-section__count">{tiersQuery.data.total} available</span>}
        </div>

        {tiersQuery.isError && <ErrorState message={(tiersQuery.error as Error).message} />}
        {(tiersQuery.isLoading || (tiersQuery.data && tiersQuery.data.items.length > 0)) && (
          <TierCarousel items={tiersQuery.data?.items ?? []} loading={tiersQuery.isLoading} />
        )}
        {!tiersQuery.isLoading && tiersQuery.data && tiersQuery.data.items.length === 0 && (
          <EmptyState
            title="No packages available"
            message="Active custom obedience packages will appear here when they are ready."
          />
        )}
      </section>

      <section className="tasks-panel tasks-panel--light">
        <div className="tasks-panel__header">
          <p className="hero__eyebrow">What You&apos;re Buying</p>
          <h2>What makes it worth paying for</h2>
        </div>
        <p className="tasks-panel__body-copy">
          The value is not just in receiving a task. It is in receiving something that feels watched, paced, and built
          to keep its hold on you.
        </p>
        <div className="tasks-benefits" aria-label="Why custom packages feel different">
          {OFFER_POINTS.map((point) => (
            <article key={point.title} className="tasks-benefit">
              <span className="tasks-benefit__icon">
                <TaskIcon name={point.icon} />
              </span>
              <div>
                <strong>{point.title}</strong>
                <p>{point.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="tasks-panel">
        <div className="tasks-panel__header">
          <p className="hero__eyebrow">Beginner Reassurance</p>
          <h2>Easy to start, even if this is your first time</h2>
        </div>
        <div className="tasks-reassurance">
          <p className="tasks-panel__body-copy">
            You do not need a huge toy collection or advanced experience. Packages can be shaped around a simpler setup
            and a lighter pace if that suits you better.
          </p>
          <div className="tasks-strip tasks-strip--soft" aria-label="Beginner reassurance">
            {REASSURANCE_POINTS.map((point) => (
              <div key={point} className="tasks-chip tasks-chip--soft">
                <span className="tasks-chip__icon">
                  <TaskIcon name="shield" />
                </span>
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="tasks-panel tasks-panel--faq">
        <div className="tasks-panel__header">
          <p className="hero__eyebrow">FAQ</p>
          <h2>Questions before you choose your package?</h2>
        </div>
        <div className="faq-list">
          {FAQS.map((item) => (
            <details key={item.question} className="faq-card">
              <summary>
                <span className="faq-card__summary">
                  <span className="faq-card__icon">
                    <TaskIcon name={item.icon} />
                  </span>
                  <span className="faq-card__text">{item.question}</span>
                  <span className="faq-card__chevron" aria-hidden="true" />
                </span>
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="tasks-panel tasks-panel--cta">
        <div className="tasks-panel__header">
          <p className="hero__eyebrow">Ready When You Are</p>
          <h2>Ready to place your first order?</h2>
        </div>
        <p className="tasks-panel__body-copy">
          Choose your package, step into the bot, and start a custom obedience flow built around your limits, your
          toys, and the way you want to be handled.
        </p>
        <div className="tasks-hero__actions">
          <a className="tasks-button tasks-button--primary" href="#packages">
            View Packages
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
          <span>{tiersQuery.data ? `${tiersQuery.data.total} custom packages ready` : 'Custom Obedience Tasks'}</span>
          <a className="tasks-button tasks-button--primary sticky-mobile-cta__button" href="#packages">
            View Packages
          </a>
        </div>
      </div>

      {tierId && (
        <TierDetailSheet
          tier={tierDetailQuery.data}
          loading={tierDetailQuery.isLoading}
          artworkVariant={tierArtworkVariants[tierId]}
        />
      )}
    </AppShell>
  );
}
