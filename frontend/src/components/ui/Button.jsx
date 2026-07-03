import { forwardRef } from 'react';
import { cn } from '@/utils/format.js';
import { Link } from 'react-router-dom';

const base =
  'inline-flex items-center justify-center gap-2 font-medium text-sm transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap';

const variants = {
  primary:
    'bg-ink text-ivory hover:bg-ultra hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-12px_rgba(21,71,255,0.5)]',
  ultra:
    'bg-ultra text-ivory hover:bg-ink hover:-translate-y-0.5',
  ghost:
    'text-ink hover:bg-ink hover:text-ivory border border-hairline',
  outline:
    'border border-ink text-ink hover:bg-ink hover:text-ivory',
  underline:
    'text-ink relative after:absolute after:left-0 after:bottom-0 after:h-px after:w-full after:bg-current after:origin-right after:scale-x-100 hover:after:origin-left after:transition-transform',
  inverse:
    'bg-ivory text-ink hover:bg-ultra hover:text-ivory',
};

const sizes = {
  sm: 'px-4 py-2 text-xs rounded-sm',
  md: 'px-6 py-3 text-sm rounded-sm',
  lg: 'px-8 py-4 text-base rounded-sm',
  xl: 'px-10 py-5 text-base rounded-sm',
};

const Button = forwardRef(function Button(
  { as = 'button', to, href, variant = 'primary', size = 'md', className, children, ...rest },
  ref
) {
  const cls = cn(base, variants[variant], sizes[size], className);
  if (to) {
    return (
      <Link ref={ref} to={to} className={cls} {...rest}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a ref={ref} href={href} className={cls} {...rest}>
        {children}
      </a>
    );
  }
  const Component = as;
  return (
    <Component ref={ref} className={cls} {...rest}>
      {children}
    </Component>
  );
});

export default Button;
