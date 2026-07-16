import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/format.js';

/**
 * Horizontally scrollable tab/filter row with left/right arrow buttons.
 * The scrollbar itself stays hidden (see `.scrollbar-hide` in index.css);
 * the arrows are the only visible affordance that more items exist off-screen.
 */
export default function ScrollTabs({ children, className, trackClassName }) {
  const trackRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    measure();
    const el = trackRef.current;
    if (!el) return undefined;
    el.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measure, children]);

  const scroll = (dir) => trackRef.current?.scrollBy({ left: dir * 280, behavior: 'smooth' });

  return (
    <div className={cn('relative flex items-center gap-2', className)}>
      <button
        type="button"
        aria-label="Scroll left"
        onClick={() => scroll(-1)}
        tabIndex={canLeft ? 0 : -1}
        className={cn(
          'hidden md:grid shrink-0 w-8 h-8 place-items-center border border-hairline bg-ivory hover:border-ink hover:bg-ink hover:text-ivory transition-all duration-300',
          canLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        <ChevronLeft size={14} strokeWidth={1.75} />
      </button>

      <div ref={trackRef} className={cn('min-w-0 flex-1 overflow-x-auto scrollbar-hide', trackClassName)}>
        <div className="flex gap-2 min-w-max">{children}</div>
      </div>

      <button
        type="button"
        aria-label="Scroll right"
        onClick={() => scroll(1)}
        tabIndex={canRight ? 0 : -1}
        className={cn(
          'hidden md:grid shrink-0 w-8 h-8 place-items-center border border-hairline bg-ivory hover:border-ink hover:bg-ink hover:text-ivory transition-all duration-300',
          canRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        <ChevronRight size={14} strokeWidth={1.75} />
      </button>
    </div>
  );
}
