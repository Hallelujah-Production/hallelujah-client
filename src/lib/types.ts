/**
 * Domain model for the Hallelujah Church Prayer Platform.
 *
 * These shapes intentionally mirror the future relational model
 * (churches, users, customers, prayer_types, intentions,
 *  intention_assignments, payments, receipts, notifications, audit_logs)
 * so the mock service layer can later be swapped for a NestJS API client
 * without changing component contracts.
 *
 * Every tenant-owned entity carries churchId. The frontend never *derives*
 * authorization from it - the future backend resolves the tenant from the
 * authenticated session. It exists here so mock queries can be scoped the way
 * the real queries will be.
 */

export type Role = "SUPER_ADMIN" | "CHURCH_ADMIN" | "CHURCH_STAFF";

export const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: "Platform Administrator",
  CHURCH_ADMIN: "Administrator",
  CHURCH_STAFF: "Prayer Staff",
};

/** Intention lifecycle - kept strictly separate from payment status. */
export type IntentionStatus =
  | "CREATED"
  | "PAYMENT_PENDING"
  | "PAID"
  | "ASSIGNED"
  | "PENDING_PRAYER"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentStatus = "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";

/** Cash at the counter, or any UPI app against the church's own QR. */
export type PaymentMethod = "CASH" | "UPI";

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "Cash",
  UPI: "UPI / PhonePe",
};

/** Cash never requires a transaction reference. */
export const CASHLESS_METHODS: PaymentMethod[] = ["UPI"];

export function requiresTransactionId(method: PaymentMethod): boolean {
  return method === "UPI";
}

export interface Church {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  city: string;
  state: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode: string;
  phone: string;
  email: string;
  website?: string;
  logoInitials: string;
  /** Token-driven accent so church pages feel distinct without leaving the palette. */
  accent: "navy" | "forest" | "gold";
  establishedYear: number;
  isActive: boolean;
  featured: boolean;
  serviceTimes: { label: string; time: string }[];
  createdAt: string;
  /** Present on allotted churches in a Church Admin session. */
  intentionCount?: number;
  completedCount?: number;
  pendingCount?: number;
  inProgressCount?: number;
}

export interface User {
  id: string;
  churchId: string | null; // null => platform-level (SUPER_ADMIN)
  name: string;
  username: string;
  email?: string | null;
  phone: string;
  role: Role;
  isActive: boolean;
  invitationPending?: boolean;
  avatarInitials: string;
  createdAt: string;
  lastActiveAt: string;
}

export interface Customer {
  id: string;
  churchId: string;
  name: string;
  mobile: string | null;
  email?: string;
  addressLine?: string;
  city?: string;
  notes?: string;
  createdAt: string;
}

export interface PrayerType {
  id: string;
  code: string;
  name: string;
  description: string;
  suggestedAmount: number;
  durationMinutes: number;
  icon: string;
  isActive: boolean;
}

export interface PaymentProof {
  /** Opaque handle, resolved through the service layer, never rendered as a path. */
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  /** Mock preview source (object URL in-session, or a placeholder). */
  previewUrl?: string;
  uploadedAt: string;
}

export interface Payment {
  id: string;
  churchId: string;
  intentionId: string;
  customerId: string;
  amount: number;
  method: PaymentMethod;
  provider?: string;
  transactionId?: string;
  /**
   * Mock proof reference. Never a raw filesystem path - the future backend
   * returns a signed, access-controlled URL from a private object store.
   */
  proof?: PaymentProof;
  notes?: string;
  status: PaymentStatus;
  createdAt: string;
  verifiedAt?: string;
  verifiedByUserId?: string;
  rejectedAt?: string;
  rejectedByUserId?: string;
  rejectionReason?: string;
}

export interface Receipt {
  id: string;
  churchId: string;
  reference: string; // e.g. CH-2026-000123 — separate from the intention reference
  intentionId: string;
  paymentId: string;
  customerId: string;
  issuedAt: string;
  receivedByUserId?: string;
  authorizedByUserId?: string;
}

export interface IntentionAssignment {
  staffUserId: string;
  assignedAt: string;
  assignedByUserId: string;
}

