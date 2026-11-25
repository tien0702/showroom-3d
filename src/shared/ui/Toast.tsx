import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import s from './ui.module.css';

interface ToastProps {
  toast: { id: number; message: string; action?: { label: string; run: () => void } } | null;
  onDismiss: () => void;
  duration?: number;
}

export function ToastHost({ toast, onDismiss, duration = 3800 }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(t);
  }, [toast, onDismiss, duration]);

  return (
    <div className={s.toastHost} aria-live="polite">
      <AnimatePresence mode="popLayout">
        {toast && (
          <motion.div
            key={toast.id}
            className={s.toast}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 460, damping: 32 }}
          >
            <span className="clamp-2">{toast.message}</span>
            {toast.action && (
              <button
                className={s.toastAction}
                onClick={() => {
                  toast.action?.run();
                  onDismiss();
                }}
              >
                {toast.action.label}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
