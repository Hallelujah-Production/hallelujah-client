/** Integer paise → whole rupees for the existing `formatCurrency` helper. */
export function paiseToRupees(paise: number | string | null | undefined): number {
  const n = typeof paise === "string" ? Number(paise) : (paise ?? 0);
  if (!Number.isFinite(n)) return 0;
  return Math.trunc(n / 100);
}

export function rupeesToPaise(rupees: number | string | null | undefined): number | undefined {
  if (rupees === null || rupees === undefined || rupees === "") return undefined;
  const n = typeof rupees === "string" ? Number(rupees) : rupees;
  if (!Number.isFinite(n)) return undefined;
  return Math.trunc(n) * 100;
}

export function toPaiseNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) ? n : 0;
}
