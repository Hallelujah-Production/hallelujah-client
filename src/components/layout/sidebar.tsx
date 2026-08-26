"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ICONS } from "./icons";
import type { NavItem, NavSection } from "./nav-config";
import { BrandMark } from "./church-mark";

export interface WorkspaceIdentity {
  title: string;
  subtitle: string;
  initials: string;
  accent: "navy" | "forest" | "gold";
  isPlatform: boolean;
}

export interface BadgeCounts {
  notifications: number;
  paymentsPending: number;
}

function isActive(pathname: string, item: NavItem): boolean {
  const href = item.href.split("?")[0];
  if (pathname === href) return true;
  if (item.match?.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return true;
  }
  return false;
}

function NavLink({
  item,
  badges,
  onNavigate,
}: {
  item: NavItem;
  badges: BadgeCounts;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, item);
  const Icon = NAV_ICONS[item.icon];
  const count = item.badge ? badges[item.badge] : 0;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon
        className={cn(
          "h-[1.05rem] w-[1.05rem] shrink-0",
          active
            ? "text-primary-foreground"
            : "text-muted-foreground group-hover:text-foreground",
        )}
        aria-hidden="true"
      />
      <span className="truncate">{item.label}</span>
      {count > 0 ? (
        <span
          className={cn(
            "ml-auto min-w-[1.35rem] rounded-full px-1.5 py-0.5 text-center text-[0.65rem] font-semibold tabular-nums",
            active
              ? "bg-primary-foreground/20 text-primary-foreground"
              : "bg-accent text-accent-foreground",
          )}
        >
          {count > 99 ? "99+" : count}
          <span className="sr-only"> unread</span>
        </span>
      ) : null}
    </Link>
  );
}

function NavSections({
  sections,
  badges,
  onNavigate,
}: {
  sections: NavSection[];
  badges: BadgeCounts;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Main" className="space-y-6">
      {sections.map((section, index) => (
        <div key={section.label ?? index} className="space-y-1">
          {section.label ? (
            <p className="px-3 pb-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
              {section.label}
            </p>
          ) : null}
          {section.items.map((item) => (
            <NavLink key={item.href} item={item} badges={badges} onNavigate={onNavigate} />
          ))}
        </div>
      ))}
    </nav>
  );
}

export function Sidebar({
  sections,
  badges,
}: {
  sections: NavSection[];
  identity: WorkspaceIdentity;
  badges: BadgeCounts;
}) {
  return (
    <aside
      data-app-sidebar
      data-print="hide"
      className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card lg:flex"
    >
      <div className="flex h-[5.5rem] shrink-0 items-center border-b border-border px-5">
        <Link href="/" className="rounded" aria-label="Hallelujah home">
          <BrandMark size="nav" />
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-6">
        <NavSections sections={sections} badges={badges} />
      </div>
      <div className="border-t border-border px-5 py-3">
        <p className="text-[0.65rem] leading-relaxed text-muted-foreground">
          Payments are recorded manually. No online payment gateway is used.
        </p>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile                                                              */
/* ------------------------------------------------------------------ */

export function MobileDrawer({
  sections,
  badges,
}: {
  sections: NavSection[];
  identity: WorkspaceIdentity;
  badges: BadgeCounts;
}) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const pathname = usePathname();
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (mq.matches) setOpen(false);
    };
    mq.addEventListener("change", closeOnDesktop);
    return () => mq.removeEventListener("change", closeOnDesktop);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const focus = window.requestAnimationFrame(() => panelRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(focus);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const drawer =
    open ? (
      <div className="fixed inset-0 z-[80] lg:hidden">
        <div
          className="absolute inset-0 bg-primary/50 animate-fade-in"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          tabIndex={-1}
          className="absolute inset-y-0 left-0 flex h-dvh w-[min(20rem,88vw)] flex-col bg-card pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] shadow-lg outline-none animate-slide-in-left"
        >
          <div className="flex h-[4.5rem] shrink-0 items-center justify-between gap-2 border-b border-border px-4">
            <BrandMark size="md" className="min-w-0" />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close navigation menu"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              suppressHydrationWarning
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-8">
            <NavSections
              sections={sections}
              badges={badges}
              onNavigate={() => setOpen(false)}
            />
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-input bg-card text-foreground transition-colors hover:bg-muted lg:hidden"
        suppressHydrationWarning
      >
        <svg viewBox="0 0 20 20" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round" />
        </svg>
      </button>
      {mounted && drawer ? createPortal(drawer, document.body) : null}
    </>
  );
}

export function MobileTabBar({
  items,
  badges,
}: {
  items: NavItem[];
  badges: BadgeCounts;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Quick navigation"
      data-print="hide"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:hidden"
    >
      <ul className="grid h-14 grid-cols-4">
        {items.map((item) => {
          const active = isActive(pathname, item);
          const Icon = NAV_ICONS[item.icon];
          const count = item.badge ? badges[item.badge] : 0;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-full min-h-11 flex-col items-center justify-center gap-0.5 px-1 text-[0.65rem] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {count > 0 ? (
                    <span className="absolute -right-2 -top-1 min-w-[1.05rem] rounded-full bg-accent px-1 text-[0.6rem] font-semibold leading-4 text-accent-foreground">
                      {count > 9 ? "9+" : count}
                    </span>
                  ) : null}
                </span>
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
