import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils/format.js';
import { useEscape, useScrollLock } from '@/hooks/index.js';
import Button from './Button.jsx';
import { useEffect, useId, useRef } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/* ————— Modal ————— */
export function Modal({ open, onClose, title, description, children, size = 'md', footer, className }) {
  useEscape(onClose, open);
  useScrollLock(open);
  const dialogRef = useRef(null);
  const previousFocus = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return undefined;
    previousFocus.current = document.activeElement;
    const frame = window.requestAnimationFrame(() => {
      const first = dialogRef.current?.querySelector(FOCUSABLE);
      (first || dialogRef.current)?.focus();
    });
    const trapFocus = (event) => {
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll(FOCUSABLE)];
      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', trapFocus);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', trapFocus);
      previousFocus.current?.focus?.();
    };
  }, [open]);

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-100 bg-ink/60 backdrop-blur-sm cursor-pointer"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-100 grid place-items-center p-4 pointer-events-none">
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? titleId : undefined}
              aria-describedby={description ? descriptionId : undefined}
              tabIndex={-1}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'w-full bg-ivory border border-hairline shadow-[0_32px_64px_-24px_rgba(10,23,48,0.5)] pointer-events-auto',
                sizes[size],
                className
              )}
            >
              {(title || onClose) && (
                <div className="flex items-start justify-between gap-4 p-6 border-b border-hairline">
                  <div>
                    {title && <h2 id={titleId} className="text-display-sm">{title}</h2>}
                    {description && (
                      <p id={descriptionId} className="text-slate text-sm mt-1.5 leading-relaxed">{description}</p>
                    )}
                  </div>
                  {onClose && (
                    <button
                      onClick={onClose}
                      className="text-slate hover:text-ink p-1 -m-1 shrink-0 cursor-pointer"
                      aria-label="Close"
                    >
                      <X size={18} strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              )}
              <div className="p-6">{children}</div>
              {footer && (
                <div className="p-6 pt-0 flex items-center justify-end gap-3 border-t border-hairline mt-6 pt-6">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ————— Confirm dialog ————— */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  loading,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description} size="sm">
      <div className="flex items-center justify-end gap-3">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={variant} size="sm" onClick={onConfirm} disabled={loading}>
          {loading ? 'Please wait…' : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
