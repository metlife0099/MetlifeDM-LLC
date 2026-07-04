import { forwardRef, useState, useRef } from 'react';
import { Upload, X, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/format.js';

/* ————— Label ————— */
export const Label = ({ children, required, className, ...props }) => (
  <label
    className={cn(
      'block text-mono text-[0.65rem] uppercase tracking-widest text-slate mb-1.5',
      className
    )}
    {...props}
  >
    {children}
    {required && <span className="text-danger ml-0.5">*</span>}
  </label>
);

/* ————— Field wrapper ————— */
const Field = ({ label, required, error, hint, children }) => (
  <div>
    {label && <Label required={required}>{label}</Label>}
    {children}
    {error && <div className="text-mono text-xs text-danger mt-1.5">{error}</div>}
    {!error && hint && <div className="text-mono text-xs text-slate mt-1.5">{hint}</div>}
  </div>
);

/* ————— Input ————— */
export const Input = forwardRef(
  ({ label, required, error, hint, className, prefix, suffix, ...props }, ref) => (
    <Field label={label} required={required} error={error} hint={hint}>
      <div className={cn(
        'flex items-center border bg-surface transition-colors',
        error ? 'border-danger' : 'border-hairline-strong hover:border-slate focus-within:border-ultra'
      )}>
        {prefix && (
          <span className="pl-3 text-slate">{prefix}</span>
        )}
        <input
          ref={ref}
          className={cn(
            'flex-1 px-3 py-2 text-sm bg-transparent placeholder:text-slate-soft focus:outline-none',
            className
          )}
          {...props}
        />
        {suffix && <span className="pr-3 text-slate">{suffix}</span>}
      </div>
    </Field>
  )
);
Input.displayName = 'Input';

/* ————— Textarea ————— */
export const Textarea = forwardRef(
  ({ label, required, error, hint, className, ...props }, ref) => (
    <Field label={label} required={required} error={error} hint={hint}>
      <textarea
        ref={ref}
        className={cn(
          'w-full px-3 py-2 text-sm bg-surface border transition-colors placeholder:text-slate-soft focus:outline-none resize-none',
          error ? 'border-danger' : 'border-hairline-strong hover:border-slate focus:border-ultra',
          className
        )}
        rows={4}
        {...props}
      />
    </Field>
  )
);
Textarea.displayName = 'Textarea';

/* ————— Select ————— */
export const Select = forwardRef(
  ({ label, required, error, hint, options = [], className, ...props }, ref) => (
    <Field label={label} required={required} error={error} hint={hint}>
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'w-full appearance-none px-3 py-2 pr-9 text-sm bg-surface border transition-colors focus:outline-none',
            error ? 'border-danger' : 'border-hairline-strong hover:border-slate focus:border-ultra',
            className
          )}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          strokeWidth={1.5}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate pointer-events-none"
        />
      </div>
    </Field>
  )
);
Select.displayName = 'Select';

/* ————— Checkbox ————— */
export const Checkbox = forwardRef(({ label, error, ...props }, ref) => (
  <label className="inline-flex items-start gap-2.5 cursor-pointer select-none">
    <span className="relative mt-0.5">
      <input ref={ref} type="checkbox" className="peer sr-only" {...props} />
      <span
        className={cn(
          'block w-4 h-4 border transition-colors',
          'border-hairline-strong bg-surface peer-checked:bg-ultra peer-checked:border-ultra',
          error && 'border-danger'
        )}
      />
      <Check
        size={12}
        strokeWidth={3}
        className="absolute inset-0 m-auto text-ivory opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
      />
    </span>
    {label && <span className="text-sm text-ink leading-tight">{label}</span>}
  </label>
));
Checkbox.displayName = 'Checkbox';

/* ————— Switch ————— */
export const Switch = forwardRef(({ label, description, ...props }, ref) => (
  <label className="flex items-center justify-between gap-4 cursor-pointer select-none">
    <div className="flex-1">
      {label && <div className="text-sm text-ink">{label}</div>}
      {description && <div className="text-mono text-xs text-slate mt-1">{description}</div>}
    </div>
    <span className="relative shrink-0">
      <input ref={ref} type="checkbox" className="peer sr-only" {...props} />
      <span className="block w-9 h-5 bg-hairline-strong peer-checked:bg-ultra transition-colors rounded-full" />
      <span className="absolute top-0.5 left-0.5 w-4 h-4 bg-ivory rounded-full transition-transform peer-checked:translate-x-4" />
    </span>
  </label>
));
Switch.displayName = 'Switch';

