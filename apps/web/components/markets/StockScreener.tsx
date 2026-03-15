'use client';
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, SlidersHorizontal, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface Filters {
  sector: string;
  minPrice: string;
  maxPrice: string;
  minChangePct: string;
  maxChangePct: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  search: string;
}

const DEFAULT_FILTERS: Filters = {
  sector: 'All', minPrice: '', maxPrice: '',
  minChangePct: '', maxChangePct: '',
  sortBy: 'mktCap', sortOrder: 'desc', search: '',
};

const SECTORS = ['All','Technology','Financial','Healthcare','Consumer Cyclical','Consumer Defensive','Communication','Energy','Industrial'];

function fmtMktCap(v: number) {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9)  return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6)  return `$${(v / 1e6).toFixed(0)}M`;
  return `$${v}`;
}
function fmtVol(v: number) {
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return v.toString();
}

function SortIcon({ col, current, order }: { col: string; current: string; order: string }) {
  if (col !== current) return <ChevronsUpDown size={12} className="text-gray-600" />;
  return order === 'asc' ? <ChevronUp size={12} className="text-[#00d4a0]" /> : <ChevronDown size={12} className="text-[#00d4a0]" />;
}

export function StockScreener() {
  const router  = useRouter();
  const qc      = useQueryClient();
  const [filters, setFilters]       = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage]             = useState(1);
  const PER_PAGE = 15;

  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v && v !== 'All' && v !== '') params.set(k, v); });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['screener', filters],
    queryFn: () => apiClient.get(`/api/v1/market/screener?${params}`).then(r => r.data.data),
    staleTime: 30000,
  });

  // Add to watchlist
  const { data: watchlists } = useQuery({
    queryKey: ['watchlists'],
    queryFn: () => apiClient.get('/api/v1/watchlists').then(r => r.data.data),
  });

  const addToWl = useMutation({
    mutationFn: ({ symbol }: { symbol: string }) => {
      const defaultList = (watchlists || [])[0];
      if (!defaultList) throw new Error('Create a watchlist first');
      return apiClient.post(`/api/v1/watchlists/${defaultList.id}/symbols`, { symbol });
    },
    onSuccess: (_, { symbol }) => {
      toast.success(`${symbol} added to watchlist`);
      qc.invalidateQueries({ queryKey: ['watchlists'] });
    },
    onError: (e: any) => toast.error(e.message || 'Failed'),
  });

  const stocks = data || [];
  const paginated = stocks.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(stocks.length / PER_PAGE);

  const setSort = (col: string) => {
    setFilters(f => ({
      ...f,
      sortBy: col,
      sortOrder: f.sortBy === col ? (f.sortOrder === 'desc' ? 'asc' : 'desc') : 'desc',
    }));
    setPage(1);
  };

  const resetFilters = () => { setFilters(DEFAULT_FILTERS); setPage(1); };
  const hasActiveFilters = filters.sector !== 'All' || filters.minPrice || filters.maxPrice || filters.minChangePct || filters.maxChangePct;

  return (
    <div className="bg-[#161616] border border-[#262626] rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 py-3 border-b border-[#1e1e1e]">
        <div className="flex items-center gap-2 flex-1 w-full">
          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-3 top-2.5 text-gray-500" />
            <input
              value={filters.search}
              onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }}
              placeholder="Search by name or ticker..."
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#00d4a0] transition-colors"
            />
          </div>

          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${showFilters ? 'bg-[#00d4a020] text-[#00d4a0] border border-[#00d4a040]' : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#2a2a2a]'}`}
          >
            <SlidersHorizontal size={12} />
            Filters
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-[#00d4a0]" />}
          </button>

          {hasActiveFilters && (
            <button onClick={resetFilters} className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors">
              <X size={11} /> Reset
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 flex-shrink-0">
          {isFetching && <span className="text-[#00d4a0] animate-pulse">Updating...</span>}
          <span>{stocks.length} stocks</span>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="px-4 py-3 border-b border-[#1e1e1e] bg-[#131313]">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Sector */}
            <div>
              <label className="text-[10px] text-gray-500 block mb-1 uppercase tracking-wide">Sector</label>
              <select
                value={filters.sector}
                onChange={e => { setFilters(f => ({ ...f, sector: e.target.value })); setPage(1); }}
                className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#00d4a0]"
              >
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {/* Min Price */}
            <div>
              <label className="text-[10px] text-gray-500 block mb-1 uppercase tracking-wide">Min Price ($)</label>
              <input
                type="number" value={filters.minPrice} placeholder="0"
                onChange={e => { setFilters(f => ({ ...f, minPrice: e.target.value })); setPage(1); }}
                className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#00d4a0]"
              />
            </div>
            {/* Max Price */}
            <div>
              <label className="text-[10px] text-gray-500 block mb-1 uppercase tracking-wide">Max Price ($)</label>
              <input
                type="number" value={filters.maxPrice} placeholder="Any"
                onChange={e => { setFilters(f => ({ ...f, maxPrice: e.target.value })); setPage(1); }}
                className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#00d4a0]"
              />
            </div>
            {/* Min Change % */}
            <div>
              <label className="text-[10px] text-gray-500 block mb-1 uppercase tracking-wide">Min Change %</label>
              <input
                type="number" value={filters.minChangePct} placeholder="-10"
                onChange={e => { setFilters(f => ({ ...f, minChangePct: e.target.value })); setPage(1); }}
                className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#00d4a0]"
              />
            </div>
            {/* Max Change % */}
            <div>
              <label className="text-[10px] text-gray-500 block mb-1 uppercase tracking-wide">Max Change %</label>
              <input
                type="number" value={filters.maxChangePct} placeholder="+10"
                onChange={e => { setFilters(f => ({ ...f, maxChangePct: e.target.value })); setPage(1); }}
                className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#00d4a0]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1e1e1e] bg-[#131313]">
              {[
                { label: '#',       key: null },
                { label: 'Symbol',  key: 'ticker' },
                { label: 'Price',   key: 'price' },
                { label: 'Change',  key: 'change' },
                { label: 'Change %',key: 'changePct' },
                { label: 'Volume',  key: 'volume' },
                { label: 'Mkt Cap', key: 'mktCap' },
                { label: 'Sector',  key: null },
                { label: 'Action',  key: null },
              ].map(({ label, key }) => (
                <th
                  key={label}
                  onClick={() => key && setSort(key)}
                  className={`px-4 py-2.5 text-left text-[11px] text-gray-500 font-medium whitespace-nowrap select-none ${key ? 'cursor-pointer hover:text-gray-300' : ''}`}
                >
                  <div className="flex items-center gap-1">
                    {label}
                    {key && <SortIcon col={key} current={filters.sortBy} order={filters.sortOrder} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#1a1a1a]">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 bg-[#1e1e1e] rounded animate-pulse w-16" />
                      </td>
                    ))}
                  </tr>
                ))
              : paginated.map((stock: any, idx: number) => {
                  const isUp = stock.changePct >= 0;
                  const rowNum = (page - 1) * PER_PAGE + idx + 1;
                  return (
                    <tr
                      key={stock.ticker}
                      onClick={() => router.push(`/trading/trade/${stock.ticker}`)}
                      className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3 text-gray-600 text-xs font-mono">{rowNum}</td>
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-mono font-bold text-white text-sm group-hover:text-[#00d4a0] transition-colors">
                            {stock.ticker}
                          </span>
                          <p className="text-[11px] text-gray-500 mt-0.5 truncate max-w-[140px]">{stock.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-white text-sm">
                        ${stock.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className={`px-4 py-3 font-mono text-xs font-medium ${isUp ? 'text-[#00d4a0]' : 'text-[#ff4d4d]'}`}>
                        {isUp ? '+' : ''}{stock.change?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-mono font-semibold px-2 py-0.5 rounded-full ${isUp ? 'bg-[#00d4a020] text-[#00d4a0]' : 'bg-[#ff4d4d20] text-[#ff4d4d]'}`}>
                          {isUp ? '▲' : '▼'} {Math.abs(stock.changePct)?.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{fmtVol(stock.volume)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{fmtMktCap(stock.mktCap)}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] text-gray-500 bg-[#1e1e1e] px-2 py-0.5 rounded-full whitespace-nowrap">
                          {stock.sector}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); addToWl.mutate({ symbol: stock.ticker }); }}
                          className="flex items-center gap-1 px-2.5 py-1 bg-[#00d4a015] text-[#00d4a0] border border-[#00d4a030] rounded-lg text-[10px] font-medium hover:bg-[#00d4a025] transition-colors opacity-0 group-hover:opacity-100 whitespace-nowrap"
                          title="Add to watchlist"
                        >
                          <Plus size={10} /> Watch
                        </button>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#1e1e1e] bg-[#131313]">
          <span className="text-xs text-gray-500">
            Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, stocks.length)} of {stocks.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-[#1e1e1e] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${page === p ? 'bg-[#00d4a0] text-black' : 'text-gray-400 hover:text-white hover:bg-[#1e1e1e]'}`}
                >
                  {p}
                </button>
              );
            })}
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-[#1e1e1e] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}