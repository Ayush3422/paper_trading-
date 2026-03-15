'use client';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { Plus, X, Info, ChevronDown, ChevronUp } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
type Operator = 'CROSSES_ABOVE'|'CROSSES_BELOW'|'GREATER_THAN'|'LESS_THAN';
interface Condition {
  id: string; indicator: string; param?: number;
  operator: Operator; compareTo: string; compareParam?: number; value?: number;
}
interface Rule { conditions: Condition[]; logic: 'AND'|'OR'; }
interface Config {
  symbols: string[]; buyRule: Rule; sellRule: Rule;
  positionSize: number; stopLoss?: number; takeProfit?: number; trailingStop?: number;
  maxOpenTrades: number; timeframe: string; positionSizing: 'FIXED'|'ATR'|'KELLY';
}

// ── Indicator Catalog ──────────────────────────────────────────────────────────
const INDICATORS = [
  { group: 'Price', items: [
    { value:'PRICE', label:'Price (Close)', hasParam:false },
    { value:'OPEN',  label:'Open',          hasParam:false },
    { value:'HIGH',  label:'High',          hasParam:false },
    { value:'LOW',   label:'Low',           hasParam:false },
  ]},
  { group: 'Moving Averages', items: [
    { value:'MA',  label:'SMA',  hasParam:true, defaultParam:20, paramLabel:'Period' },
    { value:'EMA', label:'EMA',  hasParam:true, defaultParam:9,  paramLabel:'Period' },
    { value:'WMA', label:'WMA',  hasParam:true, defaultParam:20, paramLabel:'Period' },
  ]},
  { group: 'Momentum', items: [
    { value:'RSI',       label:'RSI',         hasParam:true,  defaultParam:14, paramLabel:'Period'  },
    { value:'MACD',      label:'MACD Line',   hasParam:false },
    { value:'MACD_HIST', label:'MACD Histogram', hasParam:false },
    { value:'STOCH_K',   label:'Stoch %K',    hasParam:true,  defaultParam:14, paramLabel:'Period'  },
    { value:'STOCH_D',   label:'Stoch %D',    hasParam:false },
    { value:'CCI',       label:'CCI',         hasParam:true,  defaultParam:20, paramLabel:'Period'  },
    { value:'WILLIAMS_R',label:'Williams %R', hasParam:true,  defaultParam:14, paramLabel:'Period'  },
    { value:'ROC',       label:'Rate of Change',hasParam:true, defaultParam:12, paramLabel:'Period' },
    { value:'MFI',       label:'Money Flow Index',hasParam:true,defaultParam:14,paramLabel:'Period' },
  ]},
  { group: 'Volatility', items: [
    { value:'ATR',          label:'ATR',           hasParam:true,  defaultParam:14, paramLabel:'Period' },
    { value:'BB_UPPER',     label:'BB Upper',      hasParam:false },
    { value:'BB_MID',       label:'BB Mid',        hasParam:false },
    { value:'BB_LOWER',     label:'BB Lower',      hasParam:false },
    { value:'BB_WIDTH',     label:'BB Bandwidth',  hasParam:false },
    { value:'KELTNER_UPPER',label:'Keltner Upper', hasParam:false },
    { value:'KELTNER_LOWER',label:'Keltner Lower', hasParam:false },
  ]},
  { group: 'Trend', items: [
    { value:'ADX',       label:'ADX',         hasParam:true,  defaultParam:14, paramLabel:'Period' },
    { value:'PDI',       label:'+DI',         hasParam:false },
    { value:'MDI',       label:'-DI',         hasParam:false },
    { value:'SUPERTREND',label:'SuperTrend',  hasParam:false },
    { value:'TENKAN',    label:'Ichimoku Tenkan', hasParam:false },
    { value:'KIJUN',     label:'Ichimoku Kijun',  hasParam:false },
    { value:'SENKOU_A',  label:'Kumo A (Cloud)',   hasParam:false },
    { value:'SENKOU_B',  label:'Kumo B (Cloud)',   hasParam:false },
  ]},
  { group: 'Volume', items: [
    { value:'VOLUME',  label:'Volume',       hasParam:false },
    { value:'VOL_MA',  label:'Volume MA(20)',hasParam:false },
    { value:'OBV',     label:'On Balance Volume', hasParam:false },
    { value:'OBV_MA',  label:'OBV MA(20)',   hasParam:false },
    { value:'CMF',     label:'Chaikin MF',   hasParam:false },
    { value:'VWAP',    label:'VWAP',         hasParam:false },
  ]},
  { group: 'Breakout', items: [
    { value:'DONCHIAN_UPPER',label:'Donchian Upper', hasParam:true, defaultParam:20, paramLabel:'Period' },
    { value:'DONCHIAN_LOWER',label:'Donchian Lower', hasParam:true, defaultParam:20, paramLabel:'Period' },
  ]},
  { group: 'Statistical', items: [
    { value:'ZSCORE',     label:'Z-Score',       hasParam:true, defaultParam:20, paramLabel:'Period' },
    { value:'LINEAR_REG', label:'Linear Reg',    hasParam:true, defaultParam:20, paramLabel:'Period' },
  ]},
  { group: 'Other', items: [
    { value:'SIGNAL',    label:'MACD Signal',  hasParam:false },
    { value:'PREV_MACD_HIST',label:'Prev MACD Hist',hasParam:false },
    { value:'VIX',       label:'VIX (Fear Index)',hasParam:false },
  ]},
];

