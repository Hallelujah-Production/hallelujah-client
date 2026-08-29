import { paiseToRupees } from "@/lib/api/money";
import { asDateOnly, asIso } from "@/lib/api/query";
import type {
  AppNotification,
  Church,
  ChurchView,
  Customer,
  CustomerView,
  Intention,
  IntentionAssignment,
  IntentionView,
  NotificationType,
  Payment,
  PaymentMethod,
  PaymentProof,
  PaymentStatus,
  PaymentView,
  PrayerType,
  Receipt,
  ReceiptView,
  Role,
  User,
  UserView,
} from "@/lib/types";

function str(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function opt(value: unknown): string | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  return String(value);
}

export function mapChurch(dto: Record<string, unknown>, extras: Partial<Church> = {}): Church {
  return {
    id: str(dto.id),
    slug: str(dto.slug),
    name: str(dto.name),
    tagline: str(dto.tagline, extras.tagline ?? ""),
    description: str(dto.description, extras.description ?? ""),
    city: str(dto.city),
    state: str(dto.state),
    addressLine1: str(dto.addressLine1),
    addressLine2: opt(dto.addressLine2),
    postalCode: str(dto.postalCode),
    phone: str(dto.phone),
    email: str(dto.email),
    website: opt(dto.website),
    logoInitials: str(dto.logoInitials, extras.logoInitials ?? "CH"),
    accent: (dto.accent as Church["accent"]) || extras.accent || "navy",
    establishedYear: Number(dto.establishedYear) || extras.establishedYear || new Date().getFullYear(),
    isActive: dto.isActive !== false,
    featured: Boolean(dto.featured ?? dto.isFeatured),
    serviceTimes: Array.isArray(dto.serviceTimes)
      ? (dto.serviceTimes as Church["serviceTimes"])
      : extras.serviceTimes ?? [],
    createdAt: asIso(dto.createdAt as string | Date | undefined) || extras.createdAt || "",
    intentionCount: dto.intentionCount != null ? Number(dto.intentionCount) : extras.intentionCount,
    completedCount: dto.completedCount != null ? Number(dto.completedCount) : extras.completedCount,
    pendingCount: dto.pendingCount != null ? Number(dto.pendingCount) : extras.pendingCount,
    inProgressCount:
      dto.inProgressCount != null ? Number(dto.inProgressCount) : extras.inProgressCount,
  };
}

export function mapPublicChurch(dto: Record<string, unknown>): Church {
  return mapChurch(
    { ...dto, id: dto.id || `public:${dto.slug}`, isActive: true, featured: true },
    { createdAt: "" },
  );
}

export function mapChurchView(dto: Record<string, unknown>): ChurchView {
  const church = mapChurch(dto);
  return {
    ...church,
    adminName: opt(dto.adminName),
    adminEmail: opt(dto.adminEmail),
    staffCount: Number(dto.staffCount) || 0,
    intentionCount: Number(dto.intentionCount) || 0,
    revenue: paiseToRupees(dto.revenuePaise as number | string | undefined),
  };
}

export function mapUser(dto: Record<string, unknown>): User {
  const nestedChurch = dto.church as Record<string, unknown> | undefined;
  return {
    id: str(dto.id),
    churchId: dto.churchId ? str(dto.churchId) : nestedChurch?.id ? str(nestedChurch.id) : null,
    name: str(dto.name),
    email: str(dto.email),
    phone: str(dto.phone),
    role: (dto.role as Role) || "CHURCH_STAFF",
    isActive: dto.isActive !== false,
    invitationPending: Boolean(dto.invitationPending),
    avatarInitials: str(dto.avatarInitials, "U"),
    createdAt: asIso(dto.createdAt as string | Date | undefined),
    lastActiveAt: asIso(dto.lastActiveAt as string | Date | undefined),
  };
}

export function mapUserView(dto: Record<string, unknown>): UserView {
  const church = dto.church as Record<string, unknown> | undefined;
  return {
    ...mapUser(dto),
    church: church ? mapChurch(church) : undefined,
    assignedCount: Number(dto.assignedCount) || 0,
    completedCount: Number(dto.completedCount) || 0,
  };
}

export function mapPrayerType(dto: Record<string, unknown>): PrayerType {
  const paise = dto.amountPaise ?? dto.defaultAmountPaise ?? 0;
  return {
    id: str(dto.id),
    code: str(dto.code),
    name: str(dto.displayName || dto.name),
    description: str(dto.description),
    suggestedAmount: paiseToRupees(paise as number | string),
    durationMinutes: Number(dto.durationMinutes) || 0,
    icon: str(dto.icon, "star"),
    isActive: dto.isActive !== false && dto.isOffered !== false,
  };
}

