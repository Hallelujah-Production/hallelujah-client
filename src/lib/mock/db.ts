import "server-only";

import { buildDataset, type MockDataset } from "./seed";

/**
 * In-memory mock store.
 *
 * This stands in for PostgreSQL during the frontend phase. It is deliberately
 * the *only* module that owns mutable state: every read and write goes through
 * the service layer in `lib/services`, so replacing this file with a NestJS
 * API client is a self-contained change.
 *
 * The store is cached on globalThis so Next.js hot reloads in development do
 * not discard mock mutations mid-session.
 */

const STORE_KEY = Symbol.for("gundala.mock.store");

type GlobalWithStore = typeof globalThis & {
  [STORE_KEY]?: MockDataset;
};

const globalStore = globalThis as GlobalWithStore;

export function db(): MockDataset {
  if (!globalStore[STORE_KEY]) {
    globalStore[STORE_KEY] = buildDataset();
  }
  return globalStore[STORE_KEY]!;
}

/** Resets the dataset. Used only by mock tooling, never by UI code. */
export function resetDb(): void {
  globalStore[STORE_KEY] = buildDataset();
}

/**
 * Simulates network latency so loading states, skeletons and suspense
 * boundaries are exercised the way they will be against a real API.
 */
export async function withLatency<T>(value: T, ms = 0): Promise<T> {
  if (ms > 0) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
  return value;
}

export function nextReceiptSequence(): number {
  const store = db();
  store.receiptCounter += 1;
  return store.receiptCounter;
}
