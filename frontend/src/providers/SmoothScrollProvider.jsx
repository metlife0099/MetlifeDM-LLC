import { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';

export default function SmoothScrollProvider({ children }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 0.9,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      smoothTouch: false,
      wheelMultiplier: 0.9,
      touchMultiplier: 1,
      normalizeWheel: true,
      infinite: false,
    });

    document.documentElement.classList.add('lenis');
    document.documentElement.classList.add('lenis-smooth');

    let rafId = null;

    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };

    rafId = requestAnimationFrame(raf);

    const handleResize = () => {
      lenis.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);

      document.documentElement.classList.remove('lenis');
      document.documentElement.classList.remove('lenis-smooth');

      lenis.destroy();
    };
  }, []);

  return children;
}