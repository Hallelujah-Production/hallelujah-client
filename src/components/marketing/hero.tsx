import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Hero.
 *
 * The visual is drawn rather than photographed: an arched stained-glass panel
 * in CSS/SVG. It carries the spiritual register without shipping a hero image,
 * and it never blocks the Largest Contentful Paint.
 */
export function Hero({
  churchCount,
  intentionCount,
}: {
  churchCount: number;
  intentionCount: number;
}) {
  return (
    <section className="relative overflow-hidden">
      <div className="aurora absolute inset-0 -z-10" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent"
      />

      <div className="container grid items-center gap-14 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div className="max-w-xl animate-fade-up">
          <p className="eyebrow">
            <span aria-hidden="true" className="h-px w-6 bg-accent" />
            Prayer intentions, kept faithfully
          </p>

          <h1 className="mt-6 font-display text-[2.15rem] font-semibold leading-[1.05] tracking-tight text-primary sm:text-6xl lg:text-[4.25rem]">
            <span className="block">Prayer.</span>
            <span className="block text-secondary">Faith.</span>
            <span className="block">
              Community.
              <span className="text-accent">.</span>
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground text-pretty">
            A simple and trusted way to submit prayer intentions and connect them with
            your church community.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="#find-your-church"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-6 text-[0.9375rem] font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Find Your Church
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex h-12 items-center justify-center rounded-md border border-input bg-card px-6 text-[0.9375rem] font-medium text-foreground transition-colors hover:bg-muted"
            >
              How It Works
            </Link>
          </div>

          <dl className="mt-12 grid max-w-md grid-cols-3 gap-3 border-t border-border pt-7 sm:gap-6">
            <div>
              <dt className="text-[0.65rem] leading-snug text-muted-foreground">Churches</dt>
              <dd className="font-display text-2xl font-semibold tabular-nums text-foreground">
                {churchCount}
              </dd>
            </div>
            <div>
              <dt className="text-[0.65rem] leading-snug text-muted-foreground">Intentions recorded</dt>
              <dd className="font-display text-2xl font-semibold tabular-nums text-foreground">
                {intentionCount.toLocaleString("en-IN")}
              </dd>
            </div>
            <div>
              <dt className="text-[0.65rem] leading-snug text-muted-foreground">Payment gateways</dt>
              <dd className="font-display text-2xl font-semibold text-foreground">None</dd>
            </div>
          </dl>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <StainedGlassPanel />
          <IntentionPreviewCard />
        </div>
      </div>
    </section>
  );
}

function StainedGlassPanel() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto aspect-[4/5] w-full max-w-[24rem] animate-fade-in rounded-t-full border border-border/70 bg-card shadow-lg lg:max-w-[26rem]"
      style={{ animationDelay: "120ms" }}
    >
      <svg viewBox="0 0 320 400" className="h-full w-full" role="presentation">
        <defs>
          <linearGradient id="pane-navy" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(218 54% 26%)" />
            <stop offset="100%" stopColor="hsl(218 54% 16%)" />
          </linearGradient>
          <linearGradient id="pane-forest" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(152 34% 30%)" />
            <stop offset="100%" stopColor="hsl(152 34% 20%)" />
          </linearGradient>
          <linearGradient id="pane-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(38 70% 58%)" />
            <stop offset="100%" stopColor="hsl(38 62% 44%)" />
          </linearGradient>
          <clipPath id="arch">
            <path d="M20 400V160C20 82 82 20 160 20s140 62 140 140v198z" />
          </clipPath>
        </defs>

        <g clipPath="url(#arch)">
          <rect x="0" y="0" width="320" height="400" fill="hsl(40 33% 97%)" />
          <rect x="20" y="20" width="140" height="200" fill="url(#pane-navy)" opacity="0.94" />
          <rect x="160" y="20" width="140" height="200" fill="url(#pane-forest)" opacity="0.9" />
          <rect x="20" y="220" width="90" height="180" fill="url(#pane-gold)" opacity="0.85" />
          <rect x="110" y="220" width="100" height="180" fill="url(#pane-navy)" opacity="0.8" />
          <rect x="210" y="220" width="90" height="180" fill="url(#pane-forest)" opacity="0.75" />
          <circle cx="160" cy="150" r="54" fill="hsl(40 33% 97%)" opacity="0.94" />
          <path
            d="M160 116v70M136 140h48"
            stroke="hsl(38 62% 46%)"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <g stroke="hsl(40 33% 97%)" strokeWidth="3" opacity="0.6">
            <path d="M20 220h280M160 20v400M110 220v180M210 220v180" />
          </g>
        </g>

        <path
          d="M20 400V160C20 82 82 20 160 20s140 62 140 140v240"
          fill="none"
          stroke="hsl(218 18% 84%)"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}

function IntentionPreviewCard() {
  return (
    <div
      className="absolute -bottom-6 left-1/2 w-[19rem] max-w-[88%] -translate-x-1/2 animate-fade-up rounded-lg border border-border bg-card p-4 shadow-lg lg:-left-6 lg:bottom-10 lg:translate-x-0"
      style={{ animationDelay: "260ms" }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Official receipt
        </p>
        <span className="inline-flex items-center gap-1 rounded-full border border-success/20 bg-success-muted px-2 py-0.5 text-[0.65rem] font-semibold text-success">
          <span aria-hidden="true">✓</span> Verified
        </span>
      </div>
      <p className="mt-2 font-display text-lg font-semibold tracking-tight text-foreground">
        CH-2026-000123
      </p>
      <dl className="mt-3 space-y-1.5 border-t border-dashed border-border pt-3 text-xs">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Prayer</dt>
          <dd className="font-medium text-foreground">Birthday Prayer</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">For</dt>
          <dd className="font-medium text-foreground">Anjali</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Offering</dt>
          <dd className="font-medium text-foreground">₹500 · PhonePe</dd>
        </div>
      </dl>
    </div>
  );
}
