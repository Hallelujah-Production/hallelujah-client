import {
  BarChart3,
  Bell,
  BookMarked,
  CalendarDays,
  CheckCircle2,
  Church,
  ClipboardList,
  FileText,
  LayoutDashboard,
  ReceiptText,
  ScrollText,
  Settings,
  Sparkles,
  UserCircle,
  Users,
  UsersRound,
  Wallet,
} from "lucide-react";
import type { IconKey } from "./nav-config";

export const NAV_ICONS: Record<IconKey, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  intentions: Sparkles,
  customers: Users,
  payments: Wallet,
  receipts: ReceiptText,
  team: UsersRound,
  bell: Bell,
  reports: BarChart3,
  settings: Settings,
  churches: Church,
  users: UsersRound,
  catalogue: BookMarked,
  audit: ScrollText,
  prayer: ClipboardList,
  calendar: CalendarDays,
  check: CheckCircle2,
  profile: UserCircle,
};

export { FileText };
