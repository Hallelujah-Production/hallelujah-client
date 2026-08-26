import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function AppNotFound() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <span
        aria-hidden="true"
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground"
      >
        <FileQuestion className="h-7 w-7" aria-hidden="true" />
      </span>
      <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight text-foreground">
        We could not find that record.
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        It may have been removed, or it may belong to another church. Records are scoped to
        the church you are signed in to.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Back to dashboard
        </Link>
        <Link
          href="/intentions"
          className="inline-flex h-10 items-center rounded-md border border-input bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          All intentions
        </Link>
      </div>
    </div>
  );
}
