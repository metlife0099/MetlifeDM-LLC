import { useEffect, useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { closeCookieSettings, setCookiePreferences } from '@/store/index.js';
import Button from '@/components/ui/Button.jsx';

export default function CookieBanner() {
  const dispatch = useDispatch();
  const open = useSelector((state) => state.ui.cookieBannerOpen);
  const saved = useSelector((state) => state.ui.cookiePreferences);
  const [customizing, setCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(saved?.analytics === true);
  const [marketing, setMarketing] = useState(saved?.marketing === true);
  const headingId = useId();

  useEffect(() => {
    if (!open) return;
    setAnalytics(saved?.analytics === true);
    setMarketing(saved?.marketing === true);
    setCustomizing(Boolean(saved));
  }, [open, saved]);

  const save = (preferences) => dispatch(setCookiePreferences(preferences));

  return (
    <AnimatePresence>
      {open && (
        <motion.section
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          role="region"
          aria-labelledby={headingId}
          className="fixed inset-x-3 bottom-3 z-60 mx-auto max-w-2xl border border-ivory/15 bg-ink p-5 text-ivory shadow-2xl sm:inset-x-6 sm:p-6"
        >
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 id={headingId} className="text-eyebrow text-ivory/60">Your privacy choices</h2>
              <p className="mt-2 text-sm leading-relaxed text-ivory/80">
                Essential storage keeps the site secure and working. Analytics and marketing technologies are
                optional and stay off unless you allow them. Read our{' '}
                <Link to="/cookies" className="link-underline text-ivory">cookie policy</Link>.
              </p>
            </div>
            {saved && (
              <button
                type="button"
                onClick={() => dispatch(closeCookieSettings())}
                className="shrink-0 text-mono text-xs uppercase tracking-widest text-ivory/70 hover:text-ivory"
                aria-label="Close cookie settings"
              >
                Close
              </button>
            )}
          </div>

          {customizing && (
            <fieldset className="mt-5 grid gap-3 border-y border-ivory/15 py-4 sm:grid-cols-3">
              <legend className="sr-only">Cookie categories</legend>
              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" checked disabled className="mt-0.5 h-4 w-4 accent-ultra" />
                <span><strong className="block">Essential</strong><span className="text-ivory/60">Always on</span></span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(event) => setAnalytics(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-ultra"
                />
                <span><strong className="block">Analytics</strong><span className="text-ivory/60">Traffic measurement</span></span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(event) => setMarketing(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-ultra"
                />
                <span><strong className="block">Marketing</strong><span className="text-ivory/60">Campaign measurement</span></span>
              </label>
            </fieldset>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <Button variant="inverse" size="sm" onClick={() => save({ analytics: true, marketing: true })}>
              Accept all
            </Button>
            <Button variant="ghost" size="sm" className="border-ivory/25 text-ivory" onClick={() => save({ analytics: false, marketing: false })}>
              Essential only
            </Button>
            {customizing ? (
              <Button variant="ghost" size="sm" className="border-ivory/25 text-ivory" onClick={() => save({ analytics, marketing })}>
                Save choices
              </Button>
            ) : (
              <button
                type="button"
                onClick={() => setCustomizing(true)}
                className="px-2 text-mono text-xs uppercase tracking-widest text-ivory/70 hover:text-ivory"
              >
                Customize
              </button>
            )}
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
