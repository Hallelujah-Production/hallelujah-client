export const USERNAME_PATTERN = /^[a-z][a-z0-9._-]{2,31}$/;

export const USERNAME_MESSAGE =
  "Use 3–32 characters. Start with a letter. Letters, numbers, dots, hyphens, and underscores only.";

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidUsername(value: string): boolean {
  return USERNAME_PATTERN.test(normalizeUsername(value));
}
