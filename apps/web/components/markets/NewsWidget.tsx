'use client';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { ExternalLink, Newspaper } from 'lucide-react';

interface Props {
  symbol?: string;
  limit?: number;
}

const SENTIMENT_STYLE = {
  positive: 'bg-[#00d4a015] text-[#00d4a0] border-[#00d4a030]',
  negative: 'bg-[#ff4d4d15] text-[#ff4d4d] border-[#ff4d4d30]',
  neutral:  'bg-[#f59e0b15] text-[#f59e0b]  border-[#f59e0b30]',
};

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const h    = Math.floor(diff / 3600000);
  const m    = Math.floor(diff / 60000);
  if (h >= 24) return `${Math.floor(h / 24)}d ago`;
  if (h > 0)   return `${h}h ago`;
  if (m > 0)   return `${m}m ago`;
  return 'Just now';
}

export function NewsWidget({ symbol, limit = 5 }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['news', symbol],
    queryFn: () => apiClient.get(`/api/v1/market/news${symbol ? `?symbol=${symbol}` : ''}`).then(r => r.data.data),
    refetchInterval: 300000, // 5 min
    staleTime: 240000,
  });

  const news = (data || []).slice(0, limit);

  return (
    <div className="bg-[#161616] border border-[#262626] rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1e1e1e]">
        <div className="w-7 h-7 bg-[#f59e0b15] rounded-lg flex items-center justify-center">
          <Newspaper size={14} className="text-[#f59e0b]" />
        </div>
        <h3 className="text-sm font-semibold text-white">
          {symbol ? `${symbol} News` : 'Market News'}
        </h3>
      </div>

      <div className="divide-y divide-[#1a1a1a]">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-4 py-3 space-y-2">
                <div className="h-3 bg-[#1e1e1e] rounded animate-pulse w-3/4" />
                <div className="h-2 bg-[#1e1e1e] rounded animate-pulse w-1/2" />
              </div>
            ))
          : news.map((item: any) => (
              <a
                key={item.id}
                href={item.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 px-4 py-3 hover:bg-[#1a1a1a] transition-colors group block"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-xs font-medium text-gray-200 leading-snug group-hover:text-white transition-colors line-clamp-2">
                      {item.headline}
                    </p>
                    <ExternalLink size={10} className="text-gray-600 group-hover:text-gray-400 flex-shrink-0 mt-0.5" />
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-gray-600">{item.source}</span>
                    <span className="text-gray-700">·</span>
                    <span className="text-[10px] text-gray-600">{timeAgo(item.datetime)}</span>
                    {item.sentiment && item.sentiment !== 'neutral' && (
                      <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full border capitalize ${SENTIMENT_STYLE[item.sentiment as keyof typeof SENTIMENT_STYLE] || SENTIMENT_STYLE.neutral}`}>
                        {item.sentiment}
                      </span>
                    )}
                  </div>
                </div>
              </a>
            ))}

        {!isLoading && news.length === 0 && (
          <div className="text-center py-8 text-gray-600 text-xs">No news available</div>
        )}
      </div>
    </div>
  );
}