import {
  addDays,
  initials,
  seededRandom,
  slugify,
  TODAY,
  MOCK_NOW,
} from "@/lib/utils";
import type {
  AppNotification,
  AuditLog,
  Church,
  Customer,
  Intention,
  IntentionStatus,
  Payment,
  PaymentMethod,
  PaymentStatus,
  PrayerType,
  Receipt,
  User,
} from "@/lib/types";
import { CHURCH_SEED } from "./churches";
import { PRAYER_TYPE_SEED } from "./prayer-types";
import {
  ADMIN_NAMES,
  CITY_AREAS,
  CUSTOMER_FIRST,
  CUSTOMER_LAST,
  MESSAGES,
  PRAYER_FOR_NAMES,
  STAFF_NAMES,
} from "./people";

export interface MockDataset {
  churches: Church[];
  prayerTypes: PrayerType[];
  users: User[];
  customers: Customer[];
  intentions: Intention[];
  payments: Payment[];
  receipts: Receipt[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];
  receiptCounter: number;
}

const METHOD_WEIGHTS: PaymentMethod[] = ["CASH", "CASH", "CASH", "UPI", "UPI"];

const PROVIDERS: Partial<Record<PaymentMethod, string>> = {
  UPI: "PhonePe",
};

function pick<T>(rng: () => number, list: T[]): T {
  return list[Math.floor(rng() * list.length) % list.length];
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, "0");
}

/**
 * Receipt references are the customer-facing paper trail and must never
 * collide. Format: CH-<year>-<6 digit sequence>.
 */
export function formatReceiptReference(sequence: number, year = 2026): string {
  return `CH-${year}-${pad(sequence, 6)}`;
}

function timeAt(dateISO: string, hour: number, minute: number): string {
  return `${dateISO}T${pad(hour, 2)}:${pad(minute, 2)}:00.000Z`;
}

/**
 * Builds the entire mock dataset deterministically. Called once per process;
 * the result is held in the in-memory store (see ./db.ts) so mock mutations
 * during a session behave like a real backend within that session.
 */
