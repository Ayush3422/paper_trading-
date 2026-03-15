'use client';
import { useRouter } from 'next/navigation';
import {
  TrendingUp, Star, FileText, BarChart2,
  Trophy, Bell, Search, ShoppingCart, Plus,
} from 'lucide-react';

interface EmptyStateProps {
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

// ── Base empty state ───────────────────────────────────────────────────────────
function Base({
  icon,
  iconColor,
  iconBg,
  title,
  description,
  action,
  children,
  className = '',
}: {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      {/* Animated icon */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 animate-bounce-slow"
        style={{ background: iconBg, border: `1px solid ${iconColor}30` }}
      >
        <div style={{ color: iconColor }}>{icon}</div>
      </div>

      <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-5">{description}</p>

      {action}
      {children}
    </div>
  );
}

// ── No positions ───────────────────────────────────────────────────────────────
export function NoPositions({ className }: EmptyStateProps) {
  const router = useRouter();
  return (
    <Base
      icon={<ShoppingCart size={28} />}
      iconColor="#00d4a0"
      iconBg="#00d4a015"
      title="No open positions"
      description="You haven't bought any stocks yet. Head to the Markets page to find your first trade."
      className={className}
      action={
        <button
          onClick={() => router.push('/trading/markets')}
          className="flex items-center gap-2 bg-[#00d4a0] hover:bg-[#00b388] text-black font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-[#00d4a015]"
        >
          <TrendingUp size={15} /> Browse Markets
        </button>
      }
    />
  );
}

// ── No orders ─────────────────────────────────────────────────────────────────
export function NoOrders({ className }: EmptyStateProps) {
  const router = useRouter();
  return (
    <Base
      icon={<FileText size={28} />}
      iconColor="#3b82f6"
      iconBg="#3b82f615"
      title="No orders yet"
      description="Your order history will appear here once you start trading."
      className={className}
      action={
        <button
          onClick={() => router.push('/trading/markets')}
          className="flex items-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={15} /> Place First Order
        </button>
      }
    />
  );
}

// ── Empty watchlist ────────────────────────────────────────────────────────────
export function EmptyWatchlist({ className }: EmptyStateProps) {
  const router = useRouter();
  return (
    <Base
      icon={<Star size={28} />}
      iconColor="#f59e0b"
      iconBg="#f59e0b15"
      title="Watchlist is empty"
      description="Add stocks you're interested in to track them here. Click the ★ button on any stock."
      className={className}
      action={
        <button
          onClick={() => router.push('/trading/markets')}
          className="flex items-center gap-2 bg-[#f59e0b] hover:bg-[#d97706] text-black font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
        >
          <Search size={15} /> Find Stocks
        </button>
      }
    />
  );
}

// ── No search results ──────────────────────────────────────────────────────────
export function NoSearchResults({ query, className }: { query: string; className?: string }) {
  return (
    <Base
      icon={<Search size={28} />}
      iconColor="#6366f1"
      iconBg="#6366f115"
      title={`No results for "${query}"`}
      description="Try searching with a different ticker symbol or company name."
      className={className}
    />
  );
}

// ── No trades ──────────────────────────────────────────────────────────────────
export function NoTrades({ className }: EmptyStateProps) {
  return (
    <Base
      icon={<BarChart2 size={28} />}
      iconColor="#a855f7"
      iconBg="#a855f715"
      title="No trade history"
      description="Completed trades will appear here. Start by placing a buy order."
      className={className}
    />
  );
}

// ── No notifications ───────────────────────────────────────────────────────────
export function NoNotifications({ className }: EmptyStateProps) {
  return (
    <Base
      icon={<Bell size={28} />}
      iconColor="#f59e0b"
      iconBg="#f59e0b15"
      title="All caught up!"
      description="No new notifications. We'll let you know when price alerts trigger or orders fill."
      className={className}
    />
  );
}

// ── Leaderboard empty ──────────────────────────────────────────────────────────
export function EmptyLeaderboard({ className }: EmptyStateProps) {
  return (
    <Base
      icon={<Trophy size={28} />}
      iconColor="#f59e0b"
      iconBg="#f59e0b15"
      title="Leaderboard is empty"
      description="Be the first on the leaderboard! Make some trades to get ranked."
      className={className}
    />
  );
}

// ── Generic error state ────────────────────────────────────────────────────────
export function ErrorState({
  message = 'Something went wrong',
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-10 px-6 text-center ${className || ''}`}>
      <div className="w-14 h-14 rounded-2xl bg-[#ff4d4d10] border border-[#ff4d4d20] flex items-center justify-center mb-4">
        <span className="text-2xl">⚠️</span>
      </div>
      <h3 className="text-sm font-semibold text-white mb-1">Something went wrong</h3>
      <p className="text-xs text-gray-500 mb-4 max-w-xs">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs text-[#00d4a0] bg-[#00d4a015] px-4 py-2 rounded-lg hover:bg-[#00d4a025] transition-colors border border-[#00d4a030]"
        >
          Try again
        </button>
      )}
    </div>
  );
}