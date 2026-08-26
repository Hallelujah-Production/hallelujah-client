import {
  BookOpen,
  Briefcase,
  Cake,
  Compass,
  Flame,
  Gem,
  Heart,
  HeartPulse,
  Sparkles,
  Star,
  Sun,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  cake: Cake,
  rings: Gem,
  heart: Heart,
  health: HeartPulse,
  sun: Sun,
  candle: Flame,
  family: Users,
  star: Star,
  book: BookOpen,
  briefcase: Briefcase,
  compass: Compass,
};

/** Tones cycle through the brand triad so the service grid stays cohesive. */
const TONES = [
  "bg-primary-muted text-primary",
  "bg-secondary-muted text-secondary",
  "bg-accent-muted text-accent",
] as const;

export function PrayerIcon({
  icon,
  index = 0,
  size = "md",
  className,
}: {
  icon: string;
  index?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const Icon = ICONS[icon] ?? Sparkles;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md",
        TONES[index % TONES.length],
        size === "sm" && "h-8 w-8",
        size === "md" && "h-11 w-11",
        size === "lg" && "h-14 w-14",
        className,
      )}
    >
      <Icon
        className={cn(
          size === "sm" && "h-4 w-4",
          size === "md" && "h-5 w-5",
          size === "lg" && "h-6 w-6",
        )} aria-hidden="true" />
    </span>
  );
}