export function buildDataset(): MockDataset {
  const rng = seededRandom(20260820);

  const churches = CHURCH_SEED.map((c) => ({ ...c }));
  const prayerTypes = PRAYER_TYPE_SEED.map((p) => ({ ...p }));

  const users: User[] = [
    {
      id: "usr_platform_owner",
      churchId: null,
      name: "Elizabeth Mathai",
      username: "elizabeth",
      email: "elizabeth@gundala.com",
      phone: "+91 98490 11002",
      role: "SUPER_ADMIN",
      isActive: true,
      avatarInitials: "EM",
      createdAt: "2025-10-01T05:00:00.000Z",
      lastActiveAt: MOCK_NOW,
    },
    {
      id: "usr_platform_ops",
      churchId: null,
      name: "Daniel Vergis",
      username: "daniel",
      email: "daniel@gundala.com",
      phone: "+91 98490 11045",
      role: "SUPER_ADMIN",
      isActive: true,
      avatarInitials: "DV",
      createdAt: "2025-10-14T05:00:00.000Z",
      lastActiveAt: "2026-08-19T14:10:00.000Z",
    },
  ];

  const customers: Customer[] = [];
  const intentions: Intention[] = [];
  const payments: Payment[] = [];
  const receipts: Receipt[] = [];
  const notifications: AppNotification[] = [];
  const auditLogs: AuditLog[] = [];

  let receiptCounter = 0;
  let notificationSeq = 0;
  let auditSeq = 0;

  churches.forEach((church, ci) => {
    /* ---------------- staff ---------------- */
    const adminName = ADMIN_NAMES[ci % ADMIN_NAMES.length];
    const admin: User = {
      id: `usr_${church.slug}_admin`,
      churchId: church.id,
      name: adminName,
      username: `admin.${church.slug}`.slice(0, 32),
      email: `admin@${church.slug}.gundala.com`,
      phone: `+91 90${pad(ci, 2)}00 1${pad(ci * 7, 4)}`,
      role: "CHURCH_ADMIN",
      isActive: church.isActive,
      avatarInitials: initials(adminName.replace("Fr. ", "")),
      createdAt: church.createdAt,
      lastActiveAt: "2026-08-20T07:40:00.000Z",
    };
    users.push(admin);

    const staffPool = STAFF_NAMES[ci % STAFF_NAMES.length];
    const staff: User[] = staffPool.map((name, si) => ({
      id: `usr_${church.slug}_staff_${si + 1}`,
      churchId: church.id,
      name,
      username: `${slugify(name.replace(/(Fr\.|Sr\.|Bro\.)\s/g, ""))}.${church.slug}`.slice(0, 32),
      email: `${slugify(name.replace(/(Fr\.|Sr\.|Bro\.)\s/g, ""))}@${church.slug}.gundala.com`,
      phone: `+91 91${pad(ci, 2)}${pad(si, 2)} 2${pad(si * 13 + ci, 4)}`,
      role: "CHURCH_STAFF",
      isActive: church.isActive && si !== staffPool.length - 1 ? true : si % 2 === 0,
      avatarInitials: initials(name.replace(/(Fr\.|Sr\.|Bro\.)\s/g, "")),
      createdAt: church.createdAt,
      lastActiveAt: `2026-08-${pad(14 + (si % 6), 2)}T09:00:00.000Z`,
    }));
    users.push(...staff);
    const activeStaff = staff.filter((s) => s.isActive);

    /* ---------------- customers ---------------- */
    const customerCount = church.isActive ? 14 : 5;
    const churchCustomers: Customer[] = [];
    for (let i = 0; i < customerCount; i++) {
      const firstName = CUSTOMER_FIRST[(ci * 5 + i * 3) % CUSTOMER_FIRST.length];
      const lastName = CUSTOMER_LAST[(ci * 3 + i * 5) % CUSTOMER_LAST.length];
      const name = `${firstName} ${lastName}`;
      const areas = CITY_AREAS[church.city] ?? ["Main Road"];
      const customer: Customer = {
        id: `cus_${church.slug}_${pad(i + 1, 3)}`,
        churchId: church.id,
        name,
        mobile: `9${pad(800000000 + ci * 1111111 + i * 4321, 9)}`,
        email:
          i % 3 === 0
            ? undefined
            : `${slugify(firstName)}.${slugify(lastName)}${i}@example.com`,
        addressLine: `${(i % 40) + 1}, ${areas[i % areas.length]}`,
        city: church.city,
        notes: i % 7 === 0 ? "Prefers a call before the prayer date." : undefined,
        createdAt: timeAt(addDays(TODAY, -160 + i * 7), 8, (i * 11) % 60),
      };
      churchCustomers.push(customer);
    }
    customers.push(...churchCustomers);

    if (!church.isActive) {
      // Deactivated tenant: keep a light history so the platform views still
      // show a plausible record without implying ongoing operations.
      return;
    }

    /* ---------------- intentions + payments + receipts ---------------- */
    const intentionCount = 46 + ci * 4;

    for (let i = 0; i < intentionCount; i++) {
      // Spread prayer dates from 74 days ago to 24 days ahead.
      const offset = Math.round(-74 + (i / intentionCount) * 98 + (rng() * 6 - 3));
      const prayerDate = addDays(TODAY, offset);
      const createdOffset = Math.min(offset - 1 - Math.floor(rng() * 9), -1);
      const createdAt = timeAt(
        addDays(TODAY, Math.max(createdOffset, -120)),
        7 + Math.floor(rng() * 10),
        Math.floor(rng() * 60),
      );

      const prayerType = pick(rng, prayerTypes);
      const customer = churchCustomers[(i * 3 + ci) % churchCustomers.length];
      const method = pick(rng, METHOD_WEIGHTS);
      const amountJitter = [0, 100, 200, -100][Math.floor(rng() * 4)];
      const amount = Math.max(200, prayerType.suggestedAmount + amountJitter);

      receiptCounter += 1;
      const reference = formatReceiptReference(receiptCounter);

      const isPast = offset < 0;
      const isTodayPrayer = offset === 0;

      // Payment status distribution: settled history, a live verification queue.
      let paymentStatus: PaymentStatus;
      const roll = rng();
      if (isPast) {
        paymentStatus = roll < 0.94 ? "VERIFIED" : roll < 0.98 ? "REJECTED" : "PENDING_VERIFICATION";
      } else if (isTodayPrayer) {
        paymentStatus = roll < 0.8 ? "VERIFIED" : "PENDING_VERIFICATION";
      } else {
        paymentStatus = roll < 0.6 ? "VERIFIED" : roll < 0.95 ? "PENDING_VERIFICATION" : "REJECTED";
      }

      // Intention status is derived from payment + schedule, never merged with it.
      let status: IntentionStatus;
      let assignedStaff: User | undefined;

      if (paymentStatus === "REJECTED") {
        status = rng() < 0.5 ? "PAYMENT_PENDING" : "CANCELLED";
      } else if (paymentStatus === "PENDING_VERIFICATION") {
        status = rng() < 0.55 ? "CREATED" : "PAYMENT_PENDING";
      } else if (isPast) {
        status = rng() < 0.93 ? "COMPLETED" : "CANCELLED";
        if (status === "COMPLETED") assignedStaff = pick(rng, activeStaff);
      } else if (isTodayPrayer) {
        const r = rng();
        if (r < 0.3) status = "COMPLETED";
        else if (r < 0.55) status = "IN_PROGRESS";
        else status = "PENDING_PRAYER";
        assignedStaff = pick(rng, activeStaff);
      } else {
        const r = rng();
        if (r < 0.55) {
          status = "ASSIGNED";
          assignedStaff = pick(rng, activeStaff);
        } else {
          status = "PAID";
        }
      }

      const intentionId = `int_${church.slug}_${pad(i + 1, 4)}`;
      const paymentId = `pay_${church.slug}_${pad(i + 1, 4)}`;
      const receiptId = `rcp_${church.slug}_${pad(i + 1, 4)}`;

      const needsReference = method !== "CASH";
      const payment: Payment = {
        id: paymentId,
        churchId: church.id,
        intentionId,
        customerId: customer.id,
        amount,
        method,
        provider: PROVIDERS[method],
        transactionId: needsReference
          ? `TXN${pad(
              482000000 + ci * 91117 + i * 733,
              12,
            )}`
          : undefined,
        proof: needsReference
          ? {
              id: `prf_${church.slug}_${pad(i + 1, 4)}`,
              fileName: `payment-proof-${pad(i + 1, 4)}.jpg`,
              mimeType: "image/jpeg",
              sizeBytes: 180000 + Math.floor(rng() * 900000),
              uploadedAt: createdAt,
            }
          : rng() < 0.15
            ? {
                id: `prf_${church.slug}_${pad(i + 1, 4)}`,
                fileName: `counter-receipt-${pad(i + 1, 4)}.jpg`,
                mimeType: "image/jpeg",
                sizeBytes: 120000 + Math.floor(rng() * 400000),
                uploadedAt: createdAt,
              }
            : undefined,
        notes:
          rng() < 0.25
            ? method === "CASH"
              ? "Received at the parish office counter."
              : "Paid by the family before submitting the intention."
            : undefined,
        status: paymentStatus,
        createdAt,
        verifiedAt:
          paymentStatus === "VERIFIED"
            ? timeAt(addDays(createdAt.slice(0, 10), 0), 11, Math.floor(rng() * 60))
            : undefined,
        verifiedByUserId: paymentStatus === "VERIFIED" ? admin.id : undefined,
        rejectedAt:
          paymentStatus === "REJECTED"
            ? timeAt(addDays(createdAt.slice(0, 10), 0), 12, Math.floor(rng() * 60))
            : undefined,
        rejectedByUserId: paymentStatus === "REJECTED" ? admin.id : undefined,
        rejectionReason:
          paymentStatus === "REJECTED"
            ? method === "CASH"
              ? "Amount did not match the counter register for the day."
              : "Transaction reference could not be traced in the parish account."
            : undefined,
      };

      const completedAt =
        status === "COMPLETED"
          ? timeAt(prayerDate, 8 + Math.floor(rng() * 8), Math.floor(rng() * 60))
          : undefined;

      const intention: Intention = {
        id: intentionId,
        churchId: church.id,
        reference,
        customerId: customer.id,
        prayerTypeId: prayerType.id,
        prayerFor: pick(rng, PRAYER_FOR_NAMES),
        requestedBy: customer.name,
        prayerDate,
        preferredTime: `${pad(6 + Math.floor(rng() * 12), 2)}:${rng() < 0.5 ? "00" : "30"}`,
        message: rng() < 0.85 ? pick(rng, MESSAGES) : undefined,
        amount,
        status,
        paymentId,
        assignment: assignedStaff
          ? {
              staffUserId: assignedStaff.id,
              assignedAt: timeAt(createdAt.slice(0, 10), 13, Math.floor(rng() * 60)),
              assignedByUserId: admin.id,
            }
          : undefined,
        receiptId,
        completedAt,
        completedByUserId: completedAt ? assignedStaff?.id : undefined,
        cancelledAt:
          status === "CANCELLED"
            ? timeAt(createdAt.slice(0, 10), 15, Math.floor(rng() * 60))
            : undefined,
        cancellationReason:
          status === "CANCELLED"
            ? rng() < 0.5
              ? "Withdrawn by the family."
              : "Payment could not be confirmed."
            : undefined,
        source: rng() < 0.62 ? "PUBLIC" : "STAFF",
        createdAt,
        updatedAt: completedAt ?? payment.verifiedAt ?? createdAt,
      };

      const receipt: Receipt = {
        id: receiptId,
        churchId: church.id,
        reference,
        intentionId,
        paymentId,
        customerId: customer.id,
        issuedAt: createdAt,
        receivedByUserId: admin.id,
        authorizedByUserId: paymentStatus === "VERIFIED" ? admin.id : undefined,
      };

      payments.push(payment);
      intentions.push(intention);
      receipts.push(receipt);
    }

    /* ---------------- notifications ---------------- */
    const churchIntentions = intentions.filter((i) => i.churchId === church.id);
    const todays = churchIntentions.filter((i) => i.prayerDate === TODAY);
    const tomorrows = churchIntentions.filter((i) => i.prayerDate === addDays(TODAY, 1));
    const pendingVerification = churchIntentions.filter(
      (i) => payments.find((p) => p.id === i.paymentId)?.status === "PENDING_VERIFICATION",
    );

    const push = (n: Omit<AppNotification, "id">) => {
      notificationSeq += 1;
      notifications.push({ id: `ntf_${pad(notificationSeq, 5)}`, ...n });
    };

    push({
      churchId: church.id,
      userId: null,
      type: "PRAYER_DUE_TODAY",
      title: "Today's prayers",
      body: `You have ${todays.length} prayer ${
        todays.length === 1 ? "intention" : "intentions"
      } scheduled for today.`,
      href: "/intentions?date=today",
      isRead: false,
      createdAt: timeAt(TODAY, 5, 30),
    });

    push({
      churchId: church.id,
      userId: null,
      type: "UPCOMING_PRAYER",
      title: "Tomorrow",
      body: `${tomorrows.length} prayer ${
        tomorrows.length === 1 ? "intention" : "intentions"
      } scheduled for tomorrow.`,
      href: "/intentions",
      isRead: false,
      createdAt: timeAt(TODAY, 5, 32),
    });

    if (pendingVerification.length) {
      push({
        churchId: church.id,
        userId: admin.id,
        type: "PAYMENT_VERIFICATION",
        title: "Payments awaiting verification",
        body: `${pendingVerification.length} payments are waiting for your verification.`,
        href: "/payments?status=PENDING_VERIFICATION",
        isRead: false,
        createdAt: timeAt(TODAY, 6, 5),
      });
    }

    churchIntentions
      .filter((i) => i.createdAt.slice(0, 10) >= addDays(TODAY, -2))
      .slice(0, 4)
      .forEach((i, idx) => {
        push({
          churchId: church.id,
          userId: admin.id,
          type: "NEW_INTENTION",
          title: "New prayer intention",
          body: `${i.reference} — ${i.prayerFor} submitted a new intention.`,
          href: `/intentions/${i.id}`,
          isRead: idx > 1,
          createdAt: i.createdAt,
        });
      });

    activeStaff.forEach((s) => {
      const mine = churchIntentions.filter(
        (i) => i.assignment?.staffUserId === s.id && i.prayerDate === TODAY,
      );
      if (!mine.length) return;
      push({
        churchId: church.id,
        userId: s.id,
        type: "NEW_ASSIGNMENT",
        title: "Prayers assigned to you",
        body: `${mine.length} prayer ${
          mine.length === 1 ? "intention is" : "intentions are"
        } assigned to you for today.`,
        href: "/my-prayers",
        isRead: false,
        createdAt: timeAt(TODAY, 6, 15),
      });
    });

    const completedToday = churchIntentions.filter(
      (i) => i.status === "COMPLETED" && i.prayerDate === TODAY,
    );
    completedToday.slice(0, 2).forEach((i) => {
      push({
        churchId: church.id,
        userId: admin.id,
        type: "PRAYER_COMPLETED",
        title: "Prayer completed",
        body: `${i.reference} — the prayer for ${i.prayerFor} has been completed.`,
        href: `/intentions/${i.id}`,
        isRead: false,
        createdAt: i.completedAt ?? timeAt(TODAY, 8, 0),
      });
    });

    /* ---------------- audit logs ---------------- */
    const log = (entry: Omit<AuditLog, "id">) => {
      auditSeq += 1;
      auditLogs.push({ id: `log_${pad(auditSeq, 5)}`, ...entry });
    };

    log({
      churchId: church.id,
      actorUserId: "usr_platform_owner",
      actorName: "Elizabeth Mathai",
      action: "CHURCH_CREATED",
      entity: "church",
      entityId: church.id,
      summary: `Created church "${church.name}" and issued the tenant workspace.`,
      ipAddress: "103.21.58.14",
      createdAt: church.createdAt,
    });

    log({
      churchId: church.id,
      actorUserId: "usr_platform_owner",
      actorName: "Elizabeth Mathai",
      action: "ADMIN_ASSIGNED",
      entity: "user",
      entityId: admin.id,
      summary: `Assigned ${admin.name} as Church Admin for ${church.name}.`,
      ipAddress: "103.21.58.14",
      createdAt: timeAt(addDays(church.createdAt.slice(0, 10), 1), 9, 20),
    });

    churchIntentions.slice(-6).forEach((i) => {
      const p = payments.find((pp) => pp.id === i.paymentId);
      if (p?.status === "VERIFIED") {
        log({
          churchId: church.id,
          actorUserId: admin.id,
          actorName: admin.name,
          action: "PAYMENT_VERIFIED",
          entity: "payment",
          entityId: p.id,
          summary: `Verified ${p.method} payment of ₹${p.amount} for ${i.reference}.`,
          ipAddress: "49.37.112.9",
          createdAt: p.verifiedAt ?? i.createdAt,
        });
      }
      if (i.status === "COMPLETED") {
        log({
          churchId: church.id,
          actorUserId: i.completedByUserId ?? admin.id,
          actorName:
            users.find((u) => u.id === i.completedByUserId)?.name ?? admin.name,
          action: "PRAYER_COMPLETED",
          entity: "intention",
          entityId: i.id,
          summary: `Marked ${i.reference} as completed.`,
          ipAddress: "49.37.112.9",
          createdAt: i.completedAt ?? i.updatedAt,
        });
      }
    });
  });

  /* ---------------- platform-level notifications ---------------- */
  notifications.push({
    id: "ntf_platform_1",
    churchId: null,
    userId: "usr_platform_owner",
    type: "SYSTEM",
    title: "Monthly platform report is ready",
    body: "The consolidated report for July 2026 across all churches is available.",
    href: "/super-admin/reports",
    isRead: false,
    createdAt: "2026-08-01T04:00:00.000Z",
  });
  notifications.push({
    id: "ntf_platform_2",
    churchId: null,
    userId: "usr_platform_owner",
    type: "SYSTEM",
    title: "New church onboarded",
    body: "Our Lady of Lourdes, Kakinada completed onboarding.",
    href: "/super-admin/churches/our-lady-of-lourdes",
    isRead: true,
    createdAt: "2026-03-27T06:20:00.000Z",
  });

  auditLogs.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  notifications.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return {
    churches,
    prayerTypes,
    users,
    customers,
    intentions,
    payments,
    receipts,
    notifications,
    auditLogs,
    receiptCounter,
  };
}
