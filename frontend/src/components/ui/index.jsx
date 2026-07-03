import { forwardRef } from 'react';
import { cn } from '@/utils/format.js';

/* --------------------- Card --------------------- */
export const Card = ({ className, hover = false, children, ...rest }) => (
  <div
    className={cn(
      'bg-ivory-soft border border-hairline p-6 md:p-8 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
      hover && 'hover:border-ink hover:-translate-y-1 hover:shadow-[0_24px_60px_-20px_rgba(10,23,48,0.25)]',
      className
    )}
    {...rest}
  >
    {children}
  </div>
);

/* --------------------- Input --------------------- */
const inputBase =
  'w-full bg-transparent border-b border-ink/25 pb-2 pt-4 text-sm placeholder:text-slate transition-colors duration-300 focus:border-ultra focus:outline-none disabled:opacity-40';

export const Input = forwardRef(function Input({ label, error, className, id, ...rest }, ref) {
  const inputId = id || rest.name;
  return (
    <label className="block group">
      {label && (
        <span className="text-eyebrow block mb-1 group-focus-within:text-ultra transition-colors">
          {label}
        </span>
      )}
      <input ref={ref} id={inputId} className={cn(inputBase, error && 'border-danger', className)} {...rest} />
      {error && <span className="text-mono text-xs text-danger mt-1 block">{error}</span>}
    </label>
  );
});

export const Textarea = forwardRef(function Textarea({ label, error, rows = 4, className, ...rest }, ref) {
  return (
    <label className="block group">
      {label && (
        <span className="text-eyebrow block mb-1 group-focus-within:text-ultra transition-colors">
          {label}
        </span>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={cn(inputBase, 'resize-none', error && 'border-danger', className)}
        {...rest}
      />
      {error && <span className="text-mono text-xs text-danger mt-1 block">{error}</span>}
    </label>
  );
});

export const Select = forwardRef(function Select({ label, error, options = [], className, ...rest }, ref) {
  return (
    <label className="block group">
      {label && (
        <span className="text-eyebrow block mb-1 group-focus-within:text-ultra transition-colors">
          {label}
        </span>
      )}
      <select
        ref={ref}
        className={cn(inputBase, 'cursor-pointer appearance-none pr-8', error && 'border-danger', className)}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <span className="text-mono text-xs text-danger mt-1 block">{error}</span>}
    </label>
  );
});

/* --------------------- Checkbox --------------------- */
export const Checkbox = forwardRef(function Checkbox({ label, error, className, ...rest }, ref) {
  return (
    <label className={cn('flex items-start gap-3 cursor-pointer group', className)}>
      <input
        ref={ref}
        type="checkbox"
        className="mt-1 h-4 w-4 accent-ultra cursor-pointer"
        {...rest}
      />
      <span className="text-sm text-ink/80 leading-snug group-hover:text-ink transition-colors">{label}</span>
      {error && <span className="text-mono text-xs text-danger block">{error}</span>}
    </label>
  );
});

/* --------------------- Badge --------------------- */
export const Badge = ({ children, tone = 'default', className }) => {
  const tones = {
    default: 'bg-ivory border border-hairline text-ink',
    ultra: 'bg-ultra-tint text-ultra border border-ultra/20',
    ink: 'bg-ink text-ivory',
    outline: 'border border-ink text-ink',
    success: 'bg-success/10 text-success border border-success/20',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 text-mono text-[0.65rem] uppercase tracking-widest rounded-full',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
};

/* --------------------- Spinner --------------------- */
export const Spinner = ({ size = 24, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={cn('animate-spin', className)}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" />
    <path
      d="M21 12a9 9 0 0 1-9 9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

/* --------------------- Full-page loader --------------------- */
export const PageLoader = ({ label = 'Loading' }) => (
  <div className="fixed inset-0 grid place-items-center bg-ivory z-[100]">
    <div className="flex flex-col items-center gap-4">
      <Spinner size={32} className="text-ultra" />
      <span className="text-eyebrow">{label}</span>
    </div>
  </div>
);
