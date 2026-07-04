import { Link, NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import * as Icons from 'lucide-react';
import { NAV_SECTIONS, SITE } from '@/utils/constants.js';
import { cn } from '@/utils/format.js';

export default function Sidebar({ mobile = false, onNavigate }) {
  const collapsed = useSelector((s) => (mobile ? false : s.ui.sidebarCollapsed));

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
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={onNavigate}
                    end={item.href === '/dashboard'}
                    className={({ isActive }) =>
                      cn(
                        'sidebar-link',
                        isActive && 'sidebar-link-active',
                        collapsed && !mobile && 'justify-center gap-0'
                      )
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={15} strokeWidth={1.5} className="shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
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
