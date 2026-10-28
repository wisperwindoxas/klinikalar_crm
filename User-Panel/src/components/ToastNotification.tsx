import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, Sparkles } from 'lucide-react';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  timestamp: string;
}

type ToastListener = (toast: ToastItem) => void;
const listeners: Set<ToastListener> = new Set();

/**
 * Global notification function callable from anywhere in the application
 */
export const showNotification = (
  title: string,
  message?: string,
  type: 'success' | 'error' | 'warning' | 'info' = 'success'
) => {
  const item: ToastItem = {
    id: `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type,
    title,
    message,
    timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };
  listeners.forEach(fn => fn(item));
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleToast = (item: ToastItem) => {
      setToasts(prev => [item, ...prev.slice(0, 4)]);
      // Auto dismiss after 4 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== item.id));
      }, 4500);
    };

    listeners.add(handleToast);
    return () => {
      listeners.delete(handleToast);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none">
      {toasts.map(toast => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';
        const isInfo = toast.type === 'info';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border backdrop-blur-md transition-all duration-300 animate-toast-in flex items-start gap-3.5 ${
              isSuccess
                ? 'bg-[#0f291e]/95 text-emerald-100 border-emerald-500/50 shadow-emerald-950/40'
                : isError
                ? 'bg-[#2c1318]/95 text-rose-100 border-rose-500/50 shadow-rose-950/40'
                : isWarning
                ? 'bg-[#2b1f0c]/95 text-amber-100 border-amber-500/50 shadow-amber-950/40'
                : 'bg-[#12213a]/95 text-sky-100 border-sky-500/50 shadow-sky-950/40'
            }`}
          >
            <div className="mt-0.5 flex-shrink-0">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {isInfo && <Info className="w-5 h-5 text-sky-400" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-black text-xs tracking-tight text-white">{toast.title}</span>
                <span className="text-[10px] opacity-60 font-mono">{toast.timestamp}</span>
              </div>
              {toast.message && (
                <p className="text-[11px] opacity-90 mt-0.5 leading-snug">{toast.message}</p>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/60 hover:text-white transition p-0.5 rounded-lg hover:bg-white/10"
              title="Yopish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