export function mapCustomer(dto: Record<string, unknown>, churchId?: string): Customer {
  return {
    id: str(dto.id),
    churchId: str(dto.churchId || churchId),
    name: str(dto.name),
    mobile: opt(dto.mobile) ?? null,
    email: opt(dto.email),
    addressLine: opt(dto.addressLine),
    city: opt(dto.city),
    notes: opt(dto.notes),
    createdAt: asIso(dto.createdAt as string | Date | undefined),
  };
}

export function mapCustomerView(dto: Record<string, unknown>, churchId?: string): CustomerView {
  return {
    ...mapCustomer(dto, churchId),
    totalIntentions: Number(dto.totalIntentions) || 0,
    totalPaid: paiseToRupees(dto.totalPaidPaise as number | string | undefined),
    lastPrayerDate: opt(asDateOnly(dto.lastPrayerDate as string | undefined)),
  };
}

function stubPrayerType(partial: { id?: string; name?: string; code?: string }): PrayerType {
  return {
    id: partial.id ?? "",
    code: partial.code ?? "",
    name: partial.name ?? "Prayer",
    description: "",
    suggestedAmount: 0,
    durationMinutes: 0,
    icon: "star",
    isActive: true,
  };
}

export function mapPayment(dto: Record<string, unknown>, churchId?: string): Payment {
  const proofName = opt(dto.proofFileName);
  const proof: PaymentProof | undefined = dto.hasProof
    ? {
        id: str(dto.id),
        fileName: proofName ?? "proof",
        mimeType: str(dto.proofMime, "image/jpeg"),
        sizeBytes: Number(dto.proofSizeBytes) || 0,
        uploadedAt: asIso(dto.proofUploadedAt as string | Date | undefined),
      }
    : undefined;

  return {
    id: str(dto.id),
    churchId: str(dto.churchId || churchId),
    intentionId: str(dto.intentionId),
    customerId: str(dto.customerId),
    amount: paiseToRupees(dto.amountPaise as number | string | undefined),
    method: (dto.method as PaymentMethod) || "CASH",
    provider: opt(dto.provider),
    transactionId: opt(dto.transactionReference ?? dto.transactionId),
    proof,
    notes: opt(dto.notes),
    status: (dto.status as PaymentStatus) || "PENDING_VERIFICATION",
    createdAt: asIso(dto.createdAt as string | Date | undefined),
    verifiedAt: opt(asIso(dto.verifiedAt as string | Date | undefined)),
    verifiedByUserId: opt(dto.verifiedByUserId),
    rejectedAt: opt(asIso(dto.rejectedAt as string | Date | undefined)),
    rejectedByUserId: opt(dto.rejectedByUserId),
    rejectionReason: opt(dto.rejectionReason),
  };
}

export function mapPaymentView(
  dto: Record<string, unknown>,
  church?: Church | null,
): PaymentView {
  const intentionDto = (dto.intention as Record<string, unknown>) || {};
  const customerDto = (dto.customer as Record<string, unknown>) || {};
  const payment = mapPayment(dto, church?.id);
  const intention: Intention = {
    id: str(intentionDto.id || payment.intentionId),
    churchId: payment.churchId,
    reference: str(intentionDto.reference),
    customerId: payment.customerId,
    prayerTypeId: str(intentionDto.prayerTypeId),
    prayerFor: str(intentionDto.prayerFor),
    requestedBy: str(intentionDto.requestedBy),
    prayerDate: asDateOnly(intentionDto.prayerDate as string | undefined),
    preferredTime: opt(intentionDto.preferredTime),
    message: opt(intentionDto.message),
    amount: payment.amount,
    status: (intentionDto.status as Intention["status"]) || "PAYMENT_PENDING",
    paymentId: payment.id,
    source: "STAFF",
    createdAt: payment.createdAt,
    updatedAt: payment.createdAt,
  };

  return {
    ...payment,
    customer: mapCustomer(customerDto, payment.churchId),
    intention,
    prayerType: stubPrayerType({
      name: str(intentionDto.prayerTypeName || intentionDto.prayerFor),
    }),
    church: church ?? mapChurch({ id: payment.churchId, name: "", slug: "" }),
  };
}

