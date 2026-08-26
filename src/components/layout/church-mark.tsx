import Image from "next/image";
import { PLATFORM_LOGO, PLATFORM_LOGO_HEIGHT, PLATFORM_LOGO_WIDTH, PLATFORM_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

const ACCENTS = {
  navy: "bg-primary text-primary-foreground",
  forest: "bg-secondary text-secondary-foreground",
  gold: "bg-accent text-accent-foreground",
} as const;

/**
 * Stand-in for a church logo. Real tenants upload their own crest; until then
 * the initials on the tenant's accent give each church a recognisable mark.
 */
export function ChurchMark({
  initials,
  accent = "navy",
  size = "md",
  className,
}: {
  initials: string;
  accent?: "navy" | "forest" | "gold";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-md font-display font-semibold tracking-tight",
        ACCENTS[accent],
        size === "xs" && "h-7 w-7 text-[0.65rem]",
        size === "sm" && "h-9 w-9 text-xs",
        size === "md" && "h-11 w-11 text-sm",
        size === "lg" && "h-14 w-14 rounded-lg text-base",
        size === "xl" && "h-20 w-20 rounded-lg text-2xl",
        className,
      )}
    >
      {initials}
    </span>
  );
}

const LOGO_BOX: Record<"sm" | "md" | "nav" | "lg" | "xl", { className: string; px: number }> = {
  sm: { className: "h-10 w-10", px: 40 },
  md: { className: "h-12 w-12", px: 48 },
  nav: { className: "h-16 w-16", px: 64 },
  lg: { className: "h-24 w-24", px: 96 },
  xl: { className: "h-44 w-44", px: 176 },
};

/** Platform crest (`church logo2.png`) plus the Hallelujah name. */
export function BrandMark({
  className,
  tone = "dark",
  showName = true,
  size = "md",
}: {
  className?: string;
  tone?: "dark" | "light";
  showName?: boolean;
  size?: "sm" | "md" | "nav" | "lg" | "xl";
}) {
  const box = LOGO_BOX[size];

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-3", size === "xl" && "flex-col items-start gap-4", className)}>
      <Image
        src={PLATFORM_LOGO}
        alt={showName ? "" : PLATFORM_NAME}
        width={PLATFORM_LOGO_WIDTH}
        height={PLATFORM_LOGO_HEIGHT}
        sizes={`${box.px * 2}px`}
        quality={100}
        unoptimized
        priority
        className={cn("shrink-0 object-contain", box.className)}
      />
      {showName ? (
        <span className="flex min-w-0 flex-col overflow-hidden leading-none">
          <span
            className={cn(
              "truncate font-normal leading-none",
              tone === "light" ? "text-primary-foreground" : "text-primary",
              size === "sm" && "text-[1.45rem]",
              size === "md" && "text-[1.9rem]",
              size === "nav" && "text-[2.15rem]",
              size === "lg" && "text-[2.4rem]",
              size === "xl" && "text-[2.75rem]",
            )}
            style={{ fontFamily: "var(--font-script), cursive" }}
          >
            {PLATFORM_NAME}
          </span>
        </span>
      ) : null}
    </span>
  );
}
