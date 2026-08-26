import type { FlashToast } from "@/lib/feedback/flash";

export type AuthOverlayMode = "signin" | "signout";

export type AuthOverlayState = {
  mode: AuthOverlayMode | null;
  destination: string | null;
  toast: FlashToast | null;
};

const EMPTY: AuthOverlayState = { mode: null, destination: null, toast: null };

let snapshot: AuthOverlayState = EMPTY;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

/**
 * Root-level sign-in/sign-out overlay. Lives outside /login so it survives
 * the route-group swap into (app) and covers the layout wait (no white flash).
 * This is the sign-in overlay, not a second "opening workspace" page.
 */
export const authOverlay = {
  subscribe(onStoreChange: () => void): () => void {
    listeners.add(onStoreChange);
    return () => {
      listeners.delete(onStoreChange);
    };
  },
  getSnapshot(): AuthOverlayState {
    return snapshot;
  },
  begin(mode: AuthOverlayMode): void {
    snapshot = { ...snapshot, mode };
    emit();
  },
  commit(destination: string, toast: FlashToast): void {
    snapshot = {
      mode: snapshot.mode ?? (destination === "/login" ? "signout" : "signin"),
      destination,
      toast,
    };
    emit();
  },
  abort(): void {
    if (snapshot === EMPTY) return;
    snapshot = EMPTY;
    emit();
  },
  consumeArrival(pathname: string): FlashToast | null {
    if (!snapshot.mode || !snapshot.destination) return null;
    const dest = snapshot.destination;
    const arrived = pathname === dest || pathname.startsWith(`${dest}/`);
    if (!arrived) return null;
    const toast = snapshot.toast;
    snapshot = EMPTY;
    emit();
    return toast;
  },
};
