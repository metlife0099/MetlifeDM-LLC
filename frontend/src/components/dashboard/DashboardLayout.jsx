import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  Home,
  User,
  ShoppingBag,
  Receipt,
  MessageSquare,
  Heart,
  Bell,
  Shield,
  LogOut,
  Menu,
  X,
  ArrowUpRight,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth.js';
import { notificationApi } from '@/api/index.js';
import { Container } from '@/components/ui/Layout.jsx';
import { SITE } from '@/utils/constants.js';
import { cn, initials } from '@/utils/format.js';
import { useScrollLock } from '@/hooks/index.js';

const NAV = [
  { label: 'Overview', href: '/dashboard', icon: Home, exact: true },
  { label: 'Profile', href: '/dashboard/profile', icon: User },
  { label: 'Orders', href: '/dashboard/orders', icon: ShoppingBag },
  { label: 'Invoices', href: '/dashboard/invoices', icon: Receipt },
  { label: 'Support', href: '/dashboard/tickets', icon: MessageSquare },
  { label: 'Wishlist', href: '/dashboard/wishlist', icon: Heart },
  { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { label: 'Security', href: '/dashboard/security', icon: Shield },
];

export default function DashboardLayout() {
  const { logout } = useAuth();
  const user = useSelector((s) => s.auth.user);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  useScrollLock(mobileOpen);

  const { data: unread } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationApi.unreadCount(),
    refetchInterval: 60_000,
  });

  return (
    <div className="min-h-screen bg-ivory">
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 bg-ivory border-b border-hairline">
        <div className="flex items-center justify-between px-6 h-16">
          <Link to="/" className="text-display-sm">
            {SITE.name}
            <span className="text-ultra">.</span>
          </Link>
          <button onClick={() => setMobileOpen((o) => !o)} aria-label="Menu">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[280px_1fr]">
        {/* Sidebar — desktop */}
        <aside className="hidden lg:flex flex-col border-r border-hairline min-h-screen sticky top-0 max-h-screen">
          <div className="p-8 border-b border-hairline">
            <Link to="/" className="text-display-sm font-medium">
              {SITE.name}
              <span className="text-ultra">.</span>
            </Link>
            <div className="text-eyebrow mt-1">Dashboard</div>
          </div>

          {/* User card */}
          <div className="p-8 border-b border-hairline">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 grid place-items-center bg-ink text-ivory text-mono text-sm">
                {user?.avatar?.url ? (
                  <img src={user.avatar.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  initials(`${user?.firstName || ''} ${user?.lastName || ''}`)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm text-ink truncate">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-mono text-xs text-slate truncate">{user?.email}</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-4 overflow-y-auto">
            {NAV.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.exact}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors',
                    isActive
                      ? 'bg-ink text-ivory'
                      : 'text-ink/70 hover:bg-sand hover:text-ink'
                  )
                }
              >
                <span className="flex items-center gap-3">
                  <item.icon size={16} strokeWidth={1.5} />
                  {item.label}
                </span>
                {item.label === 'Notifications' && unread?.count > 0 && (
                  <span className="text-mono text-[0.65rem] bg-ultra text-ivory px-1.5 py-0.5 rounded-full">
                    {unread.count}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-hairline space-y-1">
            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-3 text-sm text-slate hover:text-ink"
            >
              <ArrowUpRight size={16} strokeWidth={1.5} />
              Back to site
            </Link>
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate hover:text-danger transition-colors text-left"
            >
              <LogOut size={16} strokeWidth={1.5} />
              Sign out
            </button>
          </div>
        </aside>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="lg:hidden fixed inset-y-0 left-0 top-16 z-40 w-72 bg-ivory border-r border-hairline overflow-y-auto"
            >
              <div className="p-6 border-b border-hairline">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 grid place-items-center bg-ink text-ivory text-mono text-sm">
                    {initials(`${user?.firstName || ''} ${user?.lastName || ''}`)}
                  </div>
                  <div>
                    <div className="text-sm">{user?.firstName} {user?.lastName}</div>
                    <div className="text-mono text-xs text-slate">{user?.email}</div>
                  </div>
                </div>
              </div>
              <nav className="p-4" onClick={() => setMobileOpen(false)}>
                {NAV.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.exact}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-4 py-3 text-sm',
                        isActive ? 'bg-ink text-ivory' : 'text-ink/70 hover:bg-sand'
                      )
                    }
                  >
                    <item.icon size={16} strokeWidth={1.5} />
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              <div className="p-4 border-t border-hairline">
                <button
                  onClick={logout}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-danger"
                >
                  <LogOut size={16} strokeWidth={1.5} />
                  Sign out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main */}
        <main className="min-h-screen">
          <Container className="py-10 md:py-16 max-w-6xl">
            <Outlet />
          </Container>
        </main>
      </div>
    </div>
  );
}
