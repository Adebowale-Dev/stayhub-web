'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  DoorOpen,
  UserCog,
  CreditCard,
  BarChart3,
  Home,
  Ticket,
  User,
  UserCheck,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import useAuthStore from '@/store/useAuthStore';
import {Avatar, AvatarFallback}  from '@/components/ui/avatar';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const adminNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'Colleges', href: '/admin/colleges', icon: Building2 },
  { title: 'Hostels', href: '/admin/dashboard/hostels', icon: Home },
  { title: 'Rooms', href: '/admin/rooms', icon: DoorOpen },
  { title: 'Porters', href: '/admin/porters', icon: UserCog },
  { title: 'Payments', href: '/admin/payments', icon: CreditCard },
  { title: 'Reports', href: '/admin/reports', icon: BarChart3 },
];

const studentNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
  { title: 'Browse Hostels', href: '/student/hostels', icon: Home },
  { title: 'My Reservation', href: '/student/reservation', icon: Ticket },
  { title: 'Payment', href: '/student/payment', icon: CreditCard },
  { title: 'Profile', href: '/student/profile', icon: User },
];

const porterNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/porter/dashboard', icon: LayoutDashboard },
  { title: 'Students', href: '/porter/students', icon: Users },
  { title: 'Check-in', href: '/porter/checkin', icon: UserCheck },
  { title: 'Rooms', href: '/porter/rooms', icon: DoorOpen },
  { title: 'Reports', href: '/porter/reports', icon: FileText },
];

interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const getNavItems = (): NavItem[] => {
    switch (user?.role) {
      case 'admin':
        return adminNavItems;
      case 'student':
        return studentNavItems;
      case 'porter':
        return porterNavItems;
      default:
        return [];
    }
  };

  const getInitials = () => {
    if (!user) return 'U';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  };

  const navItems = getNavItems();

  return (
    <div
      className={cn(
        'flex h-full w-64 flex-col border-r bg-background',
        className
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-primary">StayHub</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.title}</span>
                {isActive && (
                  <ChevronRight className="ml-auto h-4 w-4" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Profile Footer */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-foreground">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </div>
      
      </div>
    </div>
  );
}
