'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { StrategyCard }      from '@/components/algo/StrategyCard';
import { StrategyBuilder }   from '@/components/algo/StrategyBuilder';
import { StrategyTemplates } from '@/components/algo/StrategyTemplates';
import { Plus, Bot, Layers, FlaskConical, TrendingUp, Zap, Activity, ChevronRight } from 'lucide-react';

type View = 'dashboard' | 'create' | 'templates';

export default function AlgoPage() {
  const [view, setView]   = useState<View>('dashboard');
  const [template, setTemplate] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['strategies'],
    queryFn:  () => apiClient.get('/api/v1/algo/strategies').then(r => r.data.data),
    refetchInterval: 20000,
  });

  const strategies  = (data || []) as any[];
  const active      = strategies.filter(s => s.status === 'ACTIVE');
  const backtested  = strategies.filter(s => s.backtestRun);
  const bestReturn  = Math.max(...strategies.map(s => s.backtestResults?.[0]?.totalReturnPct || 0), 0);
  const bestSharpe  = Math.max(...strategies.map(s => s.backtestResults?.[0]?.sharpeRatio || 0), 0);

  const pickTemplate = (tpl: any) => { setTemplate(tpl); setView('create'); };
  const cancelCreate = () => { setTemplate(null); setView('dashboard'); };

  return (
    <div className="space-y-6 pb-12">

      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#6366f115] border border-[#6366f130] rounded-xl flex items-center justify-center">
              <Bot size={16} className="text-[#6366f1]" />
            </div>
            Algo Trading
          </h1>
          <p className="text-gray-500 text-sm mt-1">Build, backtest &amp; deploy automated strategies — no coding required</p>
        </div>

        <div className="flex items-center gap-2">
          {active.length > 0 && (
            <div className="flex items-center gap-2 text-xs px-3 py-1.5 bg-[#00d4a010] border border-[#00d4a030] rounded-xl text-[#00d4a0]">
              <Activity size={12} className="animate-pulse" />
              {active.length} live
            </div>
          )}
          <button onClick={() => view === 'templates' ? setView('dashboard') : setView('templates')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${view === 'templates' ? 'bg-[#111] border-[#252525] text-gray-400' : 'bg-[#f59e0b15] border-[#f59e0b30] text-[#f59e0b] hover:bg-[#f59e0b25]'}`}>
            <Zap size={14} /> {view === 'templates' ? 'Back' : 'Templates'}
          </button>
          <button onClick={() => view === 'create' ? cancelCreate() : setView('create')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${view === 'create' ? 'bg-[#111] border border-[#252525] text-gray-400' : 'bg-[#6366f1] hover:bg-[#5558e3] text-white shadow-lg shadow-[#6366f120]'}`}>
            <Plus size={15} /> {view === 'create' ? 'Cancel' : 'New Strategy'}
          </button>
        </div>
      </div>

      {/* ── Stats row (only on dashboard when strategies exist) ──── */}
      {view === 'dashboard' && strategies.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon:'📊', label:'Total Strategies', value:strategies.length, color:'text-white' },
            { icon:'🟢', label:'Live Now',          value:`${active.length}/${strategies.length}`, color:'text-[#00d4a0]' },
            { icon:'🏆', label:'Best Return',        value:bestReturn > 0 ? `+${bestReturn.toFixed(1)}%` : '—', color:'text-[#00d4a0]' },
            { icon:'📈', label:'Best Sharpe',        value:bestSharpe > 0 ? bestSharpe.toFixed(2) : '—', color:bestSharpe >= 1 ? 'text-[#00d4a0]' : 'text-[#f59e0b]' },
          ].map(({ icon, label, value, color }) => (
            <div key={label} className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-[#1a1a1a] rounded-xl flex items-center justify-center text-base flex-shrink-0">{icon}</div>
              <div><p className="text-[10px] text-gray-600 uppercase tracking-wide">{label}</p><p className={`text-base font-mono font-bold mt-0.5 ${color}`}>{value}</p></div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create view ───────────────────────────────────────────── */}
      {view === 'create' && (
        <StrategyBuilder
          initialName={template ? `My ${template.name}` : ''}
          initialDesc={template?.description || ''}
          initialConfig={template?.config}
          onSave={cancelCreate}
        />
      )}

      {/* ── Templates view ────────────────────────────────────────── */}
      {view === 'templates' && (
        <div className="space-y-4">
          <div className="bg-[#111] border border-[#f59e0b25] rounded-2xl p-4 flex items-start gap-3">
            <div className="text-2xl">⚡</div>
            <div>
              <p className="text-sm font-bold text-white">30+ Professional Strategy Templates</p>
              <p className="text-xs text-gray-500 mt-0.5">Click any template to pre-fill the builder with its rules. Customize and backtest before going live.</p>
            </div>
          </div>
          <StrategyTemplates onSelect={pickTemplate} />
        </div>
      )}

      {/* ── Dashboard view ────────────────────────────────────────── */}
      {view === 'dashboard' && (
        <div className="space-y-6">

          {/* Active strategies first */}
          {active.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Activity size={13} className="text-[#00d4a0]" />
                <h2 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Live Strategies</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {active.map(s => <StrategyCard key={s.id} strategy={s} />)}
              </div>
            </section>
          )}

          {/* All strategies */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-56 bg-[#111] border border-[#1e1e1e] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : strategies.length > 0 ? (
            <section>
              {active.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <Layers size={13} className="text-gray-500" />
                  <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">All Strategies ({strategies.length})</h2>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {strategies.filter(s => s.status !== 'ACTIVE').map(s => <StrategyCard key={s.id} strategy={s} />)}
              </div>
            </section>
          ) : (
            /* ── Empty state ────────────────────────────────────── */
            <div className="bg-[#111] border border-[#1e1e1e] border-dashed rounded-3xl p-14 text-center">
              <div className="w-20 h-20 bg-[#6366f115] border border-[#6366f125] rounded-3xl flex items-center justify-center mx-auto mb-5">
                <Bot size={36} className="text-[#6366f1] opacity-70" />
              </div>
              <h3 className="text-white font-bold text-xl mb-2">No strategies yet</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto mb-8 leading-relaxed">
                Build automated trading strategies using 30+ technical indicators — Golden Cross, MACD, RSI, Ichimoku, Supertrend and more. No coding needed.
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <button onClick={() => setView('create')}
                  className="flex items-center gap-2 px-6 py-3 bg-[#6366f1] hover:bg-[#5558e3] text-white text-sm font-bold rounded-2xl transition-colors shadow-xl shadow-[#6366f120]">
                  <Plus size={16} /> Build from Scratch
                </button>
                <button onClick={() => setView('templates')}
                  className="flex items-center gap-2 px-6 py-3 bg-[#f59e0b15] border border-[#f59e0b30] text-[#f59e0b] text-sm font-semibold rounded-2xl hover:bg-[#f59e0b25] transition-colors">
                  <Zap size={16} /> Browse 30+ Templates
                </button>
              </div>

              {/* Quick preview of template categories */}
              <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto">
                {[
                  { emoji:'📈', name:'Trend Following', count:6, color:'#00d4a0' },
                  { emoji:'⚡', name:'Momentum',        count:5, color:'#a855f7' },
                  { emoji:'🔄', name:'Mean Reversion',  count:6, color:'#3b82f6' },
                  { emoji:'💥', name:'Breakout',        count:4, color:'#f59e0b' },
                ].map(c => (
                  <button key={c.name} onClick={() => setView('templates')}
                    className="flex flex-col items-center gap-1.5 p-3 bg-[#0c0c0c] rounded-2xl hover:bg-[#141414] transition-colors group">
                    <span className="text-2xl">{c.emoji}</span>
                    <span className="text-[10px] font-bold" style={{ color: c.color }}>{c.name}</span>
                    <span className="text-[9px] text-gray-600">{c.count} strategies</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Discover more */}
          {strategies.length > 0 && (
            <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5 flex items-center justify-between group cursor-pointer hover:border-[#252525] transition-colors"
              onClick={() => setView('templates')}>
              <div className="flex items-center gap-3">
                <div className="text-2xl">⚡</div>
                <div>
                  <p className="text-sm font-bold text-white">Explore 30+ Strategy Templates</p>
                  <p className="text-xs text-gray-500 mt-0.5">Trend, Momentum, Mean Reversion, Breakout, Volume, Statistical and more</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-600 group-hover:text-gray-300 transition-colors flex-shrink-0" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}