const ALL_INDICATORS = INDICATORS.flatMap(g => g.items);

const COMPARE_OPTIONS = [
  { group: 'Price', items: [
    { value:'VALUE',    label:'Fixed Value', hasParam:true },
    { value:'PRICE',    label:'Price',       hasParam:false },
  ]},
  { group: 'Moving Averages', items: [
    { value:'MA',  label:'SMA',  hasParam:true  },
    { value:'EMA', label:'EMA',  hasParam:true  },
  ]},
  { group: 'Momentum', items: [
    { value:'RSI',    label:'RSI',         hasParam:false },
    { value:'SIGNAL', label:'MACD Signal', hasParam:false },
    { value:'STOCH_D',label:'Stoch %D',    hasParam:false },
  ]},
  { group: 'Volatility', items: [
    { value:'BB_UPPER',     label:'BB Upper',       hasParam:false },
    { value:'BB_MID',       label:'BB Mid',         hasParam:false },
    { value:'BB_LOWER',     label:'BB Lower',       hasParam:false },
    { value:'KELTNER_UPPER',label:'Keltner Upper',  hasParam:false },
    { value:'KELTNER_LOWER',label:'Keltner Lower',  hasParam:false },
  ]},
  { group: 'Trend', items: [
    { value:'SUPERTREND',label:'SuperTrend', hasParam:false },
    { value:'TENKAN',    label:'Tenkan-Sen', hasParam:false },
    { value:'KIJUN',     label:'Kijun-Sen',  hasParam:false },
    { value:'SENKOU_A',  label:'Kumo A',     hasParam:false },
    { value:'SENKOU_B',  label:'Kumo B',     hasParam:false },
    { value:'PDI',       label:'+DI',        hasParam:false },
    { value:'MDI',       label:'-DI',        hasParam:false },
  ]},
  { group: 'Volume', items: [
    { value:'VOL_MA',  label:'Volume MA', hasParam:false },
    { value:'OBV_MA',  label:'OBV MA',    hasParam:false },
    { value:'VWAP',    label:'VWAP',      hasParam:false },
  ]},
  { group: 'Breakout', items: [
    { value:'DONCHIAN_UPPER',label:'Donchian Upper', hasParam:true  },
    { value:'DONCHIAN_LOWER',label:'Donchian Lower', hasParam:true  },
  ]},
  { group: 'Statistical', items: [
    { value:'PREV_MACD_HIST',label:'Prev MACD Hist', hasParam:false },
    { value:'LINEAR_REG',    label:'Linear Reg',     hasParam:false },
  ]},
];

const ALL_COMPARE = COMPARE_OPTIONS.flatMap(g => g.items);

