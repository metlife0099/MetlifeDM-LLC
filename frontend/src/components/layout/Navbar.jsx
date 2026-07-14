import { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowUpRight, ShoppingBag, User, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { toggleMobileMenu } from '@/store/index.js';
import { selectCartCount } from '@/store/selectors.js';
import { NAV_MAIN, SITE } from '@/utils/constants.js';
import { useScrollDirection, useScrollLock } from '@/hooks/index.js';
import { useAuth } from '@/hooks/useAuth.js';
import Button from '@/components/ui/Button.jsx';
import { cn, initials } from '@/utils/format.js';

// Routes whose hero section renders a full-bleed dark background image —
// the header floats transparent/light-text over them until the user
// scrolls past, then solidifies like everywhere else.
const DARK_HERO_ROUTES = new Set([
  '/', '/about', '/services', '/industries', '/portfolio', '/case-studies',
  '/pricing', '/blog', '/testimonials', '/faq', '/careers', '/contact', '/consultation',
]);

export default function Navbar() {
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const mobileOpen = useSelector((s) => s.ui.mobileMenuOpen);
  const cartCount = useSelector(selectCartCount);
  const { scrolled } = useScrollDirection();
  const { user, isAuthenticated, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  useScrollLock(mobileOpen);

  const isDarkHero = DARK_HERO_ROUTES.has(pathname);
  const floating = isDarkHero && !scrolled && !mobileOpen;

  useEffect(() => {
    dispatch(toggleMobileMenu(false));
    setUserMenuOpen(false);
  }, [pathname, dispatch]);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const onClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [userMenuOpen]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
        floating
          ? 'bg-transparent'
          : mobileOpen
            ? 'bg-ivory'
            : scrolled
              ? 'bg-ivory/80 backdrop-blur-xl border-b border-hairline shadow-[0_1px_0_0_rgba(10,23,48,0.04),0_12px_24px_-16px_rgba(10,23,48,0.15)]'
              : 'bg-ivory'
      )}
    >
      <div className="mx-auto max-w-[88rem] px-6 md:px-10 lg:px-14">
        <div className="flex h-20 items-center justify-between gap-8">
          {/* Wordmark */}
          <Link to="/" className="flex items-center gap-2 group" aria-label="Home">
            <span className={cn('text-display-sm font-medium transition-colors duration-500', floating ? 'text-ivory' : 'text-ink')}>
              {SITE.name}
              <span className={floating ? 'text-ultra-soft' : 'text-ultra'}>.</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {NAV_MAIN.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'text-sm relative py-2 transition-colors duration-500',
                    floating
                      ? active ? 'text-ivory' : 'text-ivory/65 hover:text-ivory'
                      : active ? 'text-ink' : 'text-ink/70 hover:text-ink link-underline'
                  )}
                >
                  {item.label}
                  {active && (
                    <motion.span
                      layoutId="nav-active-indicator"
                      className={cn('nav-indicator-glow absolute left-0 right-0 -bottom-0.5 h-0.5', floating ? 'bg-ivory' : 'bg-ultra')}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Cart */}
            <Link
              to="/cart"
              className={cn(
                'relative p-2 -m-2 transition-colors duration-500',
                floating ? 'text-ivory/80 hover:text-ivory' : 'text-ink/70 hover:text-ink'
              )}
              aria-label="Cart"
            >
              <ShoppingBag size={18} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-ultra text-ivory text-mono text-[0.6rem] font-medium w-4 h-4 grid place-items-center rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User menu / login */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 group py-1"
                  aria-label="Account menu"
                >
                  <span className={cn(
                    'w-8 h-8 grid place-items-center text-mono text-xs transition-colors duration-500',
                    floating ? 'bg-ivory text-ink' : 'bg-ink text-ivory'
                  )}>
                    {user?.avatar?.url ? (
                      <img src={user.avatar.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      initials(`${user?.firstName || ''} ${user?.lastName || ''}`)
                    )}
                  </span>
                  <ChevronDown
                    size={14}
                    strokeWidth={1.5}
                    className={cn(
                      'transition-transform',
                      floating ? 'text-ivory/70' : 'text-slate',
                      userMenuOpen && 'rotate-180'
                    )}
                  />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-64 bg-ivory border border-hairline shadow-lg"
                    >
                      <div className="p-4 border-b border-hairline">
                        <div className="text-sm text-ink truncate">
                          {user?.firstName} {user?.lastName}
                        </div>
                        <div className="text-mono text-xs text-slate truncate mt-1">{user?.email}</div>
                      </div>
                      <div className="p-2">
                        <Link
                          to="/dashboard"
                          className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-sand transition-colors"
                        >
                          <LayoutDashboard size={14} strokeWidth={1.5} />
                          Dashboard
                        </Link>
                        <Link
                          to="/dashboard/profile"
                          className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-sand transition-colors"
                        >
                          <User size={14} strokeWidth={1.5} />
                          Profile
                        </Link>
                        <Link
                          to="/dashboard/orders"
                          className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-sand transition-colors"
                        >
                          <ShoppingBag size={14} strokeWidth={1.5} />
                          Orders
                        </Link>
                      </div>
                      <div className="p-2 border-t border-hairline">
                        <button
                          onClick={() => { setUserMenuOpen(false); logout(); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate hover:text-danger hover:bg-sand transition-colors text-left"
                        >
                          <LogOut size={14} strokeWidth={1.5} />
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/login"
                className={cn(
                  'text-sm transition-colors duration-500',
                  floating ? 'text-ivory/80 hover:text-ivory' : 'text-ink/70 hover:text-ink link-underline'
                )}
              >
                Log in
              </Link>
            )}

            <Button to="/consultation" size="md" variant={floating ? 'inverse' : 'primary'}>
              Book a call
              <ArrowUpRight size={14} strokeWidth={1.5} />
            </Button>
          </div>

          {/* Mobile toggle */}
          <div className="lg:hidden flex items-center gap-2">
            <Link
              to="/cart"
              className={cn('relative p-2 transition-colors duration-500', floating ? 'text-ivory/80' : 'text-ink/70')}
              aria-label="Cart"
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-ultra text-ivory text-mono text-[0.6rem] w-4 h-4 grid place-items-center rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => dispatch(toggleMobileMenu())}
              className={cn('p-2 -mr-2 transition-colors duration-500', floating ? 'text-ivory' : 'text-ink')}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} strokeWidth={1.25} /> : <Menu size={22} strokeWidth={1.25} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden fixed inset-x-0 top-20 bottom-0 bg-ivory z-40 overflow-y-auto"
          >
            <div className="px-6 py-8 flex flex-col divide-editorial">
              {NAV_MAIN.map((item, i) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="flex items-center justify-between py-5 group"
                  >
                    <span className={cn('text-display-sm transition-colors', active ? 'text-ultra' : 'text-ink group-hover:text-ultra')}>
                      {item.label}
                    </span>
                    <span className={cn('num-plate text-xs transition-colors', active ? 'text-ultra' : 'text-slate')}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </Link>
                );
              })}
              <Link to="/contact" className="flex items-center justify-between py-5 group">
                <span className={cn('text-display-sm transition-colors', pathname.startsWith('/contact') ? 'text-ultra' : 'text-ink group-hover:text-ultra')}>
                  Contact
                </span>
                <span className={cn('num-plate text-xs transition-colors', pathname.startsWith('/contact') ? 'text-ultra' : 'text-slate')}>
                  {String(NAV_MAIN.length + 1).padStart(2, '0')}
                </span>
              </Link>
            </div>
            <div className="px-6 pb-6 space-y-3 border-t border-hairline pt-6">
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="flex items-center gap-3 py-3 text-sm">
                    <LayoutDashboard size={16} strokeWidth={1.5} />
                    Dashboard
                  </Link>
                  <button
                    onClick={logout}
                    className="flex items-center gap-3 py-3 text-sm text-danger w-full"
                  >
                    <LogOut size={16} strokeWidth={1.5} />
                    Sign out
                  </button>
                </>
              ) : (
                <div className="flex gap-3">
                  <Link
                    to="/login"
                    className="flex-1 py-3 text-center text-mono text-xs uppercase tracking-widest border border-hairline hover:border-ink transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="flex-1 py-3 text-center text-mono text-xs uppercase tracking-widest bg-ink text-ivory"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
            <div className="px-6 pb-10">
              <Button to="/consultation" className="w-full" size="lg">
                Book a free consultation
                <ArrowUpRight size={16} strokeWidth={1.5} />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