export interface Intention {
  id: string;
  churchId: string;
  reference: string; // e.g. CH-2026-000123 — separate from the official receipt number
  customerId: string;
  prayerTypeId: string;
  /** The person the prayer is offered for (may differ from the requester). */
  prayerFor: string;
  requestedBy: string;
  prayerDate: string; // ISO date (yyyy-mm-dd)
  preferredTime?: string; // HH:mm
  message?: string;
  amount: number;
  status: IntentionStatus;
  paymentId: string;
  assignment?: IntentionAssignment;
  receiptId?: string;
  startedAt?: string;
  completedAt?: string;
  completedByUserId?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  source: "PUBLIC" | "STAFF";
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | "NEW_INTENTION"
  | "NEW_ASSIGNMENT"
  | "PAYMENT_VERIFICATION"
  | "PAYMENT_VERIFIED"
  | "PAYMENT_REJECTED"
  | "RECEIPT_ISSUED"
  | "PRAYER_DUE_TODAY"
  | "UPCOMING_PRAYER"
  | "PRAYER_COMPLETED"
  | "SYSTEM";

export interface AppNotification {
  id: string;
  churchId: string | null;
  /** null => broadcast to every user in scope. */
  userId: string | null;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  churchId: string | null;
  actorUserId: string;
  actorName: string;
  action: string;
  entity: string;
  entityId: string;
  summary: string;
  ipAddress: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* Transport shapes - mirror the future REST contract                   */
/* ------------------------------------------------------------------ */

export interface Paginated<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  roleTotals?: {
    total?: number;
    admins: number;
    staff: number;
    superAdmins?: number;
  };
  churchTotals?: {
    total: number;
    active: number;
  };
  paymentStats?: {
    verifiedCount: number;
    pendingVerification: number;
    monthCollectedPaise: number;
  };
}

export interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
  from?: string;
  to?: string;
  sort?: string;
  /** Skip row hydration; only `meta.total` is used. */
  countsOnly?: boolean;
}

export interface IntentionQuery extends ListQuery {
  status?: IntentionStatus | "ALL";
  prayerTypeId?: string | "ALL";
  staffId?: string | "ALL" | "UNASSIGNED";
  paymentStatus?: PaymentStatus | "ALL";
  parishId?: string;
  progress?: "ALL" | "PENDING" | "COMPLETED";
}

export interface PaymentQuery extends ListQuery {
  method?: PaymentMethod | "ALL";
  status?: PaymentStatus | "ALL";
  minAmount?: number;
  maxAmount?: number;
}

/* ------------------------------------------------------------------ */
/* View models returned by the service layer                            */
/* ------------------------------------------------------------------ */

/** One prayer type on an intention, with its share of the offering. */
export interface IntentionPrayerType {
  id: string;
  code: string;
  name: string;
  /** This type's share of the single offering the family paid. */
  amount: number;
}

export interface IntentionView extends Intention {
  customer: Customer;
  /** The primary type — what list filters match on. */
  prayerType: PrayerType;
  /**
   * Every type this intention was offered for, primary first. Always has at
   * least one entry, so a screen can render this and never special-case the
   * single-type case.
   */
  prayerTypes: IntentionPrayerType[];
  payment: Payment;
  assignedStaff?: User;
  church: Church;
  receipt?: Receipt;
  createdByName?: string | null;
}

export interface PaymentView extends Payment {
  customer: Customer;
  intention: Intention;
  prayerType: PrayerType;
  verifiedBy?: User;
  rejectedBy?: User;
  church: Church;
}

export interface ReceiptView extends Receipt {
  church: Church;
  customer: Customer;
  intention: Intention;
  prayerType: PrayerType;
  payment: Payment;
  receivedBy?: User;
  authorizedBy?: User;
}

export interface CustomerView extends Customer {
  totalIntentions: number;
  totalPaid: number;
  lastPrayerDate?: string;
}

export interface UserView extends User {
  church?: Church;
  assignedCount: number;
  completedCount: number;
}

export interface ChurchView extends Church {
  adminName?: string;
  adminUsername?: string;
  staffCount: number;
  intentionCount: number;
  revenue: number;
}

export interface TrendPoint {
  label: string;
  value: number;
  secondary?: number;
}

export interface ChurchDashboardStats {
  todaysIntentions: number;
  pending: number;
  inProgress: number;
  completed: number;
  todaysCollection: number;
  paymentsPendingVerification: number;
  upcomingPrayers: number;
  monthRevenue: number;
  revenueTrend: TrendPoint[];
  intentionTrend: TrendPoint[];
  prayerTypeSplit: TrendPoint[];
  paymentMethodSplit: TrendPoint[];
  /** Allotted parishes with intention aggregates. From /reports/dashboard, not /auth/me. */
  parishes?: Church[];
}

export interface PlatformDashboardStats {
  totalChurches: number;
  activeChurches: number;
  totalUsers: number;
  totalAdmins: number;
  totalStaff: number;
  totalIntentions: number;
  pending: number;
  completed: number;
  totalRevenue: number;
  todaysRevenue: number;
  revenueTrend: TrendPoint[];
  intentionTrend: TrendPoint[];
  churchPerformance: TrendPoint[];
  paymentMethodSplit: TrendPoint[];
  completionSplit: TrendPoint[];
}

export interface StaffDashboardStats {
  today: number;
  pending: number;
  completed: number;
  upcoming: number;
}

export interface StaffPerformanceRow {
  staff: User;
  assigned: number;
  completed: number;
  completionRate: number;
  revenue: number;
}