const OPERATORS = [
  { value:'CROSSES_ABOVE', label:'Crosses Above ↑' },
  { value:'CROSSES_BELOW', label:'Crosses Below ↓' },
  { value:'GREATER_THAN',  label:'Is Greater Than >'  },
  { value:'LESS_THAN',     label:'Is Less Than <'     },
];

const COMMON_SYMBOLS = ['SPY','QQQ','AAPL','MSFT','NVDA','GOOGL','AMZN','META','TSLA','AMD','UBER','COIN','IWM','GLD','XLK'];

const DEFAULT_CONFIG: Config = {
  symbols: ['AAPL'], positionSize: 80, maxOpenTrades: 1,
  timeframe: '1D', positionSizing: 'FIXED',
  buyRule:  { conditions: [], logic: 'AND' },
  sellRule: { conditions: [], logic: 'OR'  },
};

let _id = 1;
const mkCond = (): Condition => ({ id: String(_id++), indicator:'RSI', param:14, operator:'LESS_THAN', compareTo:'VALUE', value:30 });

// ── Select Components ──────────────────────────────────────────────────────────
function GroupedSelect({ value, options, onChange, className }: {
  value: string; options: typeof INDICATORS;
  onChange: (v: string) => void; className?: string;
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className={`bg-[#131313] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#6366f1] transition-colors ${className}`}>
      {options.map(g => (
        <optgroup key={g.group} label={g.group}>
          {g.items.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
        </optgroup>
      ))}
    </select>
  );
}

// ── Condition Row ──────────────────────────────────────────────────────────────
function CondRow({ cond, onChange, onRemove }: { cond: Condition; onChange: (c: Condition) => void; onRemove: () => void }) {
  const indMeta = ALL_INDICATORS.find(i => i.value === cond.indicator);
  const cmpMeta = ALL_COMPARE.find(c => c.value === cond.compareTo);

  return (
    <div className="flex flex-wrap items-center gap-1.5 bg-[#1a1a1a] border border-[#252525] rounded-xl p-2.5">
      {/* Indicator */}
      <GroupedSelect value={cond.indicator} options={INDICATORS}
        onChange={v => onChange({ ...cond, indicator: v, param: ALL_INDICATORS.find(i => i.value === v)?.defaultParam })} />

      {/* Period */}
      {indMeta && 'hasParam' in indMeta && indMeta.hasParam && (
        <input type="number" value={cond.param ?? (indMeta as any).defaultParam ?? 14} min={2} max={500}
          onChange={e => onChange({ ...cond, param: parseInt(e.target.value)||14 })}
          className="w-14 bg-[#131313] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#6366f1]" />
      )}

      {/* Operator */}
      <select value={cond.operator} onChange={e => onChange({ ...cond, operator: e.target.value as Operator })}
        className="bg-[#131313] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-xs text-[#f59e0b] font-semibold focus:outline-none focus:border-[#6366f1] transition-colors">
        {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {/* Compare to */}
      <GroupedSelect value={cond.compareTo} options={COMPARE_OPTIONS}
        onChange={v => onChange({ ...cond, compareTo: v, compareParam: undefined, value: cond.value })} />

      {/* Compare param */}
      {cmpMeta?.hasParam && (
        <input type="number"
          value={cond.compareTo === 'VALUE' ? (cond.value ?? 50) : (cond.compareParam ?? 20)}
          step={cond.compareTo === 'VALUE' ? 0.5 : 1} min={-999} max={9999}
          onChange={e => cond.compareTo === 'VALUE'
            ? onChange({ ...cond, value: parseFloat(e.target.value) })
            : onChange({ ...cond, compareParam: parseInt(e.target.value)||20 })}
          className="w-20 bg-[#131313] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#6366f1]" />
      )}

      <button onClick={onRemove} className="ml-auto text-gray-600 hover:text-[#ff4d4d] transition-colors p-0.5">
        <X size={13} />
      </button>
    </div>
  );
}

// ── Rule Block ─────────────────────────────────────────────────────────────────
function RuleBlock({ title, accent, rule, onChange }: {
  title: string; accent: string; rule: Rule; onChange: (r: Rule) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: accent }} />
          <span className="text-xs font-bold text-gray-200 uppercase tracking-wider">{title}</span>
          <span className="text-[10px] text-gray-600">({rule.conditions.length} condition{rule.conditions.length !== 1 ? 's':''})</span>
        </div>
        {rule.conditions.length > 1 && (
          <div className="flex bg-[#0e0e0e] border border-[#2a2a2a] rounded-lg p-0.5">
            {(['AND','OR'] as const).map(l => (
              <button key={l} onClick={() => onChange({ ...rule, logic: l })}
                className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-all ${rule.logic === l ? 'text-white' : 'text-gray-600'}`}
                style={rule.logic === l ? { background: accent + '33', color: accent } : {}}>
                {l}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        {rule.conditions.map((cond, i) => (
          <div key={cond.id}>
            {i > 0 && (
              <div className="flex items-center gap-2 my-1">
                <div className="flex-1 h-px bg-[#1e1e1e]" />
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ color: accent, background: accent + '15' }}>{rule.logic}</span>
                <div className="flex-1 h-px bg-[#1e1e1e]" />
              </div>
            )}
            <CondRow cond={cond}
              onChange={updated => onChange({ ...rule, conditions: rule.conditions.map(c => c.id === cond.id ? updated : c) })}
              onRemove={() => onChange({ ...rule, conditions: rule.conditions.filter(c => c.id !== cond.id) })}
            />
          </div>
        ))}
      </div>

      <button onClick={() => onChange({ ...rule, conditions: [...rule.conditions, mkCond()] })}
        className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-white transition-colors py-1 px-1">
        <Plus size={12} /> Add Condition
      </button>
    </div>
  );
}

// ── Main Builder ───────────────────────────────────────────────────────────────
export function StrategyBuilder({ initialConfig, initialName, initialDesc, strategyId, onSave }: {
  initialConfig?: Partial<Config>; initialName?: string; initialDesc?: string;
  strategyId?: string; onSave?: () => void;
}) {
  const qc = useQueryClient();
  const [name, setName]   = useState(initialName || '');
  const [desc, setDesc]   = useState(initialDesc || '');
  const [cfg, setCfg]     = useState<Config>({ ...DEFAULT_CONFIG, ...(initialConfig || {}) });
  const [symInput, setSymInput] = useState('');
  const [riskOpen, setRiskOpen] = useState(true);

  const save = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('Name required');
      if (!cfg.buyRule.conditions.length)  throw new Error('Add at least one BUY condition');
      if (!cfg.sellRule.conditions.length) throw new Error('Add at least one SELL condition');
      if (!cfg.symbols.length)             throw new Error('Add at least one symbol');
      const payload = { name, description: desc, config: cfg };
      return strategyId
        ? apiClient.put(`/api/v1/algo/strategies/${strategyId}`, payload)
        : apiClient.post('/api/v1/algo/strategies', payload);
    },
    onSuccess: () => {
      toast.success(strategyId ? 'Strategy updated!' : 'Strategy created!');
      qc.invalidateQueries({ queryKey: ['strategies'] });
      onSave?.();
    },
    onError: (e: any) => toast.error(e.message || 'Failed to save'),
  });

  const addSym = (s: string) => {
    const u = s.toUpperCase().trim();
    if (!u || cfg.symbols.includes(u) || cfg.symbols.length >= 8) return;
    setCfg(c => ({ ...c, symbols: [...c.symbols, u] }));
    setSymInput('');
  };

  return (
    <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden shadow-2xl">

      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-[#6366f108] to-transparent border-b border-[#1e1e1e] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">{strategyId ? '✏️ Edit Strategy' : '🔧 Strategy Builder'}</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">Define entry & exit rules using 30+ technical indicators</p>
        </div>
      </div>

      <div className="p-6 space-y-7">

        {/* Name + Desc */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide block mb-1.5">Strategy Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Golden Cross RSI Filter"
              className="w-full bg-[#1a1a1a] border border-[#252525] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-[#6366f1] transition-colors" />
          </div>
          <div>
            <label className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide block mb-1.5">Description</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="What does this strategy do?"
              className="w-full bg-[#1a1a1a] border border-[#252525] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-[#6366f1] transition-colors" />
          </div>
        </div>

        {/* Symbols */}
        <div>
          <label className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide block mb-2">Symbols to Trade</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {cfg.symbols.map(s => (
              <span key={s} className="flex items-center gap-1.5 bg-[#6366f115] border border-[#6366f130] text-[#818cf8] font-mono font-bold text-xs px-2.5 py-1 rounded-lg">
                {s}
                <button onClick={() => setCfg(c => ({ ...c, symbols: c.symbols.filter(x => x !== s) }))} className="hover:text-white transition-colors"><X size={11} /></button>
              </span>
            ))}
            {cfg.symbols.length === 0 && <p className="text-xs text-[#ff4d4d] italic">Add at least one symbol</p>}
          </div>
          <div className="flex gap-2 items-center">
            <input value={symInput} onChange={e => setSymInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && addSym(symInput)}
              placeholder="Ticker (e.g. AAPL)"
              className="w-32 bg-[#1a1a1a] border border-[#252525] rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-600 font-mono focus:outline-none focus:border-[#6366f1]" />
            <button onClick={() => addSym(symInput)} className="px-3 py-1.5 bg-[#6366f115] border border-[#6366f130] text-[#818cf8] rounded-xl text-xs hover:bg-[#6366f125] transition-colors"><Plus size={13} /></button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {COMMON_SYMBOLS.filter(s => !cfg.symbols.includes(s)).map(s => (
              <button key={s} onClick={() => addSym(s)}
                className="text-[10px] font-mono text-gray-600 bg-[#181818] border border-[#222] px-2 py-0.5 rounded-lg hover:text-white hover:border-[#333] transition-colors">+{s}</button>
            ))}
          </div>
        </div>

        {/* Rules */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="bg-[#0c0c0c] border border-[#1e1e1e] rounded-2xl p-5">
            <RuleBlock title="BUY / Entry When" accent="#00d4a0"
              rule={cfg.buyRule} onChange={r => setCfg(c => ({ ...c, buyRule: r }))} />
          </div>
          <div className="bg-[#0c0c0c] border border-[#1e1e1e] rounded-2xl p-5">
            <RuleBlock title="SELL / Exit When" accent="#f43f5e"
              rule={cfg.sellRule} onChange={r => setCfg(c => ({ ...c, sellRule: r }))} />
          </div>
        </div>

        {/* Risk & Sizing */}
        <div className="bg-[#0c0c0c] border border-[#1e1e1e] rounded-2xl overflow-hidden">
          <button onClick={() => setRiskOpen(v => !v)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-xs font-bold text-gray-300 uppercase tracking-wider hover:text-white transition-colors">
            <span className="flex items-center gap-2">🛡️ Risk Management & Position Sizing</span>
            {riskOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {riskOpen && (
            <div className="px-5 pb-5 border-t border-[#1a1a1a]">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-4">
                {/* Position Size */}
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1.5">Position Size %</label>
                  <div className="relative">
                    <input type="number" value={cfg.positionSize} min={1} max={100}
                      onChange={e => setCfg(c => ({ ...c, positionSize: parseInt(e.target.value)||10 }))}
                      className="w-full bg-[#141414] border border-[#252525] rounded-xl px-3 py-2 pr-6 text-sm text-white font-mono focus:outline-none focus:border-[#6366f1]" />
                    <span className="absolute right-2.5 top-2 text-gray-600 text-xs">%</span>
                  </div>
                </div>
                {/* Stop Loss */}
                <div>
                  <label className="text-[10px] text-[#f43f5e] block mb-1.5">Stop Loss %</label>
                  <div className="relative">
                    <input type="number" value={cfg.stopLoss ?? ''} min={0.1} max={50} step={0.5} placeholder="None"
                      onChange={e => setCfg(c => ({ ...c, stopLoss: parseFloat(e.target.value)||undefined }))}
                      className="w-full bg-[#141414] border border-[#252525] rounded-xl px-3 py-2 pr-6 text-sm text-white font-mono placeholder-gray-700 focus:outline-none focus:border-[#f43f5e]" />
                    <span className="absolute right-2.5 top-2 text-[#f43f5e] text-xs">%</span>
                  </div>
                </div>
                {/* Take Profit */}
                <div>
                  <label className="text-[10px] text-[#00d4a0] block mb-1.5">Take Profit %</label>
                  <div className="relative">
                    <input type="number" value={cfg.takeProfit ?? ''} min={0.5} max={500} step={0.5} placeholder="None"
                      onChange={e => setCfg(c => ({ ...c, takeProfit: parseFloat(e.target.value)||undefined }))}
                      className="w-full bg-[#141414] border border-[#252525] rounded-xl px-3 py-2 pr-6 text-sm text-white font-mono placeholder-gray-700 focus:outline-none focus:border-[#00d4a0]" />
                    <span className="absolute right-2.5 top-2 text-[#00d4a0] text-xs">%</span>
                  </div>
                </div>
                {/* Trailing Stop */}
                <div>
                  <label className="text-[10px] text-[#f59e0b] block mb-1.5">Trailing Stop %</label>
                  <div className="relative">
                    <input type="number" value={cfg.trailingStop ?? ''} min={0.5} max={50} step={0.5} placeholder="None"
                      onChange={e => setCfg(c => ({ ...c, trailingStop: parseFloat(e.target.value)||undefined }))}
                      className="w-full bg-[#141414] border border-[#252525] rounded-xl px-3 py-2 pr-6 text-sm text-white font-mono placeholder-gray-700 focus:outline-none focus:border-[#f59e0b]" />
                    <span className="absolute right-2.5 top-2 text-[#f59e0b] text-xs">%</span>
                  </div>
                </div>
                {/* Max Trades */}
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1.5">Max Open Trades</label>
                  <input type="number" value={cfg.maxOpenTrades} min={1} max={20}
                    onChange={e => setCfg(c => ({ ...c, maxOpenTrades: parseInt(e.target.value)||1 }))}
                    className="w-full bg-[#141414] border border-[#252525] rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#6366f1]" />
                </div>
              </div>

              {/* Position sizing mode */}
              <div className="mt-4">
                <label className="text-[10px] text-gray-500 block mb-2">Position Sizing Method</label>
                <div className="flex gap-2 flex-wrap">
                  {([
                    { v:'FIXED', label:'Fixed %', desc:'Use fixed % of capital' },
                    { v:'ATR',   label:'ATR-based', desc:'Risk-adjusted via ATR' },
                    { v:'KELLY', label:'Kelly Criterion', desc:'Optimal growth sizing' },
                  ] as const).map(({ v, label, desc }) => (
                    <button key={v} onClick={() => setCfg(c => ({ ...c, positionSizing: v }))}
                      className={`flex flex-col items-start px-4 py-2.5 rounded-xl border text-left transition-all ${cfg.positionSizing === v ? 'border-[#6366f1] bg-[#6366f115] text-[#818cf8]' : 'border-[#252525] bg-[#141414] text-gray-500 hover:text-gray-300'}`}>
                      <span className="text-xs font-bold">{label}</span>
                      <span className="text-[10px] opacity-70">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeframe */}
              <div className="mt-4">
                <label className="text-[10px] text-gray-500 block mb-2">Timeframe</label>
                <div className="flex gap-2">
                  {['1D','4H','1H','15m','5m'].map(tf => (
                    <button key={tf} onClick={() => setCfg(c => ({ ...c, timeframe: tf }))}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${cfg.timeframe === tf ? 'bg-[#6366f1] text-white' : 'bg-[#141414] border border-[#252525] text-gray-500 hover:text-white'}`}>
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save */}
        <div className="flex items-center justify-between pt-1">
          <p className="text-[11px] text-gray-600 flex items-center gap-1.5"><Info size={11} /> Run a backtest after saving to validate performance</p>
          <button onClick={() => save.mutate()} disabled={save.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#6366f1] hover:bg-[#5558e3] text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-[#6366f120]">
            {save.isPending ? 'Saving...' : strategyId ? 'Update Strategy' : '💾 Save Strategy'}
          </button>
        </div>
      </div>
    </div>
  );
}