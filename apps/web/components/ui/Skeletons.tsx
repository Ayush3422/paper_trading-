import { cn } from '@/lib/utils';

// ── Base skeleton pulse ────────────────────────────────────────────────────────
function Bone({ className }: { className?: string }) {
  return (
    <div className={cn('bg-[#1e1e1e] rounded-lg animate-pulse', className)} />
  );
}

// ── Generic card skeleton ──────────────────────────────────────────────────────
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-[#161616] border border-[#262626] rounded-xl p-4 space-y-3', className)}>
      <div className="flex items-center gap-3">
        <Bone className="w-8 h-8 rounded-lg" />
        <div className="space-y-1.5 flex-1">
          <Bone className="h-3 w-24" />
          <Bone className="h-2 w-16" />
        </div>
      </div>
      <Bone className="h-5 w-32" />
      <Bone className="h-2 w-full" />
      <Bone className="h-2 w-4/5" />
    </div>
  );
}

// ── Chart skeleton ─────────────────────────────────────────────────────────────
export function ChartSkeleton({ height = 260, className }: { height?: number; className?: string }) {
  return (
    <div className={cn('bg-[#161616] border border-[#262626] rounded-xl overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#1e1e1e] bg-[#131313]">
        <div className="flex gap-1">
          {Array.from({ length: 7 }).map((_, i) => <Bone key={i} className="h-7 w-10 rounded-md" />)}
        </div>
        <div className="ml-auto flex gap-1">
          {Array.from({ length: 3 }).map((_, i) => <Bone key={i} className="h-5 w-16 rounded-full" />)}
        </div>
      </div>
      {/* Chart area */}
      <div className="p-4" style={{ height }}>
        <div className="relative h-full">
          {/* Fake Y-axis labels */}
          <div className="absolute left-0 inset-y-0 flex flex-col justify-between py-2">
            {Array.from({ length: 5 }).map((_, i) => <Bone key={i} className="h-2 w-10" />)}
          </div>
          {/* Fake candlesticks */}
          <div className="absolute inset-y-0 left-14 right-0 flex items-end gap-1 pb-6">
            {Array.from({ length: 40 }).map((_, i) => {
              const h = 20 + Math.sin(i * 0.6) * 15 + Math.random() * 30;
              return <div key={i} className="flex-1 bg-[#1e1e1e] rounded-sm animate-pulse" style={{ height: `${h}%`, animationDelay: `${i * 30}ms` }} />;
            })}
          </div>
          {/* Fake X-axis */}
          <div className="absolute bottom-0 left-14 right-0 flex justify-between">
            {Array.from({ length: 6 }).map((_, i) => <Bone key={i} className="h-2 w-10" />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Table skeleton ─────────────────────────────────────────────────────────────
export function TableSkeleton({ rows = 8, cols = 7, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={cn('bg-[#161616] border border-[#262626] rounded-xl overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1e1e1e] bg-[#131313]">
        <Bone className="h-7 w-40 rounded-lg" />
        <Bone className="h-7 w-24 rounded-lg" />
        <div className="ml-auto"><Bone className="h-7 w-28 rounded-lg" /></div>
      </div>
      {/* Table header */}
      <div className="flex gap-4 px-4 py-2.5 border-b border-[#1e1e1e] bg-[#131313]">
        {Array.from({ length: cols }).map((_, i) => <Bone key={i} className="h-2.5 flex-1 rounded" />)}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-[#1a1a1a]"
          style={{ animationDelay: `${i * 50}ms` }}>
          <Bone className="h-2.5 w-6 rounded" />
          <div className="space-y-1.5 w-28">
            <Bone className="h-3 w-16" />
            <Bone className="h-2 w-24" />
          </div>
          {Array.from({ length: cols - 2 }).map((_, j) => <Bone key={j} className="h-2.5 flex-1 rounded" />)}
        </div>
      ))}
    </div>
  );
}

// ── Mover card skeleton ────────────────────────────────────────────────────────
export function MoverCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-[#161616] border border-[#262626] rounded-xl overflow-hidden', className)}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1e1e1e]">
        <Bone className="w-7 h-7 rounded-lg" />
        <Bone className="h-3 w-24" />
      </div>
      <div className="divide-y divide-[#1a1a1a]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-2.5">
            <div className="space-y-1.5">
              <Bone className="h-3 w-12" />
              <Bone className="h-2 w-24" />
            </div>
            <div className="space-y-1.5 items-end flex flex-col">
              <Bone className="h-3 w-16" />
              <Bone className="h-2 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Quote header skeleton ──────────────────────────────────────────────────────
export function QuoteHeaderSkeleton() {
  return (
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Bone className="w-8 h-8 rounded-lg" />
          <Bone className="h-6 w-24" />
        </div>
        <Bone className="h-9 w-48" />
        <Bone className="h-5 w-36 rounded-full" />
      </div>
      <div className="flex gap-2">
        <Bone className="h-8 w-24 rounded-lg" />
        <Bone className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

// ── Stat tiles skeleton ────────────────────────────────────────────────────────
export function StatBarSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-[#161616] border border-[#262626] rounded-xl p-4 flex items-start gap-3">
          <Bone className="w-9 h-9 rounded-lg flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <Bone className="h-2 w-20" />
            <Bone className="h-5 w-28" />
            <Bone className="h-2 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── News skeleton ──────────────────────────────────────────────────────────────
export function NewsSkeleton({ items = 5, className }: { items?: number; className?: string }) {
  return (
    <div className={cn('bg-[#161616] border border-[#262626] rounded-xl overflow-hidden', className)}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1e1e1e]">
        <Bone className="w-7 h-7 rounded-lg" />
        <Bone className="h-3 w-28" />
      </div>
      <div className="divide-y divide-[#1a1a1a]">
        {Array.from({ length: items }).map((_, i) => (
          <div key={i} className="px-4 py-3 space-y-2">
            <Bone className="h-3 w-full" />
            <Bone className="h-3 w-4/5" />
            <div className="flex gap-2">
              <Bone className="h-2 w-16" />
              <Bone className="h-2 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}