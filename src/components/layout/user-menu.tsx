"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";
import { flashToast } from "@/lib/feedback/flash";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

const PROFILE_HREF: Record<Role, string> = {
  SUPER_ADMIN: "/super-admin/settings",
  CHURCH_ADMIN: "/settings",
  CHURCH_STAFF: "/profile",
};

const initial = { ok: false };

export function UserMenu({
  name,
  email,
  initials,
  roleLabel,
  role,
}: {
  name: string;
  email: string;
  initials: string;
  roleLabel: string;
  role: Role;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [state, formAction, pending] = useActionState(async () => signOutAction(), initial);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const menuId = React.useId();

  React.useEffect(() => {
    if (pending) setOpen(false);
  }, [pending]);

  React.useEffect(() => {
    if (!state.ok) return;
    flashToast({
      tone: "info",
      title: "Signed out",
      message: "You have been signed out.",
    });
    router.replace("/login");
  }, [state.ok, router]);

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className="flex items-center gap-2.5 rounded-md p-1 pr-2 transition-colors hover:bg-muted"
        suppressHydrationWarning
      >
        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
        >
          {initials}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block max-w-[10rem] truncate text-sm font-medium leading-tight text-foreground">
            {name}
          </span>
          <span className="block text-[0.7rem] leading-tight text-muted-foreground">
            {roleLabel}
          </span>
        </span>
        <svg
          viewBox="0 0 20 20"
          className={cn("hidden h-4 w-4 text-muted-foreground transition-transform sm:block", open && "rotate-180")}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
        >
          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-40 mt-2 w-[min(15rem,calc(100vw-1.5rem))] overflow-hidden rounded-lg border border-border bg-card shadow-lg animate-scale-in"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-semibold text-foreground">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
            <p className="mt-1.5 inline-flex rounded-full bg-primary-muted px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-primary">
              {roleLabel}
            </p>
          </div>
          <div className="p-1.5">
            <Link
              href={PROFILE_HREF[role]}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block rounded px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
            >
              {role === "CHURCH_STAFF" ? "My profile" : "Workspace settings"}
            </Link>
            <Link
              href="/notifications"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block rounded px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
            >
              Notifications
            </Link>
            <Link
              href="/"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block rounded px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
            >
              Public site
            </Link>
          </div>
          <form action={formAction} className="border-t border-border p-1.5">
            <button
              type="submit"
              role="menuitem"
              disabled={pending}
              className="w-full rounded px-3 py-2 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive-muted disabled:opacity-60"
              suppressHydrationWarning
            >
              {pending ? "Signing out…" : "Sign out"}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