export function mapIntention(dto: Record<string, unknown>, church?: Church | null): IntentionView {
  const customerDto = (dto.customer as Record<string, unknown>) || {};
  const prayerDto = (dto.prayerType as Record<string, unknown>) || {};
  const paymentDto = (dto.payment as Record<string, unknown>) || null;
  const assignmentDto = (dto.assignment as Record<string, unknown>) || null;
  const staffDto = assignmentDto?.staff as Record<string, unknown> | undefined;

  const amount = paiseToRupees(dto.amountPaise as number | string | undefined);
  const payment = paymentDto
    ? mapPayment(
        {
          ...paymentDto,
          churchId: dto.churchId,
          intentionId: dto.id,
          customerId: dto.customerId,
          amountPaise: dto.amountPaise,
        },
        str(dto.churchId),
      )
    : mapPayment(
        {
          id: "",
          churchId: dto.churchId,
          intentionId: dto.id,
          customerId: dto.customerId,
          amountPaise: dto.amountPaise,
          method: "CASH",
          status: "PENDING_VERIFICATION",
        },
        str(dto.churchId),
      );

  const assignment: IntentionAssignment | undefined = assignmentDto
    ? {
        staffUserId: str(assignmentDto.staffUserId),
        assignedAt: asIso(assignmentDto.assignedAt as string | Date | undefined),
        assignedByUserId: str(assignmentDto.assignedByUserId),
      }
    : undefined;

  const churchDto = dto.church as Record<string, unknown> | undefined;
  const churchResolved =
    church ??
    mapChurch(
      churchDto ?? {
        id: dto.churchId,
        name: dto.churchName,
        slug: "",
      },
    );

  return {
    id: str(dto.id),
    churchId: str(dto.churchId),
    reference: str(dto.reference),
    customerId: str(dto.customerId),
    prayerTypeId: str(dto.prayerTypeId || prayerDto.id),
    prayerFor: str(dto.prayerFor),
    requestedBy: str(dto.requestedBy),
    prayerDate: asDateOnly(dto.prayerDate as string | undefined),
    preferredTime: opt(dto.preferredTime),
    message: opt(dto.message),
    amount,
    status: (dto.status as Intention["status"]) || "CREATED",
    paymentId: payment.id,
    assignment,
    receiptId: opt(dto.receiptId),
    startedAt: opt(asIso(dto.startedAt as string | Date | undefined)),
    completedAt: opt(asIso(dto.completedAt as string | Date | undefined)),
    completedByUserId: opt(dto.completedByUserId),
    cancelledAt: opt(asIso(dto.cancelledAt as string | Date | undefined)),
    cancellationReason: opt(dto.cancellationReason),
    source: dto.source === "PUBLIC" ? "PUBLIC" : "STAFF",
    createdAt: asIso(dto.createdAt as string | Date | undefined),
    updatedAt: asIso(dto.updatedAt as string | Date | undefined),
    customer: mapCustomer(customerDto, str(dto.churchId)),
    prayerType: mapPrayerType({ ...prayerDto, amountPaise: dto.amountPaise }),
    payment,
    assignedStaff: staffDto ? mapUser(staffDto) : undefined,
    church: churchResolved,
    createdByName: opt(dto.createdByName),
  };
}

export function mapReceiptListItem(
  dto: Record<string, unknown>,
  church?: Church | null,
): ReceiptView {
  const amount = paiseToRupees(dto.amountPaise as number | string | undefined);
  const churchResolved = church ?? mapChurch({ id: dto.churchId, name: "", slug: "" });
  const customer: Customer = {
    id: str(dto.customerId),
    churchId: churchResolved.id,
    name: str(dto.customerName),
    mobile: opt(dto.customerMobile) ?? null,
    createdAt: "",
  };
  const intention: Intention = {
    id: str(dto.intentionId),
    churchId: churchResolved.id,
    reference: str(dto.intentionReference),
    customerId: customer.id,
    prayerTypeId: "",
    prayerFor: "",
    requestedBy: customer.name,
    prayerDate: asDateOnly(dto.prayerDate as string | undefined),
    amount,
    status: "PAID",
    paymentId: str(dto.paymentId),
    source: "STAFF",
    createdAt: asIso(dto.issuedAt as string | Date | undefined),
    updatedAt: asIso(dto.issuedAt as string | Date | undefined),
  };
  const payment: Payment = {
    id: str(dto.paymentId),
    churchId: churchResolved.id,
    intentionId: intention.id,
    customerId: customer.id,
    amount,
    method: (dto.method as PaymentMethod) || "CASH",
    status: (dto.paymentStatus as PaymentStatus) || "VERIFIED",
    createdAt: asIso(dto.issuedAt as string | Date | undefined),
  };
  const receipt: Receipt = {
    id: str(dto.id),
    churchId: churchResolved.id,
    reference: str(dto.receiptNumber || dto.reference),
    intentionId: intention.id,
    paymentId: payment.id,
    customerId: customer.id,
    issuedAt: asIso(dto.issuedAt as string | Date | undefined),
  };
  return {
    ...receipt,
    church: churchResolved,
    customer,
    intention,
    prayerType: stubPrayerType({ name: str(dto.prayerTypeName) }),
    payment,
  };
}

