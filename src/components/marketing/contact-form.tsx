"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";

type Errors = Partial<Record<"name" | "church" | "email" | "phone" | "message", string>>;

/**
 * Contact form UI.
 *
 * Nothing is transmitted in this phase — the submit handler validates, shows
 * the pending and success states, and stops there. When the API lands this
 * becomes a server action; the markup and validation copy stay as they are.
 */
export function ContactForm({ compact }: { compact?: boolean }) {
  const [errors, setErrors] = React.useState<Errors>({});
  const [pending, setPending] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  if (sent) {
    return (
      <div className="rounded-lg border border-success/25 bg-success-muted p-8 text-center">
        <span
          aria-hidden="true"
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success"
        >
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
        </span>
        <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
          Thank you — your message is on its way
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Someone from the Hallelujah team will contact your parish within two working days
          to walk through how the prayer register works.
        </p>
        <Button variant="outline" size="sm" className="mt-5" onClick={() => setSent(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next: Errors = {};

    const name = String(data.get("name") ?? "").trim();
    const church = String(data.get("church") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    if (!name) next.name = "Enter your name so we know who to reply to.";
    if (!church) next.church = "Tell us which parish you are writing on behalf of.";
    if (!email) next.email = "Enter an email address we can reply to.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "That email address does not look complete — check for a typo.";
    }
    if (phone && !/^[0-9+\s-]{8,15}$/.test(phone)) {
      next.phone = "Enter a phone number using digits, spaces or a leading +.";
    }
    if (!message) next.message = "Tell us a little about what your parish needs.";
    else if (message.length < 20) {
      next.message = "A sentence or two helps us prepare — please add a little more.";
    }

    setErrors(next);
    if (Object.keys(next).length) return;

    setPending(true);
    // Mock round-trip so the pending state is real to the eye.
    setTimeout(() => {
      setPending(false);
      setSent(true);
    }, 700);
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className={compact ? "space-y-5" : "grid gap-5 sm:grid-cols-2"}>
        <Field id="contact-name" label="Your name" required error={errors.name}>
          {(aria) => <Input {...aria} name="name" autoComplete="name" placeholder="Fr. George Mathew" />}
        </Field>
        <Field id="contact-church" label="Church name" required error={errors.church}>
          {(aria) => <Input {...aria} name="church" placeholder="St. Mary's Church, Visakhapatnam" />}
        </Field>
      </div>

      <div className={compact ? "space-y-5" : "grid gap-5 sm:grid-cols-2"}>
        <Field id="contact-email" label="Email address" required error={errors.email}>
          {(aria) => (
            <Input {...aria} name="email" type="email" autoComplete="email" placeholder="office@yourchurch.org" />
          )}
        </Field>
        <Field
          id="contact-phone"
          label="Phone number"
          error={errors.phone}
          description="We will only call if email does not reach you."
        >
          {(aria) => <Input {...aria} name="phone" type="tel" autoComplete="tel" placeholder="+91 98765 43210" />}
        </Field>
      </div>

      <Field
        id="contact-message"
        label="How can we help?"
        required
        error={errors.message}
        description="Roughly how many intentions does your parish record in a month, and who would manage them?"
      >
        {(aria) => (
          <Textarea
            {...aria}
            name="message"
            rows={5}
            placeholder="We record about 60 intentions a month in a register. Two sisters look after the prayer schedule…"
          />
        )}
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Sending…" : "Contact Us"}
        </Button>
        <p className="text-xs text-muted-foreground">
          We reply within two working days. No payment details are ever requested.
        </p>
      </div>
    </form>
  );
}
