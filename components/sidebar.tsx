'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth-provider';
import {
  LayoutDashboard, ShoppingCart, ClipboardList, Package,
  Users, Factory, BookOpen, BarChart3, Receipt, LogOut,
  Shield, UserCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const navGroups = [
  {
    group: 'Main',
    items: [
      { id: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    group: 'Transactions',
    items: [
      { id: '/pos', icon: ShoppingCart, label: 'Sales POS' },
      { id: '/quotations', icon: ClipboardList, label: 'Quotations' },
      { id: '/purchases', icon: Package, label: 'Purchases' },
      { id: '/expenses', icon: Receipt, label: 'Expenses' },
    ],
  },
  {
    group: 'Masters',
    items: [
      { id: '/inventory', icon: Package, label: 'Inventory' },
      { id: '/customers', icon: Users, label: 'Customers' },
      { id: '/vendors', icon: Factory, label: 'Vendors' },
    ],
  },
  {
    group: 'Accounts',
    items: [
      { id: '/ledger', icon: BookOpen, label: 'Ledgers' },
      { id: '/reports', icon: BarChart3, label: 'P&L Reports' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { user, canManageUsers } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-[220px] bg-card border-r border-border flex flex-col z-50">
      <div className="p-5 border-b border-border">
        <h2 className="text-lg font-bold text-primary">⚙ HardwarePOS</h2>
        <span className="text-[10px] text-muted-foreground font-mono tracking-wide">Paint & Hardware Shop</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        {navGroups.map((g) => (
          <div key={g.group}>
            <div className="text-[10px] text-muted-foreground uppercase tracking-[2px] font-mono px-3 pt-4 pb-1">
              {g.group}
            </div>
            {g.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.id || pathname.startsWith(item.id + '/');
              return (
                <Link
                  key={item.id}
                  href={item.id}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all mb-0.5',
                    isActive
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}

        {canManageUsers && (
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-[2px] font-mono px-3 pt-4 pb-1">
              Administration
            </div>
            <Link
              href="/users"
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all mb-0.5',
                pathname === '/users'
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Shield className="w-4 h-4" />
              User Management
            </Link>
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-border space-y-2">
        {user && (
          <div className="px-3 py-2 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-2">
              <UserCircle className="w-4 h-4 text-primary" />
              <div className="min-w-0">
                <div className="text-xs font-medium truncate">{user.name || user.email}</div>
                <div className="text-[10px] text-muted-foreground uppercase">{user.role.replace('_', ' ')}</div>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all w-full"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
