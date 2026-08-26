import { Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "./contact-form";

export function ContactCta() {
  return (
    <section id="contact" className="scroll-mt-24 border-t border-border bg-primary text-primary-foreground">
      <div className="container py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <p className="inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-accent">
              <span aria-hidden="true" className="h-px w-6 bg-accent" />
              Get in touch
            </p>
            <h2 className="mt-5 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Bring your church&apos;s prayer workflow online.
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-primary-foreground/75 text-pretty">
              Tell us about your parish and we will set up your church, create the
              administrator account and walk your team through recording their first
              intention.
            </p>

            <ul className="mt-9 space-y-4">
              <ContactLine icon={Mail} label="Email" value="hello@hallelujah.app" />
              <ContactLine icon={Phone} label="Phone" value="+91 89122 40118" />
              <ContactLine
                icon={MapPin}
                label="Office"
                value="2nd Floor, Siripuram Junction, Visakhapatnam 530003"
              />
            </ul>

            <p className="mt-9 rounded-md border border-primary-foreground/15 bg-primary-foreground/5 px-4 py-3 text-sm leading-relaxed text-primary-foreground/75">
              Church accounts are created by the Hallelujah team, not by public sign-up. That
              is deliberate: it keeps every tenant verified before a single intention is
              recorded.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 text-foreground shadow-lg sm:p-8">
            <h3 className="font-display text-lg font-semibold tracking-tight">
              Tell us about your parish
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Every field marked with an asterisk is needed before we can reply.
            </p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactLine({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <li className="flex items-start gap-3.5">
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-primary-foreground/15 bg-primary-foreground/5 text-accent"
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-[0.7rem] uppercase tracking-[0.12em] text-primary-foreground/50">
          {label}
        </span>
        <span className="block text-sm font-medium">{value}</span>
      </span>
    </li>
  );
}
