import { Link, NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Icons from 'lucide-react';
import { NAV_SECTIONS, NAV_NOTIFICATION_TYPES, SITE } from '@/utils/constants.js';
import { notificationsApi } from '@/api/index.js';
import { cn } from '@/utils/format.js';

export default function Sidebar({ mobile = false, onNavigate }) {
  const collapsed = useSelector((s) => (mobile ? false : s.ui.sidebarCollapsed));
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notifications', 'byType'],
    queryFn: () => notificationsApi.unreadCountByType(),
    refetchInterval: 60_000,
  });
  // unwrap() flattens { byType: {...} } down to the inner object directly
  // whenever that inner value is itself an object — so `data` here already
  // *is* the counts map, not a wrapper around it.
  const byType = data || {};

  const markRead = useMutation({
    mutationFn: (resourceType) => notificationsApi.markReadByType(resourceType),
  });

  const handleNavClick = (item) => {
    onNavigate?.();
    const resourceType = NAV_NOTIFICATION_TYPES[item.href];
    if (resourceType && byType[resourceType] > 0) {
      qc.setQueryData(['notifications', 'byType'], (prev) => ({
        ...(prev || {}),
        [resourceType]: 0,
      }));
      markRead.mutate(resourceType, {
        onSettled: () => {
          qc.invalidateQueries({ queryKey: ['notifications'] });
        },
      });
    }
  };

  return (
    <aside
      className={cn(
        'bg-ink text-ivory flex flex-col h-full transition-all duration-300 ease-editorial',
        mobile ? 'w-full' : collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Wordmark */}
      <div className="px-5 py-6 border-b border-ivory/10">
        <Link to="/dashboard" className="flex items-center gap-2" onClick={onNavigate}>
          <span className="text-display-sm font-medium text-ivory">
            {collapsed && !mobile ? 'M' : SITE.name}
            <span className="text-ultra">.</span>
          </span>
        </Link>
        {!collapsed && (
          <div className="text-eyebrow text-ivory/40 mt-1">Admin console</div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-6">
        {NAV_SECTIONS.map((sec) => (
          <div key={sec.section} className="px-3">
            {!collapsed && (
              <div className="text-eyebrow text-ivory/40 px-3 mb-2 text-[0.6rem]">
                {sec.section}
              </div>
            )}
            <div className="space-y-0.5">
              {sec.items.map((item) => {
                const Icon = Icons[item.icon] || Icons.Circle;
                const resourceType = NAV_NOTIFICATION_TYPES[item.href];
                const count = resourceType ? byType[resourceType] || 0 : 0;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={() => handleNavClick(item)}
                    end={item.href === '/dashboard'}
                    className={({ isActive }) =>
                      cn(
                        'sidebar-link relative',
                        isActive && 'sidebar-link-active',
                        collapsed && !mobile && 'justify-center gap-0'
                      )
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="relative shrink-0">
                      <Icon size={15} strokeWidth={1.5} />
                      {count > 0 && collapsed && !mobile && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[0.9rem] h-[0.9rem] px-0.5 grid place-items-center bg-ultra text-ivory text-mono text-[0.55rem] leading-none rounded-full">
                          {count > 9 ? '9+' : count}
                        </span>
                      )}
                    </span>
                    {!collapsed && <span className="truncate flex-1">{item.label}</span>}
                    {!collapsed && count > 0 && (
                      <span className="text-mono text-[0.6rem] leading-none bg-ultra text-ivory rounded-full min-w-[1.1rem] h-[1.1rem] grid place-items-center px-1 shrink-0">
                        {count > 99 ? '99+' : count}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-ivory/10">
        <a
          href={SITE.publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="sidebar-link"
        >
          <Icons.ExternalLink size={15} strokeWidth={1.5} />
          {!collapsed && 'View public site'}
        </a>
      </div>
    </aside>
  );
}