/* ————— MultiSelect (simple chip-based) ————— */
export const MultiSelect = ({
  label,
  required,
  error,
  hint,
  options = [],
  value = [],
  onChange,
}) => {
  const toggle = (v) => {
    const next = value.includes(v) ? value.filter((x) => x !== v) : [...value, v];
    onChange?.(next);
  };
  return (
    <Field label={label} required={required} error={error} hint={hint}>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = value.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => toggle(o.value)}
              className={cn(
                'px-3 py-1.5 text-mono text-xs uppercase tracking-widest border transition-colors',
                active ? 'bg-ink text-ivory border-ink' : 'bg-surface text-ink border-hairline-strong hover:border-ink'
              )}
            >
              {o.icon && <span className="mr-1">{o.icon}</span>}
              {o.label}
            </button>
          );
        })}
      </div>
    </Field>
  );
};

/* ————— FileUpload ————— */
export const FileUpload = ({
  label,
  required,
  hint,
  accept,
  multiple = false,
  onChange,
  files = [],
  onRemove,
  error,
}) => {
  const ref = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const list = Array.from(e.dataTransfer.files || []);
    if (list.length) onChange?.(multiple ? list : list[0]);
  };

  return (
    <Field label={label} required={required} error={error} hint={hint}>
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={(e) => {
          const list = Array.from(e.target.files || []);
          if (list.length) onChange?.(multiple ? list : list[0]);
        }}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'w-full border border-dashed p-6 text-center transition-colors',
          dragOver ? 'border-ultra bg-ultra-tint' : 'border-hairline-strong hover:border-ink bg-surface'
        )}
      >
        <Upload size={20} strokeWidth={1.25} className="text-slate mx-auto mb-3" />
        <div className="text-mono text-xs uppercase tracking-widest">
          Drop {multiple ? 'files' : 'a file'} or click to browse
        </div>
        {accept && (
          <div className="text-mono text-[0.65rem] text-slate mt-1.5">{accept}</div>
        )}
      </button>

      {files?.length > 0 && (
        <div className="mt-3 space-y-2">
          {(Array.isArray(files) ? files : [files]).map((f, i) => (
            <div key={i} className="flex items-center justify-between border border-hairline p-3 bg-ivory-soft">
              <div className="min-w-0 flex-1">
                <div className="text-sm truncate">{f.name || f.url || 'File'}</div>
                {f.size && (
                  <div className="text-mono text-xs text-slate mt-0.5">
                    {(f.size / 1024).toFixed(0)} KB
                  </div>
                )}
              </div>
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  className="text-slate hover:text-danger p-1"
                  aria-label="Remove file"
                >
                  <X size={14} strokeWidth={1.5} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Field>
  );
};

/* ————— ImageUpload (single) ————— */
export const ImageUpload = ({ label, value, onChange, hint, error }) => {
  const ref = useRef(null);
  const url = value?.url || (typeof value === 'string' ? value : null);
  return (
    <Field label={label} error={error} hint={hint}>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onChange?.(file);
        }}
      />
      {url ? (
        <div className="relative w-full max-w-md border border-hairline bg-ivory-soft">
          <img src={url} alt="" className="w-full aspect-video object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-ink/70 p-3 flex items-center justify-between">
            <span className="text-mono text-xs text-ivory">Uploaded</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => ref.current?.click()}
                className="text-mono text-xs uppercase tracking-widest text-ivory hover:text-ultra-soft"
              >
                Change
              </button>
              <button
                type="button"
                onClick={() => onChange?.(null)}
                className="text-mono text-xs uppercase tracking-widest text-ivory hover:text-danger"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="w-full max-w-md aspect-video border border-dashed border-hairline-strong hover:border-ink bg-surface transition-colors flex flex-col items-center justify-center gap-2"
        >
          <Upload size={20} strokeWidth={1.25} className="text-slate" />
          <span className="text-mono text-xs uppercase tracking-widest text-slate">Upload image</span>
        </button>
      )}
    </Field>
  );
};

/* ————— Search input ————— */
export const SearchInput = ({ value, onChange, placeholder = 'Search…', className }) => (
  <div className={cn('relative', className)}>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className="w-full pl-9 pr-3 py-2 text-sm bg-surface border border-hairline-strong hover:border-slate focus:border-ultra focus:outline-none transition-colors placeholder:text-slate-soft"
    />
    <svg
      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  </div>
);
