/**
 * Toast Hook
 *
 * Simple toast notification hook for the application.
 * This is a placeholder implementation - you may want to use a library like sonner or react-hot-toast
 */

import { useState, useCallback } from 'react';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

interface Toast extends ToastOptions {
  id: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: Toast = { ...options, id };

    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after duration (default 3 seconds)
    const duration = options.duration || 3000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);

    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    toast,
    toasts,
    dismiss,
  };
}
