import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { acceptCookies } from '@/store/index.js';
import Button from '@/components/ui/Button.jsx';

export default function CookieBanner() {
  const dispatch = useDispatch();
  const accepted = useSelector((s) => s.ui.cookieAccepted);
  if (accepted) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-4 left-4 z-40 max-w-md bg-ink text-ivory p-5 border border-ivory/15 shadow-2xl"
      >
        <div className="text-eyebrow text-ivory/50 mb-2">Cookies</div>
        <p className="text-sm text-ivory/80 mb-4 leading-relaxed">
          We use cookies to improve your experience, analyze traffic, and personalize content. Read our{' '}
          <a href="/privacy" className="link-underline">
            privacy policy
          </a>
          .
        </p>
        <div className="flex gap-3">
          <Button
            variant="inverse"
            size="sm"
            onClick={() => dispatch(acceptCookies())}
          >
            Accept all
          </Button>
          <Button variant="ghost" size="sm" onClick={() => dispatch(acceptCookies())}>
            Essential only
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
