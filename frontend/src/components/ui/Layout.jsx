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

export const Eyebrow = ({ number, children, className }) => (
  <div className={cn('flex items-center gap-3 text-eyebrow', className)}>
    {number && <span className="num-plate text-ink">{number}</span>}
    <span className="h-px w-8 bg-current opacity-40" />
    <span>{children}</span>
  </div>
);
