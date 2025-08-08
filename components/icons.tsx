import { Home, Users, Package, FileText, BarChart, FileUp, User, LogOut, LayoutDashboard, ChevronDown, ChevronUp } from 'lucide-react';

export const Icons = {
  home: Home,
  users: Users,
  package: Package,
  fileText: FileText,
  barChart: BarChart,
  fileUp: FileUp,
  user: User,
  logOut: LogOut,
  layoutDashboard: LayoutDashboard,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp, PillBottle
};

export type Icon = keyof typeof Icons;
