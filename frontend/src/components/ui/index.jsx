import { forwardRef, useId } from 'react';
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

export const Input = forwardRef(function Input({ label, error, className, id, 'aria-describedby': describedBy, ...rest }, ref) {
  const generatedId = useId();
  const inputId = id || rest.name || generatedId;
  const errorId = `${inputId}-error`;
  return (
    <label htmlFor={inputId} className="block group">
      {label && (
        <span className="text-eyebrow block mb-1 group-focus-within:text-ultra transition-colors">
          {label}
        </span>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={[describedBy, error ? errorId : null].filter(Boolean).join(' ') || undefined}
        className={cn(inputBase, error && 'border-danger', className)}
        {...rest}
      />
      {error && <span id={errorId} role="alert" className="text-mono text-xs text-danger mt-1 block">{error}</span>}
    </label>
  );
});

export const Textarea = forwardRef(function Textarea({ label, error, rows = 4, className, id, 'aria-describedby': describedBy, ...rest }, ref) {
  const generatedId = useId();
  const inputId = id || rest.name || generatedId;
  const errorId = `${inputId}-error`;
  return (
    <label htmlFor={inputId} className="block group">
      {label && (
        <span className="text-eyebrow block mb-1 group-focus-within:text-ultra transition-colors">
          {label}
        </span>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={[describedBy, error ? errorId : null].filter(Boolean).join(' ') || undefined}
        className={cn(inputBase, 'resize-none', error && 'border-danger', className)}
        {...rest}
      />
      {error && <span id={errorId} role="alert" className="text-mono text-xs text-danger mt-1 block">{error}</span>}
    </label>
  );
});

export const Select = forwardRef(function Select({ label, error, options = [], className, id, 'aria-describedby': describedBy, ...rest }, ref) {
  const generatedId = useId();
  const inputId = id || rest.name || generatedId;
  const errorId = `${inputId}-error`;
  return (
    <label htmlFor={inputId} className="block group">
      {label && (
        <span className="text-eyebrow block mb-1 group-focus-within:text-ultra transition-colors">
          {label}
        </span>
      )}
      <select
        ref={ref}
        id={inputId}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={[describedBy, error ? errorId : null].filter(Boolean).join(' ') || undefined}
        className={cn(inputBase, 'cursor-pointer appearance-none pr-8', error && 'border-danger', className)}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <span id={errorId} role="alert" className="text-mono text-xs text-danger mt-1 block">{error}</span>}
    </label>
  );
});

/* --------------------- Checkbox --------------------- */
export const Checkbox = forwardRef(function Checkbox({ label, error, className, id, 'aria-describedby': describedBy, ...rest }, ref) {
  const generatedId = useId();
  const inputId = id || rest.name || generatedId;
  const errorId = `${inputId}-error`;
  return (
    <div className={className}>
      <label htmlFor={inputId} className="flex items-start gap-3 cursor-pointer group">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={[describedBy, error ? errorId : null].filter(Boolean).join(' ') || undefined}
          className="mt-1 h-4 w-4 accent-ultra cursor-pointer"
          {...rest}
        />
        <span className="text-sm text-ink/80 leading-snug group-hover:text-ink transition-colors">{label}</span>
      </label>
      {error && <span id={errorId} role="alert" className="text-mono text-xs text-danger mt-1 block">{error}</span>}
    </div>
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
    danger: 'bg-danger/10 text-danger border border-danger/20',
    warn: 'bg-warn/10 text-warn border border-warn/20',
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
    aria-hidden="true"
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
  <div className="fixed inset-0 grid place-items-center bg-ivory z-[100]" role="status" aria-live="polite">
    <div className="flex flex-col items-center gap-4">
      <Spinner size={32} className="text-ultra" />
      <span className="text-eyebrow">{label}</span>
    </div>
  </div>
);

/* --------------------- Query error --------------------- */
export const QueryError = ({
  title = 'We could not load this content.',
  message = 'Check your connection and try again.',
  onRetry,
  compact = false,
}) => (
  <div role="alert" className={cn('border border-danger/30 bg-danger/5 text-center', compact ? 'p-5' : 'px-6 py-14')}>
    <h2 className={compact ? 'text-base font-medium' : 'text-display-sm'}>{title}</h2>
    <p className="mx-auto mt-2 max-w-lg text-sm text-slate">{message}</p>
    {onRetry && (
      <button type="button" onClick={onRetry} className="mt-5 border border-ink px-4 py-2 text-mono text-xs uppercase tracking-widest hover:bg-ink hover:text-ivory">
        Try again
      </button>
    )}
  </div>
);
