export type ApiErrorFields = Record<string, string>;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: ApiErrorFields;

  constructor(status: number, code: string, message: string, fields?: ApiErrorFields) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }

  get isUnauthorized() {
    return this.status === 401 || this.code === "UNAUTHENTICATED" || this.code === "SESSION_EXPIRED";
  }

  get isForbidden() {
    return (
      (this.status === 403 || this.code === "FORBIDDEN") &&
      this.code !== "PASSWORD_CHANGE_REQUIRED"
    );
  }

  get isPasswordChangeRequired() {
    return this.code === "PASSWORD_CHANGE_REQUIRED";
  }

  get isNotFound() {
    return this.status === 404 || this.code === "NOT_FOUND";
  }

  get isConflict() {
    return this.status === 409 || this.code === "CONFLICT" || this.code === "INVALID_STATE_TRANSITION";
  }

  get isValidation() {
    return this.status === 400 || this.code === "VALIDATION_FAILED";
  }

  get isRateLimited() {
    return this.status === 429 || this.code === "RATE_LIMITED";
  }

  get isNetwork() {
    return this.status === 0 || this.code === "NETWORK_ERROR";
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

const CODE_MESSAGES: Record<string, string> = {
  UNAUTHENTICATED: "Your session has expired. Please sign in again.",
  SESSION_EXPIRED: "Your session has expired. Please sign in again.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  FORBIDDEN: "You don’t have permission to perform this action.",
  NOT_FOUND: "The requested item could not be found.",
  CONFLICT: "This record already exists or has changed. Please refresh and try again.",
  INVALID_STATE_TRANSITION: "That action isn’t possible in the current state.",
  PASSWORD_CHANGE_REQUIRED: "You must choose a new password before continuing.",
  VALIDATION_FAILED: "Please check the highlighted fields and try again.",
  RATE_LIMITED: "Too many attempts. Please wait a moment and try again.",
  INTERNAL_ERROR: "Something went wrong. Please try again.",
  NETWORK_ERROR: "We couldn’t reach the server. Check your connection and try again.",
  FILE_TOO_LARGE: "That file is too large to upload.",
};

const ALWAYS_MAP = new Set([
  "UNAUTHENTICATED",
  "SESSION_EXPIRED",
  "INVALID_CREDENTIALS",
  "FORBIDDEN",
  "NOT_FOUND",
  "PASSWORD_CHANGE_REQUIRED",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
  "NETWORK_ERROR",
]);

const TECHNICAL =
  /axios|typeorm|postgres|postgresql|econnrefused|stack|errno|sql|internal server|validation_failed/i;

export function userMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (isApiError(error)) {
    const mapped = CODE_MESSAGES[error.code];
    if (mapped && ALWAYS_MAP.has(error.code)) {
      return mapped;
    }
    if (error.message && !TECHNICAL.test(error.message)) return error.message;
    return mapped ?? fallback;
  }
  if (error instanceof TypeError && /fetch|network|failed/i.test(error.message)) {
    return CODE_MESSAGES.NETWORK_ERROR;
  }
  if (error instanceof Error && error.message && !TECHNICAL.test(error.message)) {
    return error.message;
  }
  return fallback;
}

export function fieldErrors(error: unknown): ApiErrorFields | undefined {
  return isApiError(error) ? error.fields : undefined;
}