export function mapOfficialReceipt(
  dto: Record<string, unknown>,
  churchHint?: Church | null,
): ReceiptView {
  const snapChurch = (dto.church as Record<string, unknown>) || {};
  const snapCustomer = (dto.customer as Record<string, unknown>) || {};
  const snapPrayer = (dto.prayer as Record<string, unknown>) || {};
  const snapPayment = (dto.payment as Record<string, unknown>) || {};
  const auth = (dto.authorization as Record<string, unknown>) || {};

  const church = mapChurch(
    {
      ...snapChurch,
      id: dto.churchId || churchHint?.id,
      slug: churchHint?.slug || snapChurch.slug,
    },
    churchHint ?? {},
  );
  const amount = paiseToRupees(snapPayment.amountPaise as number | string | undefined);
  const customer: Customer = {
    id: str(dto.customerId),
    churchId: church.id,
    name: str(snapCustomer.name),
    mobile: opt(snapCustomer.mobile) ?? null,
    email: opt(snapCustomer.email),
    createdAt: "",
  };
  const intention: Intention = {
    id: str(dto.intentionId),
    churchId: church.id,
    reference: str(snapPrayer.intentionReference),
    customerId: customer.id,
    prayerTypeId: "",
    prayerFor: str(snapPrayer.prayerFor),
    requestedBy: str(snapPrayer.requestedBy),
    prayerDate: asDateOnly(snapPrayer.prayerDate as string | undefined),
    preferredTime: opt(snapPrayer.preferredTime),
    message: opt(snapPrayer.message),
    amount,
    status: "PAID",
    paymentId: str(dto.paymentId),
    source: "STAFF",
    createdAt: asIso(dto.issuedAt as string | Date | undefined),
    updatedAt: asIso(dto.issuedAt as string | Date | undefined),
  };
  const payment: Payment = {
    id: str(dto.paymentId),
    churchId: church.id,
    intentionId: intention.id,
    customerId: customer.id,
    amount,
    method: (snapPayment.method as PaymentMethod) || "CASH",
    provider: opt(snapPayment.provider),
    transactionId: opt(snapPayment.transactionReference),
    status: (snapPayment.status as PaymentStatus) || "VERIFIED",
    createdAt: asIso(snapPayment.verifiedAt as string | Date | undefined) || asIso(dto.issuedAt as string | Date | undefined),
    verifiedAt: opt(asIso(snapPayment.verifiedAt as string | Date | undefined)),
  };
  const receipt: Receipt = {
    id: str(dto.id),
    churchId: church.id,
    reference: str(dto.receiptNumber),
    intentionId: intention.id,
    paymentId: payment.id,
    customerId: customer.id,
    issuedAt: asIso(dto.issuedAt as string | Date | undefined),
    receivedByUserId: opt(auth.receivedByName),
    authorizedByUserId: opt(auth.verifiedByName),
  };
  return {
    ...receipt,
    church,
    customer,
    intention,
    prayerType: stubPrayerType({
      name: str(snapPrayer.typeName),
      code: str(snapPrayer.typeCode),
    }),
    payment,
    receivedBy: auth.receivedByName ? { ...mapUser({ name: auth.receivedByName, id: "received" }) } : undefined,
    authorizedBy: auth.verifiedByName
      ? { ...mapUser({ name: auth.verifiedByName, id: "verified" }) }
      : undefined,
  };
}

const NOTIFICATION_TYPES: NotificationType[] = [
  "NEW_INTENTION",
  "NEW_ASSIGNMENT",
  "PAYMENT_VERIFICATION",
  "PAYMENT_VERIFIED",
  "PAYMENT_REJECTED",
  "RECEIPT_ISSUED",
  "PRAYER_DUE_TODAY",
  "UPCOMING_PRAYER",
  "PRAYER_COMPLETED",
  "SYSTEM",
];

export function mapNotification(dto: Record<string, unknown>): AppNotification {
  const type = NOTIFICATION_TYPES.includes(dto.type as NotificationType)
    ? (dto.type as NotificationType)
    : "SYSTEM";
  return {
    id: str(dto.id),
    churchId: dto.churchId ? str(dto.churchId) : null,
    userId: dto.userId ? str(dto.userId) : null,
    type,
    title: str(dto.title),
    body: str(dto.body),
    href: opt(dto.href),
    isRead: Boolean(dto.readAt),
    createdAt: asIso(dto.createdAt as string | Date | undefined),
  };
}
