'use client';
import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      expand={false}
      richColors={false}
      gap={8}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: `
            group flex items-start gap-3 w-full max-w-sm
            bg-[#1a1a1a] border border-[#2a2a2a]
            rounded-2xl shadow-2xl shadow-black/50
            px-4 py-3.5 text-sm font-medium
            backdrop-blur-xl
            data-[type=success]:border-[#00d4a040]
            data-[type=error]:border-[#ff4d4d40]
            data-[type=warning]:border-[#f59e0b40]
            data-[type=info]:border-[#3b82f640]
            animate-in slide-in-from-right-5 fade-in duration-300
          `,
          title: 'text-white text-sm font-semibold leading-none',
          description: 'text-gray-400 text-xs mt-1 leading-relaxed',
          actionButton: `
            bg-[#00d4a0] text-black text-xs font-bold
            px-3 py-1.5 rounded-lg hover:bg-[#00b388]
            transition-colors ml-auto flex-shrink-0
          `,
          cancelButton: `
            bg-[#1e1e1e] text-gray-400 text-xs font-medium
            px-3 py-1.5 rounded-lg hover:bg-[#252525]
            transition-colors
          `,
          closeButton: `
            text-gray-600 hover:text-white
            bg-[#1e1e1e] hover:bg-[#252525]
            w-5 h-5 rounded-full flex items-center justify-center
            transition-colors absolute top-2 right-2
          `,
          icon: 'flex-shrink-0 mt-0.5',
          success: 'data-[type=success]:text-[#00d4a0]',
          error:   'data-[type=error]:text-[#ff4d4d]',
          warning: 'data-[type=warning]:text-[#f59e0b]',
          info:    'data-[type=info]:text-[#3b82f6]',
          loader:  'text-[#00d4a0]',
        },
      }}
    />
  );
}

// ── Toast helpers with icons ───────────────────────────────────────────────────
import { toast as sonnerToast } from 'sonner';

export const toast = {
  success: (msg: string, opts?: any) =>
    sonnerToast.success(msg, {
      icon: '✅',
      ...opts,
    }),

  error: (msg: string, opts?: any) =>
    sonnerToast.error(msg, {
      icon: '❌',
      ...opts,
    }),

  warning: (msg: string, opts?: any) =>
    sonnerToast.warning(msg, {
      icon: '⚠️',
      ...opts,
    }),

  info: (msg: string, opts?: any) =>
    sonnerToast(msg, {
      icon: 'ℹ️',
      ...opts,
    }),

  order: (symbol: string, side: 'BUY' | 'SELL', qty: number, price: number) =>
    sonnerToast.success(`${side} order filled`, {
      description: `${qty} × ${symbol} @ $${price.toFixed(2)}`,
      icon: side === 'BUY' ? '🟢' : '🔴',
      duration: 5000,
    }),

  watchlist: (symbol: string, added: boolean) =>
    sonnerToast(added ? `${symbol} added to watchlist` : `${symbol} removed from watchlist`, {
      icon: added ? '⭐' : '✕',
      duration: 2500,
    }),

  priceAlert: (symbol: string, price: number) =>
    sonnerToast.warning(`Price alert triggered`, {
      description: `${symbol} has reached $${price.toFixed(2)}`,
      icon: '🔔',
      duration: 8000,
    }),
};
