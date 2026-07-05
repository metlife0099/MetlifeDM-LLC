import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PanelLeft, Bell, LogOut, User, ChevronDown, Search, Menu, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toggleSidebar, toggleMobileMenu } from '@/store/index.js';
import { notificationsApi } from '@/api/index.js';
import { useAuth } from '@/hooks/useAuth.js';
import { useClickOutside } from '@/hooks/index.js';
import { cn, initials, timeAgo, humanize } from '@/utils/format.js';
import { ROLE_LABELS } from '@/utils/constants.js';

export default function Topbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const collapsed = useSelector((s) => s.ui.sidebarCollapsed);
  const { user, logout } = useAuth();

  const [userOpen, setUserOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const userRef = useRef(null);
  const notifRef = useRef(null);

  useClickOutside(userRef, () => setUserOpen(false));
  useClickOutside(notifRef, () => setNotifOpen(false));

  const { data: unread } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationsApi.unreadCount(),
    refetchInterval: 60_000,
  });

  const { data: notifs } = useQuery({
    queryKey: ['notifications', 'topbar'],
    queryFn: () => notificationsApi.list({ limit: 8 }),
    enabled: notifOpen,
  });

  const markRead = useMutation({
    mutationFn: (id) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const openNotification = (n) => {
    if (!n.isRead) markRead.mutate(n._id);
    setNotifOpen(false);
    if (n.actionUrl) navigate(n.actionUrl);
  };

  const unreadCount = unread?.count || 0;
  const items = notifs?.data || [];

  return (
    <header className="sticky top-0 z-30 bg-canvas border-b border-hairline">
      <div className="flex items-center justify-between h-14 px-5 gap-4">
        {/* Left: sidebar toggle + search */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          {/* Desktop toggle */}
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="hidden md:grid place-items-center w-8 h-8 hover:bg-ivory-soft transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <PanelLeft size={16} strokeWidth={1.5} />
          </button>
          {/* Mobile menu */}
          <button
            onClick={() => dispatch(toggleMobileMenu(true))}
            className="md:hidden grid place-items-center w-8 h-8 hover:bg-ivory-soft transition-colors"
            aria-label="Open menu"
          >
            <Menu size={16} strokeWidth={1.5} />
          </button>

          {/* Search (visual for now — command palette v2) */}
          <div className="hidden md:flex flex-1 relative">
            <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
            <input
              type="text"
              placeholder="Search orders, users, content…"
              className="w-full pl-9 pr-16 py-1.5 text-sm bg-surface border border-hairline placeholder:text-slate-soft focus:outline-none focus:border-ultra transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-mono text-[0.65rem] text-slate border border-hairline-strong px-1.5 py-0.5">
              ⌘K
            </span>
          </div>
        </div>

        {/* Right: notifications + user */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((o) => !o)}
              className="relative w-8 h-8 grid place-items-center hover:bg-ivory-soft transition-colors"
              aria-label="Notifications"
            >
              <Bell size={16} strokeWidth={1.5} />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-1 w-1.5 h-1.5 bg-ultra rounded-full" />
              )}
            </button>
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-96 bg-surface border border-hairline shadow-xl max-h-[80vh] overflow-y-auto"
                >
                  <div className="p-4 border-b border-hairline flex items-center justify-between gap-3">
                    <div className="text-eyebrow">Notifications</div>
                    <div className="flex items-center gap-3">
                      {unreadCount > 0 && (
                        <span className="text-mono text-xs text-slate">{unreadCount} unread</span>
                      )}
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllRead.mutate()}
                          disabled={markAllRead.isPending}
                          className="flex items-center gap-1 text-mono text-[0.65rem] uppercase tracking-widest text-slate hover:text-ultra transition-colors"
                        >
                          <CheckCheck size={12} strokeWidth={1.5} />
                          Mark all read
                        </button>
                      )}
                    </div>
                  </div>
                  {items.length === 0 ? (
                    <div className="p-8 text-center text-slate text-sm">
                      No notifications yet.
                    </div>
                  ) : (
                    <ul className="divide-editorial">
                      {items.map((n) => (
                        <li key={n._id}>
                          <button
                            onClick={() => openNotification(n)}
                            className="w-full text-left p-4 hover:bg-ivory-soft transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                'w-1.5 h-1.5 rounded-full mt-2 shrink-0',
                                n.isRead ? 'bg-hairline-strong' : 'bg-ultra'
                              )} />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm">{n.title}</div>
                                {n.message && (
                                  <div className="text-slate text-xs mt-1 leading-relaxed">{n.message}</div>
                                )}
                                <div className="text-mono text-[0.65rem] text-slate uppercase tracking-widest mt-2">
                                  {timeAgo(n.createdAt)}
                                </div>
                              </div>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User menu */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setUserOpen((o) => !o)}
              className="flex items-center gap-2 px-2 py-1 hover:bg-ivory-soft transition-colors"
            >
              <span className="w-7 h-7 grid place-items-center bg-ink text-ivory text-mono text-xs">
                {user?.avatar?.url ? (
                  <img src={user.avatar.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  initials(`${user?.firstName || ''} ${user?.lastName || ''}`)
                )}
              </span>
              <div className="hidden md:block text-left">
                <div className="text-xs leading-tight">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-mono text-[0.6rem] text-slate uppercase tracking-widest leading-tight">
                  {ROLE_LABELS[user?.role] || humanize(user?.role || '')}
                </div>
              </div>
              <ChevronDown
                size={12}
                strokeWidth={1.5}
                className={cn('text-slate transition-transform hidden md:block', userOpen && 'rotate-180')}
              />
            </button>
            <AnimatePresence>
              {userOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-surface border border-hairline shadow-xl"
                >
                  <div className="p-4 border-b border-hairline">
                    <div className="text-sm truncate">
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className="text-mono text-xs text-slate truncate mt-0.5">{user?.email}</div>
                  </div>
                  <div className="p-1">
                    <Link
                      to="/settings"
                      onClick={() => setUserOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-ivory-soft transition-colors"
                    >
                      <User size={13} strokeWidth={1.5} />
                      Account settings
                    </Link>
                  </div>
                  <div className="p-1 border-t border-hairline">
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate hover:text-danger hover:bg-ivory-soft transition-colors text-left"
                    >
                      <LogOut size={13} strokeWidth={1.5} />
                      Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
