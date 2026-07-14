import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * Debounced value.
 */
export const useDebounce = (value, delay = 400) => {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
};

/**
 * IntersectionObserver — reveal-on-scroll.
 * Attach `ref` to any element; sets `data-visible="true"` when visible.
 */
export const useInView = ({ threshold = 0.15, once = true } = {}) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) io.disconnect();
        } else if (!once) setVisible(false);
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, once]);
  useEffect(() => {
    if (ref.current) ref.current.dataset.visible = visible ? 'true' : 'false';
  }, [visible]);
  return [ref, visible];
};

/**
 * Media query.
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = (e) => setMatches(e.matches);
    mq.addEventListener('change', on);
    setMatches(mq.matches);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return matches;
};

/**
 * Scroll direction (up / down).
 */
export const useScrollDirection = (threshold = 8) => {
  const [dir, setDir] = useState('up');
  const [scrolled, setScrolled] = useState(false);
  const last = useRef(typeof window !== 'undefined' ? window.scrollY : 0);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      if (Math.abs(y - last.current) < threshold) return;
      setDir(y > last.current ? 'down' : 'up');
      last.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return { dir, scrolled };
};

/**
 * Persistent localStorage state.
 */
export const useLocalStorage = (key, initial) => {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw != null ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  const set = useCallback(
    (val) => {
      setState((prev) => {
        const next = typeof val === 'function' ? val(prev) : val;
        localStorage.setItem(key, JSON.stringify(next));
        return next;
      });
    },
    [key]
  );
  return [state, set];
};

/**
 * Escape key handler (for modals / drawers).
 */
export const useEscape = (handler, active = true) => {
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => e.key === 'Escape' && handler(e);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [handler, active]);
};

/**
 * Scroll lock (for modals / mobile menu).
 */
export const useScrollLock = (locked) => {
  useEffect(() => {
    if (!locked) return;
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, [locked]);
};
