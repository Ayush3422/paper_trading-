'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Search } from 'lucide-react';

const CATEGORY_CONFIG: Record<string, { color: string; bg: string; emoji: string }> = {
  'Trend Following': { color: '#00d4a0', bg: '#00d4a010', emoji: '📈' },
  'Momentum':        { color: '#a855f7', bg: '#a855f710', emoji: '⚡' },
  'Mean Reversion':  { color: '#3b82f6', bg: '#3b82f610', emoji: '🔄' },
  'Breakout':        { color: '#f59e0b', bg: '#f59e0b10', emoji: '💥' },
  'Volatility':      { color: '#ec4899', bg: '#ec489910', emoji: '🌊' },
  'Volume':          { color: '#06b6d4', bg: '#06b6d410', emoji: '📦' },
  'Multi-Factor':    { color: '#8b5cf6', bg: '#8b5cf610', emoji: '🎯' },
  'Statistical':     { color: '#f43f5e', bg: '#f43f5e10', emoji: '🔬' },
};

const DIFF_STYLE: Record<string, string> = {
  Beginner:     'text-[#00d4a0] bg-[#00d4a010] border-[#00d4a025]',
  Intermediate: 'text-[#f59e0b] bg-[#f59e0b10] border-[#f59e0b25]',
  Advanced:     'text-[#f43f5e] bg-[#f43f5e10] border-[#f43f5e25]',
};

interface Props { onSelect: (tpl: any) => void; }

export function StrategyTemplates({ onSelect }: Props) {
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('All');
  const [diff, setDiff]         = useState('All');

  const { data, isLoading } = useQuery({
    queryKey: ['algo-templates'],
    queryFn: () => apiClient.get('/api/v1/algo/templates').then(r => r.data.data),
    staleTime: Infinity,
  });

  const templates: any[] = data || [];
  const categories = ['All', ...Array.from(new Set(templates.map((t: any) => t.category)))];
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const filtered = templates.filter((t: any) => {
    if (category !== 'All' && t.category !== category) return false;
    if (diff !== 'All' && t.difficulty !== diff) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) &&
        !t.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={12} className="absolute left-3 top-2.5 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search strategies..."
            className="w-full bg-[#111] border border-[#1e1e1e] rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#6366f1] transition-colors" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {difficulties.map(d => (
            <button key={d} onClick={() => setDiff(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${diff === d ? 'bg-[#6366f1] text-white' : 'bg-[#111] border border-[#1e1e1e] text-gray-500 hover:text-white'}`}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => {
          const cfg = cat === 'All' ? null : CATEGORY_CONFIG[cat];
          return (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                category === cat
                  ? cfg ? `border-current` : 'border-[#6366f1] text-[#818cf8] bg-[#6366f115]'
                  : 'border-[#1e1e1e] bg-[#111] text-gray-500 hover:text-gray-300'
              }`}
              style={category === cat && cfg ? { color: cfg.color, background: cfg.bg, borderColor: cfg.color + '50' } : {}}>
              {cfg && <span>{cfg.emoji}</span>}
              {cat}
              {cat !== 'All' && <span className="text-[9px] opacity-60">{templates.filter(t => t.category === cat).length}</span>}
            </button>
          );
        })}
      </div>

      {/* Results count */}
      <p className="text-[11px] text-gray-600">{filtered.length} strateg{filtered.length !== 1 ? 'ies' : 'y'}{search ? ` matching "${search}"` : ''}</p>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-44 bg-[#111] border border-[#1e1e1e] rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <p className="text-3xl mb-2">🔍</p>
          <p>No strategies match your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tpl: any) => {
            const cfg = CATEGORY_CONFIG[tpl.category] || { color: '#6366f1', bg: '#6366f110', emoji: '📊' };
            return (
              <div key={tpl.id} onClick={() => onSelect(tpl)}
                className="group bg-[#111] border border-[#1e1e1e] rounded-2xl p-5 cursor-pointer hover:border-[#252525] transition-all hover:shadow-lg hover:shadow-black/20 relative overflow-hidden">
                
                {/* Accent bar */}
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${cfg.color}, transparent)` }} />

                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: cfg.bg }}>
                      {tpl.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-white leading-tight">{tpl.name}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-semibold" style={{ color: cfg.color }}>{cfg.emoji} {tpl.category}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${DIFF_STYLE[tpl.difficulty] || DIFF_STYLE.Beginner}`}>
                    {tpl.difficulty}
                  </span>
                </div>

                <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-3 mb-3">{tpl.description}</p>

                <div className="flex flex-wrap gap-1.5 items-center">
                  {(tpl.config?.symbols || []).map((s: string) => (
                    <span key={s} className="text-[9px] font-mono font-bold bg-[#1a1a1a] border border-[#252525] text-gray-400 px-1.5 py-0.5 rounded">{s}</span>
                  ))}
                  <div className="ml-auto flex items-center gap-1.5">
                    {tpl.timeHorizon && (
                      <span className="text-[9px] text-gray-600">{tpl.timeHorizon}</span>
                    )}
                    {tpl.winRateExpected && (
                      <span className="text-[9px] text-[#00d4a0] bg-[#00d4a010] px-1.5 py-0.5 rounded-full">
                        WR {tpl.winRateExpected}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[#1a1a1a] flex items-center justify-between">
                  <div className="flex gap-1.5">
                    {tpl.config?.stopLoss && <span className="text-[9px] bg-[#f43f5e10] text-[#f43f5e] px-1.5 py-0.5 rounded">SL {tpl.config.stopLoss}%</span>}
                    {tpl.config?.takeProfit && <span className="text-[9px] bg-[#00d4a010] text-[#00d4a0] px-1.5 py-0.5 rounded">TP {tpl.config.takeProfit}%</span>}
                    <span className="text-[9px] bg-[#1a1a1a] text-gray-500 px-1.5 py-0.5 rounded">{tpl.config?.timeframe}</span>
                  </div>
                  <span className="text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: cfg.color }}>Use Template →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}