import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ClipboardCheck, FileText } from "lucide-react";
import { getChurchBySlug } from "@/lib/services";
import { EmptyState } from "@/components/ui/states";
import { first } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Prayer intention submitted",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PrayerSuccessPage({ params, searchParams }: PageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const church = await getChurchBySlug(slug);
  if (!church) notFound();

  const reference = first(query.ref);
  if (!reference) {
    return (
      <div className="container py-16">
        <EmptyState
          title="We could not find that intention."
          description="The reference may be incomplete. Please check the number you were given, or call the parish office."
          action={{ label: `Back to ${church.name}`, href: `/church/${church.slug}` }}
        />
      </div>
    );
  }

  return (
    <div className="border-t border-border bg-muted/30">
      <div className="container py-10 lg:py-14">
        <div className="mx-auto max-w-[52rem]">
          <div className="rounded-lg border border-success/25 bg-card p-6 shadow-sm sm:p-8">
            <div className="flex items-start gap-4">
              <span
                aria-hidden="true"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-success-muted text-success"
              >
                <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                  Prayer intention submitted
                </h1>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {church.name} has received your intention. Keep this reference — it is not
                  the official receipt.
                </p>
              </div>
            </div>

            <ol className="mt-7 grid gap-3 sm:grid-cols-3">
              <Step icon={ClipboardCheck} title="Prayer intention submitted" done />
              <Step icon={FileText} title="Parish office records payment" />
              <Step icon={CheckCircle2} title="Official receipt after verification" />
            </ol>

            <dl className="mt-7 grid gap-4 rounded-md border border-border bg-muted/40 p-5 sm:grid-cols-2">
              <div>
                <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Intention reference
                </dt>
                <dd className="mt-1 font-display text-lg font-bold tabular-nums text-foreground">
                  {reference}
                </dd>
              </div>
              <div>
                <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Official receipt
                </dt>
                <dd className="mt-1 text-sm text-muted-foreground">
                  Issued after a Church Admin verifies the offering. Lookup needs the receipt
                  number and the mobile number used on this intention.
                </dd>
              </div>
            </dl>

            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              The parish office will record how the offering was received (Cash or UPI /
              PhonePe) and verify it against the counter register or the bank statement.
              Only then is the official receipt generated — it cannot be edited afterwards.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/church/${church.slug}`}
                className="inline-flex h-12 items-center rounded-md border border-input bg-card px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Back to {church.name}
              </Link>
              <Link
                href={`/church/${church.slug}/prayer`}
                className="inline-flex h-12 items-center rounded-md px-5 text-sm font-medium text-primary transition-colors hover:bg-muted"
              >
                Submit another intention
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({
  icon: Icon,
  title,
  done,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  done?: boolean;
}) {
  return (
    <li className="flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3">
      <span
        aria-hidden="true"
        className={
          done
            ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success-muted text-success"
            : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
        }
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="text-sm font-medium text-foreground">{title}</span>
    </li>
  );
}
