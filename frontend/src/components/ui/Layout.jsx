import { cn } from '@/utils/format.js';

export const Container = ({ className, children, wide = false, ...rest }) => (
  <div
    className={cn('mx-auto w-full px-6 md:px-10 lg:px-14', wide ? 'max-w-[110rem]' : 'max-w-[88rem]', className)}
    {...rest}
  >
    {children}
  </div>
);

export const Section = ({
  className,
  children,
  tone = 'ivory',
  divider = true,
  spacing = 'lg',
  ...rest
}) => {
  const tones = {
    ivory: 'bg-ivory text-ink',
    ivorySoft: 'bg-ivory-soft text-ink',
    sand: 'bg-sand text-ink',
    ink: 'bg-ink text-ivory',
  };
  const spaces = {
    sm: 'py-12 md:py-16',
    md: 'py-16 md:py-24',
    lg: 'py-20 md:py-32',
    xl: 'py-28 md:py-44',
  };
  return (
    <section
      className={cn(tones[tone], spaces[spacing], divider && tone === 'ivory' && 'border-t border-hairline', className)}
      {...rest}
    >
      {children}
    </section>
  );
};

export const Eyebrow = ({ number, children, className, light = false }) => (
  <div className={cn('flex items-center gap-3 text-eyebrow', light && 'text-ivory/70', className)}>
    {number && <span className={cn('num-plate', light ? 'text-ivory' : 'text-ink')}>{number}</span>}
    <span className="h-px w-8 bg-current opacity-40" />
    <span>{children}</span>
  </div>
);

/**
 * Full-bleed background image + gradient overlay for hero sections.
 * Place inside a `relative` Section (no `overflow-hidden` — this needs to
 * extend 80px above the Section's own box to reach behind the sticky,
 * transparent Navbar, which sits in normal document flow above it).
 * Wrap the actual content in `<Container className="relative z-10">`.
 */
export const HeroImage = ({ src, alt = '', overlay = 'dark', className }) => {
  const overlays = {
    dark: 'bg-linear-to-b from-ink/80 via-ink/60 to-ink/85',
    darkTop: 'bg-linear-to-b from-ink/90 via-ink/50 to-ink/70',
    fade: 'bg-linear-to-t from-ink via-ink/50 to-ink/20',
  };
  return (
    <div className={cn('absolute -top-20 inset-x-0 bottom-0 overflow-hidden', className)}>
      <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" loading="eager" />
      <div className={cn('absolute inset-0', overlays[overlay] || overlays.dark)} />
      {/* Guarantees the floating navbar stays legible regardless of how bright the source photo is up top */}
      <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-ink/70 to-transparent" />
    </div>
  );
};
