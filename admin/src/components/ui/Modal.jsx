import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import { cn } from '@/utils/format.js';
import { useScrollLock } from '@/hooks/index.js';
import Button from './Button.jsx';

const dialogStack = [];
const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function useDialog(open, onClose) {
  const ref = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open || !ref.current) return undefined;
    const panel = ref.current;
    const previousFocus = document.activeElement;
    dialogStack.push(ref);

    const firstFocusable = panel.querySelector(focusableSelector);
    (firstFocusable || panel).focus();

    const onKeyDown = (event) => {
      if (dialogStack.at(-1) !== ref) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = [...panel.querySelectorAll(focusableSelector)].filter(
        (element) => element.getClientRects().length > 0
      );
      if (!focusable.length) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      const index = dialogStack.lastIndexOf(ref);
      if (index >= 0) dialogStack.splice(index, 1);
      if (previousFocus instanceof HTMLElement && document.contains(previousFocus)) {
        previousFocus.focus();
      }
    };
  }, [open]);

  return ref;
}

/* ————— Modal ————— */
export function Modal({ open, onClose, title, description, children, size = 'md', footer, className }) {
  useScrollLock(open);
  const panelRef = useDialog(open, onClose);
  const titleId = useId();
  const descriptionId = useId();

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
            className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-50 grid place-items-center p-4 pointer-events-none">
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? titleId : undefined}
              aria-describedby={description ? descriptionId : undefined}
              aria-label={!title ? 'Dialog' : undefined}
              tabIndex={-1}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'w-full max-h-[calc(100vh-2rem)] overflow-y-auto bg-surface border border-hairline shadow-xl pointer-events-auto outline-none',
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
                      type="button"
                      onClick={onClose}
                      className="text-slate hover:text-ink p-1 -m-1 shrink-0"
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

/* ————— Drawer (right slide) ————— */
export function Drawer({ open, onClose, title, description, children, width = 'md', footer }) {
  useScrollLock(open);
  const panelRef = useDialog(open, onClose);
  const titleId = useId();
  const descriptionId = useId();

  const widths = {
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
            className="fixed inset-0 z-50 bg-ink/40"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            aria-label={!title ? 'Drawer' : undefined}
            tabIndex={-1}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'fixed inset-y-0 right-0 z-50 w-full bg-surface flex flex-col shadow-2xl outline-none',
              widths[width]
            )}
          >
            <div className="flex items-start justify-between gap-4 p-6 border-b border-hairline">
              <div>
                {title && <h2 id={titleId} className="text-display-sm">{title}</h2>}
                {description && (
                  <p id={descriptionId} className="text-slate text-sm mt-1.5 leading-relaxed">{description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-slate hover:text-ink p-1 -m-1 shrink-0"
                aria-label="Close"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
            {footer && (
              <div className="p-6 flex items-center justify-end gap-3 border-t border-hairline">
                {footer}
              </div>
            )}
          </motion.div>
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
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {null}
    </Modal>
  );
}
