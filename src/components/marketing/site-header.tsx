"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/layout/church-mark";

const LINKS = [
  { label: "Churches", href: "/churches" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Prayer services", href: "/#services" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      data-print="hide"
      className={cn(
        "sticky top-0 z-40 w-full pt-[env(safe-area-inset-top)] transition-colors duration-300",
        scrolled || open
          ? "border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75"
          : "border-b border-transparent",
      )}
    >
      <div className="container flex h-16 items-center gap-2 sm:h-20 sm:gap-6">
        <Link href="/" className="min-w-0 rounded" aria-label="Hallelujah home">
          <BrandMark size="md" className="lg:hidden" />
          <BrandMark size="nav" className="hidden lg:inline-flex" />
        </Link>

        <nav aria-label="Primary" className="ml-auto hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Link
            href="/login"
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted sm:block"
          >
            Church login
          </Link>
          <Link
            href="/churches"
            className="hidden h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 sm:inline-flex"
          >
            Find your church
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="public-mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-input bg-card text-foreground lg:hidden"
            suppressHydrationWarning
          >
            <svg viewBox="0 0 20 20" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              {open ? (
                <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
              ) : (
                <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open ? (
        <div id="public-mobile-nav" className="border-t border-border bg-background lg:hidden">
          <nav aria-label="Primary" className="container space-y-1 py-4">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-md px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-2">
              <Link
                href="/login"
                className="flex-1 rounded-md border border-input px-3 py-2.5 text-center text-sm font-medium text-foreground"
              >
                Church login
              </Link>
              <Link
                href="/churches"
                className="flex-1 rounded-md bg-primary px-3 py-2.5 text-center text-sm font-medium text-primary-foreground"
              >
                Find your church
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
