import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { cn } from '@/utils/format.js';
import { useEscape, useScrollLock } from '@/hooks/index.js';
import Button from './Button.jsx';

/* ————— Modal ————— */
export function Modal({ open, onClose, title, description, children, size = 'md', footer, className }) {
  useEscape(onClose, open);
  useScrollLock(open);

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
          />
          <div className="fixed inset-0 z-50 grid place-items-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'w-full bg-surface border border-hairline shadow-xl pointer-events-auto',
                sizes[size],
                className
              )}
            >
              {(title || onClose) && (
                <div className="flex items-start justify-between gap-4 p-6 border-b border-hairline">
                  <div>
                    {title && <h2 className="text-display-sm">{title}</h2>}
                    {description && (
                      <p className="text-slate text-sm mt-1.5 leading-relaxed">{description}</p>
                    )}
                  </div>
                  {onClose && (
                    <button
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
  useEscape(onClose, open);
  useScrollLock(open);

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
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'fixed inset-y-0 right-0 z-50 w-full bg-surface flex flex-col shadow-2xl',
              widths[width]
            )}
          >
            <div className="flex items-start justify-between gap-4 p-6 border-b border-hairline">
              <div>
                {title && <h2 className="text-display-sm">{title}</h2>}
                {description && (
                  <p className="text-slate text-sm mt-1.5 leading-relaxed">{description}</p>
                )}
              </div>
              <button
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
