import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SITE, TICKER_ITEMS } from '@/utils/constants.js';

/**
 * Split layout for auth pages: wordmark + form on the left,
 * editorial content on the right.
 */
export default function AuthLayout() {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] bg-ivory">
      {/* Left: form panel */}
      <div className="flex flex-col p-8 md:p-14">
        <Link to="/" className="text-display-sm text-ink font-medium inline-block">
          {SITE.name}
          <span className="text-ultra">.</span>
        </Link>
        <div className="flex-1 grid place-items-center py-14">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
        <div className="text-mono text-xs text-slate">
          © {new Date().getFullYear()} {SITE.legalName}
        </div>
      </div>

      {/* Right: editorial panel */}
      <div className="hidden lg:flex bg-ink text-ivory p-14 flex-col justify-between relative overflow-hidden">
        <div className="text-eyebrow text-ivory/50">
          Est. 2013 / Miami
        </div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="text-display-lg text-ivory">
            Growth is a<br />
            <span className="text-italic-fraunces text-ultra-soft">discipline,</span>
            <br />not a lottery.
          </h2>
          <p className="mt-8 text-ivory/60 max-w-md leading-relaxed">
            Log in to your dashboard to review orders, invoices, and open tickets — or create an account to book your first strategy call.
          </p>
        </motion.div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-mono text-xs uppercase tracking-widest">
          {TICKER_ITEMS.slice(0, 6).map((t) => (
            <div key={t} className="text-ivory/50">
              <span className="text-ultra-soft mr-2">·</span>
              {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
