import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant =
  | "primary"
  | "secondary"
  | "accent"
  | "outline"
  | "ghost"
  | "subtle"
  | "destructive"
  | "success";
type Size = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary shadow-sm",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/90 active:bg-secondary shadow-sm",
  accent:
    "bg-accent text-accent-foreground hover:bg-accent/90 active:bg-accent shadow-sm",
  outline:
    "border border-input bg-card text-foreground hover:bg-muted hover:border-border",
  ghost: "text-foreground hover:bg-muted",
  subtle: "bg-muted text-foreground hover:bg-muted/70",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
  success: "bg-success text-success-foreground hover:bg-success/90 shadow-sm",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[0.8125rem] gap-1.5 rounded",
  md: "h-10 px-4 text-sm gap-2 rounded-md",
  lg: "h-12 px-6 text-[0.9375rem] gap-2.5 rounded-md",
  icon: "h-9 w-9 rounded-md",
};

const BASE =
  "inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&_svg]:shrink-0";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      {...props}
      suppressHydrationWarning
    />
  ),
);
Button.displayName = "Button";

export interface ButtonLinkProps extends React.ComponentPropsWithoutRef<typeof Link> {
  variant?: Variant;
  size?: Size;
}

/** Anchor styled as a button — used for navigation so semantics stay correct. */
export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonLinkProps) {
  return <Link className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...props} />;
}

export { VARIANTS as buttonVariants, SIZES as buttonSizes, BASE as buttonBase };
