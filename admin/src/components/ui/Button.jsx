import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/format.js';

const VARIANTS = {
  primary: 'bg-ink text-ivory hover:bg-graphite border border-ink',
  ultra: 'bg-ultra text-ivory hover:bg-ultra-hover border border-ultra',
  ghost: 'bg-transparent text-ink border border-hairline-strong hover:border-ink hover:bg-ivory-soft',
  outline: 'bg-transparent text-ink border border-ink hover:bg-ink hover:text-ivory',
  danger: 'bg-danger text-ivory hover:bg-danger/90 border border-danger',
  danger_ghost: 'bg-transparent text-danger border border-danger/30 hover:bg-danger/5',
  subtle: 'bg-ivory-soft text-ink hover:bg-sand border border-transparent',
  link: 'bg-transparent text-ink underline-offset-4 hover:underline border border-transparent px-0',
};

const SIZES = {
  xs: 'text-[0.65rem] uppercase tracking-widest px-2.5 py-1 font-mono',
  sm: 'text-xs uppercase tracking-widest px-3.5 py-1.5 font-mono',
  md: 'text-xs uppercase tracking-widest px-5 py-2.5 font-mono',
  lg: 'text-xs uppercase tracking-widest px-6 py-3 font-mono',
};

const Button = forwardRef(
  (
    {
      variant = 'primary',
      size = 'md',
      to,
      href,
      children,
      className,
      loading,
      disabled,
      icon: Icon,
      iconRight: IconRight,
      as,
      ...props
    },
    ref
  ) => {
    const classes = cn(
      'inline-flex items-center justify-center gap-2 rounded-none transition-all duration-200 select-none whitespace-nowrap',
      VARIANTS[variant],
      SIZES[size],
      (disabled || loading) && 'opacity-50 cursor-not-allowed pointer-events-none',
      className
    );

    const content = (
      <>
        {Icon && <Icon size={14} strokeWidth={1.5} />}
        {loading ? 'Loading…' : children}
        {IconRight && <IconRight size={14} strokeWidth={1.5} />}
      </>
    );

    if (to) {
      return (
        <Link ref={ref} to={to} className={classes} {...props}>
          {content}
        </Link>
      );
    }
    if (href || as === 'a') {
      return (
        <a ref={ref} href={href} className={classes} {...props}>
          {content}
        </a>
      );
    }
    return (
      <button ref={ref} className={classes} disabled={disabled || loading} {...props}>
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
