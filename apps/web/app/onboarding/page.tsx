'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/auth.store';
import {
  TrendingUp, ChevronRight, ChevronLeft,
  CheckCircle, Target, BarChart2, Zap,
  Globe, Star, BookOpen, Trophy,
} from 'lucide-react';

// ── Step types ────────────────────────────────────────────────────────────────
const STEPS = ['Welcome', 'Capital', 'Style', 'Tour', 'Done'];

// ── Step 1 — Welcome ──────────────────────────────────────────────────────────
function WelcomeStep({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center text-center space-y-6 py-6">
      {/* Animated logo */}
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-[#00d4a020] border border-[#00d4a030] flex items-center justify-center animate-bounce-slow">
          <TrendingUp size={36} className="text-[#00d4a0]" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#00d4a0] rounded-full flex items-center justify-center">
          <span className="text-black text-xs font-bold">✓</span>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Welcome, {name}! 👋
        </h1>
        <p className="text-gray-400 leading-relaxed max-w-xs">
          You're about to start your paper trading journey. Practice investing with <span className="text-[#00d4a0] font-semibold">$100,000 virtual cash</span> — zero risk, real experience.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 w-full">
        {[
          { icon: '📈', label: 'Real-time\nQuotes'   },
          { icon: '📊', label: 'Pro\nCharts'         },
          { icon: '🏆', label: 'Compete\nGlobally'   },
        ].map(f => (
          <div key={f.label} className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-3 text-center">
            <span className="text-2xl block mb-1">{f.icon}</span>
            <span className="text-[10px] text-gray-400 whitespace-pre-line font-medium leading-tight">{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Step 2 — Starting capital ─────────────────────────────────────────────────
function CapitalStep({
  capital, setCapital,
}: { capital: number; setCapital: (v: number) => void }) {
  const OPTIONS = [10000, 25000, 50000, 100000, 250000, 500000];
  return (
    <div className="space-y-6 py-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-1">Starting Capital</h2>
        <p className="text-gray-400 text-sm">How much virtual cash do you want to start with?</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map(opt => (
          <button
            key={opt}
            onClick={() => setCapital(opt)}
            className={`flex flex-col items-start p-4 rounded-xl border transition-all ${
              capital === opt
                ? 'border-[#00d4a0] bg-[#00d4a015] shadow-lg shadow-[#00d4a010]'
                : 'border-[#262626] bg-[#1a1a1a] hover:border-[#333]'
            }`}
          >
            {capital === opt && (
              <CheckCircle size={14} className="text-[#00d4a0] mb-2" />
            )}
            <span className="text-lg font-mono font-bold text-white">
              ${opt.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-500 mt-0.5">
              {opt < 25000 ? 'Beginner' : opt < 100000 ? 'Intermediate' : opt < 250000 ? 'Advanced' : 'Pro'}
            </span>
          </button>
        ))}
      </div>

      <p className="text-[11px] text-gray-600 text-center">
        Don't worry — you can always reset your portfolio later in Settings
      </p>
    </div>
  );
}

// ── Step 3 — Trading style ────────────────────────────────────────────────────
function StyleStep({
  style, setStyle,
}: { style: string; setStyle: (v: string) => void }) {
  const STYLES = [
    { id: 'swing',     icon: '📊', title: 'Swing Trader',   desc: 'Hold positions for days to weeks',    color: '#3b82f6' },
    { id: 'day',       icon: '⚡', title: 'Day Trader',      desc: 'Open and close within the same day',  color: '#f59e0b' },
    { id: 'longterm',  icon: '🌱', title: 'Long-Term Investor', desc: 'Buy and hold for months to years', color: '#00d4a0' },
    { id: 'momentum',  icon: '🚀', title: 'Momentum Trader', desc: 'Chase breakouts and strong trends',   color: '#a855f7' },
  ];

  return (
    <div className="space-y-5 py-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-1">Trading Style</h2>
        <p className="text-gray-400 text-sm">What kind of trader are you (or want to be)?</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {STYLES.map(s => (
          <button
            key={s.id}
            onClick={() => setStyle(s.id)}
            className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
              style === s.id
                ? 'border-[#00d4a040] bg-[#00d4a010] shadow-lg'
                : 'border-[#262626] bg-[#1a1a1a] hover:border-[#333]'
            }`}
          >
            <span className="text-2xl flex-shrink-0">{s.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{s.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
            </div>
            {style === s.id && (
              <CheckCircle size={18} className="text-[#00d4a0] flex-shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Step 4 — App tour ─────────────────────────────────────────────────────────
function TourStep() {
  const FEATURES = [
    { icon: Globe,    color: '#3b82f6', title: 'Markets Page',   desc: 'Find stocks with our screener, view top movers and indices',     href: '/trading/markets'   },
    { icon: BarChart2,color: '#00d4a0', title: 'Trade Page',     desc: 'Full-screen charts with RSI, MACD, Bollinger Bands and more',     href: '/trading/trade/AAPL'},
    { icon: BookOpen, color: '#a855f7', title: 'Orders',         desc: 'Track open, filled and cancelled orders all in one place',        href: '/trading/orders'    },
    { icon: Star,     color: '#f59e0b', title: 'Watchlist',      desc: 'Save stocks you\'re watching and track them live',               href: '/trading/watchlist'  },
    { icon: Trophy,   color: '#ff4d4d', title: 'Leaderboard',    desc: 'Compete with other traders and climb the global rankings',       href: '/trading/leaderboard'},
  ];

  return (
    <div className="space-y-4 py-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-1">Quick Tour</h2>
        <p className="text-gray-400 text-sm">Here's what you can do with PaperTrade</p>
      </div>
      <div className="space-y-2.5">
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="flex items-center gap-3 p-3 bg-[#1a1a1a] border border-[#262626] rounded-xl"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${f.color}15`, border: `1px solid ${f.color}30` }}>
                <Icon size={16} style={{ color: f.color }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white leading-none">{f.title}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{f.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 5 — Done ─────────────────────────────────────────────────────────────
function DoneStep({ capital }: { capital: number }) {
  return (
    <div className="flex flex-col items-center text-center space-y-5 py-8">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-[#00d4a020] border-2 border-[#00d4a0] flex items-center justify-center">
          <CheckCircle size={40} className="text-[#00d4a0]" />
        </div>
        {/* Ripple rings */}
        <div className="absolute inset-0 rounded-full border-2 border-[#00d4a030] animate-ping" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-2">You're all set! 🎉</h2>
        <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
          Your portfolio is loaded with{' '}
          <span className="text-[#00d4a0] font-semibold font-mono">
            ${capital.toLocaleString()}
          </span>{' '}
          in virtual cash. Start exploring the markets!
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 w-full">
        {[
          { label: 'Starting Cash',  value: `$${(capital / 1000).toFixed(0)}K`, color: '#00d4a0' },
          { label: 'Open Positions', value: '0',    color: '#3b82f6' },
          { label: 'Win Rate',       value: '—',    color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-3">
            <p className="text-[9px] text-gray-500 uppercase tracking-wide">{s.label}</p>
            <p className="text-base font-mono font-bold mt-0.5" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Onboarding Page ──────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router    = useRouter();
  const { user }  = useAuthStore();
  const [step, setStep]       = useState(0);
  const [capital, setCapital] = useState(100000);
  const [style, setStyle]     = useState('swing');
  const [done, setDone]       = useState(false);

  const finish = useMutation({
    mutationFn: () =>
      apiClient.post('/api/v1/portfolio/settings', {
        startingCapital: capital,
        tradingStyle:    style,
        onboardingDone:  true,
      }).catch(() => Promise.resolve()), // non-blocking if endpoint missing
    onSettled: () => {
      localStorage.setItem('onboarding_done', 'true');
      router.push('/trading/dashboard');
    },
  });

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else finish.mutate();
  };
  const prev = () => { if (step > 0) setStep(s => s - 1); };

  const canNext =
    step === 0 ? true :
    step === 1 ? capital > 0 :
    step === 2 ? !!style :
    true;

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-[#161616] border border-[#262626] rounded-2xl shadow-2xl overflow-hidden">

          {/* Progress bar */}
          <div className="h-1 bg-[#1e1e1e]">
            <div
              className="h-full bg-[#00d4a0] transition-all duration-500 ease-out"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-between px-6 pt-4 pb-0">
            <div className="flex items-center gap-2">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i < step ? 'bg-[#00d4a0]' : i === step ? 'bg-[#00d4a0] scale-125' : 'bg-[#2a2a2a]'
                  }`} />
                  {i < STEPS.length - 1 && (
                    <div className={`w-4 h-px ${i < step ? 'bg-[#00d4a040]' : 'bg-[#1e1e1e]'}`} />
                  )}
                </div>
              ))}
            </div>
            <span className="text-[11px] text-gray-600">{step + 1} of {STEPS.length}</span>
          </div>

          {/* Content */}
          <div className="px-6 pb-4">
            {step === 0 && <WelcomeStep name={user?.username || 'Trader'} />}
            {step === 1 && <CapitalStep capital={capital} setCapital={setCapital} />}
            {step === 2 && <StyleStep   style={style}     setStyle={setStyle}     />}
            {step === 3 && <TourStep />}
            {step === 4 && <DoneStep capital={capital} />}
          </div>

          {/* Footer nav */}
          <div className="flex items-center gap-3 px-6 pb-6">
            {step > 0 && step < STEPS.length - 1 && (
              <button
                onClick={prev}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white bg-[#1a1a1a] border border-[#262626] hover:border-[#333] transition-colors"
              >
                <ChevronLeft size={15} /> Back
              </button>
            )}
            <button
              onClick={next}
              disabled={!canNext || finish.isPending}
              className="flex-1 flex items-center justify-center gap-2 bg-[#00d4a0] hover:bg-[#00b388] disabled:opacity-50 text-black font-bold text-sm py-3 rounded-xl transition-all shadow-lg shadow-[#00d4a020]"
            >
              {finish.isPending
                ? <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Setting up...</>
                : step === STEPS.length - 1
                ? <><Zap size={16} /> Launch Dashboard</>
                : <>Continue <ChevronRight size={15} /></>
              }
            </button>
          </div>

          {/* Skip link */}
          {step < STEPS.length - 1 && (
            <div className="text-center pb-4">
              <button
                onClick={() => { localStorage.setItem('onboarding_done', 'true'); router.push('/trading/dashboard'); }}
                className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors underline underline-offset-2"
              >
                Skip setup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}