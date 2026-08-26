import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Step {
  id: string;
  label: string;
  hint?: string;
}

export function FormStepper({
  steps,
  current,
  className,
}: {
  steps: Step[];
  current: number;
  className?: string;
}) {
  return (
    <nav aria-label="Progress" className={className}>
      <p className="sr-only">
        Step {current + 1} of {steps.length}: {steps[current]?.label}
      </p>
      <ol className="flex items-center gap-2 sm:gap-3">
        {steps.map((step, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                  done && "border-secondary bg-secondary text-secondary-foreground",
                  active && "border-primary bg-primary text-primary-foreground",
                  !done && !active && "border-border bg-card text-muted-foreground",
                )}
              >
                {done ? <Check className="h-4 w-4" aria-hidden="true" /> : String(index + 1).padStart(2, "0")}
              </span>
              <span className="hidden min-w-0 sm:block">
                <span
                  className={cn(
                    "block truncate text-sm font-medium",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
                {step.hint ? (
                  <span className="block truncate text-[0.7rem] text-muted-foreground">
                    {step.hint}
                  </span>
                ) : null}
              </span>
              {index < steps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-px flex-1 transition-colors",
                    done ? "bg-secondary" : "bg-border",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-sm font-medium text-foreground sm:hidden">
        Step {current + 1} of {steps.length} — {steps[current]?.label}
      </p>
    </nav>
  );
}
