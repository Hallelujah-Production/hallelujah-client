/**
 * Service layer barrel.
 *
 * UI code imports from here and never touches `lib/mock` directly. When the
 * NestJS API lands, each of these modules becomes a thin fetch wrapper and no
 * component signature changes.
 *
 *   Next.js UI  ->  Service Layer  ->  NestJS API  ->  PostgreSQL
 */
export * from "./church.service";
export * from "./user.service";
export * from "./customer.service";
export * from "./intention.service";
export * from "./payment.service";
export * from "./receipt.service";
export * from "./notification.service";
export * from "./dashboard.service";
export * from "./report.service";
export * from "./catalogue.service";
