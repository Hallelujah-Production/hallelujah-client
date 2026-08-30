import type { Role } from "@/lib/types";

export type IconKey =
  | "dashboard"
  | "intentions"
  | "customers"
  | "payments"
  | "receipts"
  | "team"
  | "bell"
  | "reports"
  | "settings"
  | "churches"
  | "users"
  | "catalogue"
  | "audit"
  | "prayer"
  | "calendar"
  | "check"
  | "profile";

export interface NavItem {
  label: string;
  href: string;
  icon: IconKey;
  /** Marks the section active for nested routes. */
  match?: string[];
  /** Nested paths that belong to another item (e.g. Create Intention). */
  exclude?: string[];
  badge?: "notifications" | "paymentsPending";
  description?: string;
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}

/**
 * Navigation is derived from the role in the session — never from the URL and
 * never from a tenant id in a query parameter. Hiding a link is a usability
 * decision, not a security control: the backend will authorise every request
 * independently.
 */
export const NAVIGATION: Record<Role, NavSection[]> = {
  CHURCH_ADMIN: [
    {
      items: [
        { label: "Create Intention", href: "/intentions/new", icon: "intentions" },
        { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
      ],
    },
    {
      label: "Prayer ministry",
      items: [
        {
          label: "My Churches",
          href: "/my-churches",
          icon: "churches",
          match: ["/my-churches"],
        },
        {
          label: "Intentions",
          href: "/intentions",
          icon: "intentions",
          match: ["/intentions"],
          exclude: ["/intentions/new"],
        },
        { label: "Families", href: "/customers", icon: "customers", match: ["/customers"] },
      ],
    },
    {
      label: "Records",
      items: [
        {
          label: "Payments",
          href: "/payments",
          icon: "payments",
          match: ["/payments"],
          badge: "paymentsPending",
        },
        { label: "Receipts", href: "/receipts", icon: "receipts", match: ["/receipts"] },
        { label: "Reports", href: "/reports", icon: "reports" },
      ],
    },
    {
      label: "Church",
      items: [
        { label: "Team", href: "/team", icon: "team" },
        {
          label: "Prayer Types",
          href: "/settings?section=prayer-types",
          icon: "catalogue",
        },
        { label: "Notifications", href: "/notifications", icon: "bell", badge: "notifications" },
        { label: "Settings", href: "/settings", icon: "settings" },
      ],
    },
  ],

  CHURCH_STAFF: [
    {
      items: [{ label: "Prayers", href: "/dashboard", icon: "prayer" }],
    },
    {
      label: "My ministry",
      items: [
        { label: "My Prayers", href: "/my-prayers", icon: "prayer", match: ["/my-prayers"] },
        { label: "Upcoming", href: "/upcoming", icon: "calendar" },
        { label: "Completed", href: "/completed", icon: "check" },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "Notifications", href: "/notifications", icon: "bell", badge: "notifications" },
        { label: "Profile", href: "/profile", icon: "profile" },
      ],
    },
  ],

  SUPER_ADMIN: [
    {
      items: [{ label: "Dashboard", href: "/super-admin", icon: "dashboard" }],
    },
    {
      label: "Platform",
      items: [
        {
          label: "Churches",
          href: "/super-admin/churches",
          icon: "churches",
          match: ["/super-admin/churches"],
        },
        {
          label: "My Churches",
          href: "/super-admin/my-churches",
          icon: "intentions",
          match: ["/super-admin/my-churches"],
        },
        {
          label: "Users",
          href: "/super-admin/users",
          icon: "users",
          match: ["/super-admin/users"],
        },
        {
          label: "Prayer Types",
          href: "/super-admin/prayer-types",
          icon: "catalogue",
        },
      ],
    },
    {
      label: "Oversight",
      items: [
        { label: "Reports", href: "/super-admin/reports", icon: "reports" },
        { label: "Audit Logs", href: "/super-admin/audit-logs", icon: "audit" },
        { label: "Notifications", href: "/notifications", icon: "bell", badge: "notifications" },
        { label: "Settings", href: "/super-admin/settings", icon: "settings" },
      ],
    },
  ],
};

/** Bottom navigation for small screens — the four most-used destinations. */
export const MOBILE_TABS: Record<Role, NavItem[]> = {
  CHURCH_ADMIN: [
    { label: "Create", href: "/intentions/new", icon: "intentions" },
    { label: "Intentions", href: "/intentions", icon: "intentions", match: ["/intentions"], exclude: ["/intentions/new"] },
    { label: "Payments", href: "/payments", icon: "payments", match: ["/payments"] },
    { label: "Alerts", href: "/notifications", icon: "bell", badge: "notifications" },
  ],
  CHURCH_STAFF: [
    { label: "Prayers", href: "/dashboard", icon: "prayer" },
    { label: "My Prayers", href: "/my-prayers", icon: "prayer", match: ["/my-prayers"] },
    { label: "Upcoming", href: "/upcoming", icon: "calendar" },
    { label: "Alerts", href: "/notifications", icon: "bell", badge: "notifications" },
  ],
  SUPER_ADMIN: [
    { label: "Home", href: "/super-admin", icon: "dashboard" },
    { label: "Churches", href: "/super-admin/churches", icon: "churches", match: ["/super-admin/churches"] },
    { label: "Users", href: "/super-admin/users", icon: "users", match: ["/super-admin/users"] },
    { label: "Alerts", href: "/notifications", icon: "bell", badge: "notifications" },
  ],
};

export const WORKSPACE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: "Platform Administration",
  CHURCH_ADMIN: "Administrator",
  CHURCH_STAFF: "Prayer Staff",
};
