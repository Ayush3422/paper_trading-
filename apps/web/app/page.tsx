'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import BlurText from '@/components/ui/BlurText';
import PillNav from '@/components/layout/PillNav';

// GhostCursor must be loaded client-side only (Three.js uses browser APIs)
const GhostCursor = dynamic(
  () => import('@/components/ui/GhostCursor'),
  { ssr: false }
);
import {
  TrendingUp, TrendingDown, BarChart2, Bot, Zap, Shield,
  Trophy, Globe, ArrowRight, ChevronDown, Activity,
  LineChart, Cpu, Lock, Star, Home
} from 'lucide-react';

// ── Animated counter ──────────────────────────────────────────────
function Counter({ end, prefix = '', suffix = '', duration = 2000 }: {
  end: number; prefix?: string; suffix?: string; duration?: number;
}) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      observer.disconnect();
      let start = 0;
      const step = end / (duration / 16);
      const tick = () => {
        start = Math.min(start + step, end);
        setVal(Math.floor(start));
        if (start < end) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

// ── Floating orb ─────────────────────────────────────────────────
function Orb({ x, y, size, color, delay }: { x: string; y: string; size: number; color: string; delay: number }) {
  return (
    <div className="absolute pointer-events-none select-none"
      style={{
        left: x, top: y, width: size, height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        borderRadius: '50%',
        animation: `float ${6 + delay}s ease-in-out infinite`,
        animationDelay: `${-delay}s`,
        filter: 'blur(1px)',
      }} />
  );
}

// ── Animated grid canvas ──────────────────────────────────────────
function GridCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf: number;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    // Nodes
    const nodes = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width)  n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });
      // Connections
      nodes.forEach((a, i) => nodes.slice(i + 1).forEach(b => {
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 140) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(0, 229, 160, ${(1 - d / 140) * 0.12})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }));
      // Dots
      nodes.forEach(n => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 229, 160, 0.25)';
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

// ── Ticker tape ───────────────────────────────────────────────────
const TICKERS = [
  { sym: 'AAPL', price: '213.18', chg: '+1.24%', up: true },
  { sym: 'NVDA', price: '875.40', chg: '+3.82%', up: true },
  { sym: 'TSLA', price: '248.50', chg: '-2.14%', up: false },
  { sym: 'MSFT', price: '415.32', chg: '+0.76%', up: true },
  { sym: 'GOOGL', price: '178.90', chg: '+1.55%', up: true },
  { sym: 'AMZN', price: '198.72', chg: '-0.33%', up: false },
  { sym: 'META', price: '524.11', chg: '+2.91%', up: true },
  { sym: 'SPY',  price: '558.24', chg: '+0.88%', up: true },
  { sym: 'BTC',  price: '67,420', chg: '+4.21%', up: true },
  { sym: 'AMD',  price: '162.45', chg: '-1.07%', up: false },
];

function TickerTape() {
  const items = [...TICKERS, ...TICKERS];
  return (
    <div className="relative overflow-hidden py-2.5 border-y" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)' }}>
      <div className="flex gap-0 ticker-tape">
        {items.map((t, i) => (
          <div key={i} className="flex items-center gap-3 px-6 border-r flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <span className="text-[11px] font-bold text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{t.sym}</span>
            <span className="text-[11px] text-[#8892b0]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>${t.price}</span>
            <span className={`text-[11px] font-semibold ${t.up ? 'text-[#00e5a0]' : 'text-[#f43f5e]'}`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {t.up ? '▲' : '▼'} {t.chg}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Feature card ──────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, accent, delay }: {
  icon: any; title: string; desc: string; accent: string; delay: number;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div className="relative rounded-2xl p-6 overflow-hidden cursor-default transition-all duration-300 group"
      style={{
        background: hovered ? `rgba(${accent === '#00e5a0' ? '0,229,160' : accent === '#3b82f6' ? '59,130,246' : accent === '#8b5cf6' ? '139,92,246' : '245,158,11'}, 0.05)` : 'rgba(11, 12, 23, 0.7)',
        border: `1px solid ${hovered ? `${accent}30` : 'rgba(255,255,255,0.07)'}`,
        backdropFilter: 'blur(20px)',
        transform: hovered ? 'translateY(-4px) scale(1.01)' : 'none',
        boxShadow: hovered ? `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${accent}15` : '0 4px 24px rgba(0,0,0,0.3)',
        animationDelay: `${delay}ms`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>

      {/* Top glow line */}
      <div className="absolute top-0 left-6 right-6 h-px transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}60, transparent)`, opacity: hovered ? 1 : 0 }} />

      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-10 transition-opacity duration-300"
        style={{ background: `radial-gradient(circle at top right, ${accent}, transparent)`, opacity: hovered ? 0.15 : 0 }} />

      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-all duration-300"
        style={{
          background: `${accent}15`,
          border: `1px solid ${accent}25`,
          boxShadow: hovered ? `0 0 20px ${accent}30` : 'none',
        }}>
        <Icon size={20} style={{ color: accent }} strokeWidth={1.75} />
      </div>
      <h3 className="text-base font-bold text-white mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>{title}</h3>
      <p className="text-sm text-[#4a5275] leading-relaxed" style={{ fontFamily: 'Outfit, sans-serif' }}>{desc}</p>
    </div>
  );
}

// ── Mini chart mock ────────────────────────────────────────────────
function MiniChart({ up }: { up: boolean }) {
  const points = up
    ? [40,38,42,35,45,43,50,48,55,52,60,58,65]
    : [65,60,62,55,58,50,52,45,48,42,38,40,35];
  const max = Math.max(...points), min = Math.min(...points);
  const norm = (v: number) => 40 - ((v - min) / (max - min)) * 35;
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i / (points.length - 1)) * 100} ${norm(p)}`).join(' ');
  const fill = d + ` L 100 40 L 0 40 Z`;
  return (
    <svg viewBox="0 0 100 40" className="w-full h-12" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g-${up}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={up ? '#00e5a0' : '#f43f5e'} stopOpacity="0.3" />
          <stop offset="100%" stopColor={up ? '#00e5a0' : '#f43f5e'} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#g-${up})`} />
      <path d={d} fill="none" stroke={up ? '#00e5a0' : '#f43f5e'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Stock card mock ───────────────────────────────────────────────
function StockCard({ sym, name, price, chg, up, delay }: any) {
  return (
    <div className="rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex-shrink-0 w-44"
      style={{
        background: 'rgba(11, 12, 23, 0.9)',
        border: `1px solid ${up ? 'rgba(0,229,160,0.15)' : 'rgba(244,63,94,0.15)'}`,
        backdropFilter: 'blur(20px)',
        animationDelay: `${delay}ms`,
      }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{sym}</span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${up ? 'text-[#00e5a0] bg-[#00e5a015]' : 'text-[#f43f5e] bg-[#f43f5e15]'}`}>
          {chg}
        </span>
      </div>
      <p className="text-[10px] text-[#4a5275] mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>{name}</p>
      <MiniChart up={up} />
      <p className="text-sm font-bold mt-1" style={{ fontFamily: 'JetBrains Mono, monospace', color: up ? '#00e5a0' : '#f43f5e' }}>${price}</p>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────
export default function HomePage() {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <div className="min-h-screen bg-[#04050d] overflow-x-hidden" style={{ fontFamily: 'Outfit, sans-serif' }}>

      {/* ── GhostCursor: fixed full-page plasma cursor effect ── */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9,
        pointerEvents: 'none',
      }}>
        <GhostCursor
          color="#00e5a0"
          brightness={2.5}
          edgeIntensity={0.12}
          trailLength={65}
          inertia={0.42}
          grainIntensity={0.04}
          bloomStrength={0.14}
          bloomRadius={1.2}
          bloomThreshold={0.02}
          fadeDelayMs={900}
          fadeDurationMs={1400}
          mixBlendMode="screen"
          zIndex={9}
        />
      </div>

      {/* ════════════════════════════════════════════════════
          NAVBAR
      ════════════════════════════════════════════════════ */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 h-16 transition-all duration-300"
        style={{
          background: scrollY > 40 ? 'rgba(4, 5, 13, 0.9)' : 'transparent',
          backdropFilter: scrollY > 40 ? 'blur(20px)' : 'none',
          borderBottom: scrollY > 40 ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        }}>
        
        <div className="flex-1 flex items-center">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
              style={{ background: 'linear-gradient(135deg, #00e5a0, #00c4ff)', boxShadow: '0 4px 16px rgba(0,229,160,0.4)' }}>
              <TrendingUp size={16} className="text-[#04050d]" strokeWidth={2.5} />
            </div>
            <span className="text-white font-bold text-base" style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}>PaperTrade</span>
          </Link>
        </div>

        <div className="flex-1 hidden md:flex justify-center mt-1">
          <PillNav
            logo={<Home size={18} strokeWidth={2.5} />}
            logoHref="/"
            items={[
              { label: 'Features', href: '#features' },
              { label: 'Markets', href: '#markets' },
              { label: 'Algo', href: '#algo' },
              { label: 'Leaderboard', href: '#leaderboard' }
            ]}
            className="custom-nav"
            ease="power2.easeOut"
            baseColor="rgba(255, 255, 255, 0.03)"
            pillColor="transparent"
            hoveredPillTextColor="#00e5a0"
            pillTextColor="#8892b0"
            initialLoadAnimation={false}
          />
        </div>

        <div className="flex-1 flex items-center justify-end gap-2">
          <Link href="/auth/login"
            className="hidden sm:block px-4 py-2 text-sm text-[#8892b0] hover:text-white transition-colors font-medium"
            style={{ fontFamily: 'Outfit, sans-serif' }}>
            Sign in
          </Link>
          <Link href="/auth/register"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={{
              background: 'linear-gradient(135deg, #00e5a0, #00c4ff)',
              color: '#04050d',
              boxShadow: '0 4px 16px rgba(0,229,160,0.3)',
              fontFamily: 'Syne, sans-serif',
            }}>
            Get Started Free
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          HERO SECTION
      ════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 overflow-hidden">

        {/* Animated canvas background */}
        <GridCanvas />

        {/* Gradient orbs */}
        <Orb x="-5%"  y="10%"  size={700} color="rgba(0, 229, 160, 0.06)"  delay={0} />
        <Orb x="70%"  y="5%"   size={600} color="rgba(59, 130, 246, 0.06)" delay={3} />
        <Orb x="40%"  y="60%"  size={500} color="rgba(139, 92, 246, 0.04)" delay={6} />
        <Orb x="-10%" y="60%"  size={400} color="rgba(245, 158, 11, 0.04)" delay={2} />

        {/* Radial center glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,229,160,0.06) 0%, transparent 60%)' }} />

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-5xl mx-auto">

          {/* Badge */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full mb-8 animate-fade-in-up"
            style={{
              background: 'rgba(0, 229, 160, 0.08)',
              border: '1px solid rgba(0, 229, 160, 0.2)',
              backdropFilter: 'blur(12px)',
              animationDelay: '0ms',
            }}>
            <div className="w-1.5 h-1.5 bg-[#00e5a0] rounded-full animate-pulse" />
            <span className="text-[#00e5a0] text-xs font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Real-time Polygon.io data · Algo trading · Zero risk
            </span>
            <Zap size={12} className="text-[#00e5a0]" />
          </div>

          {/* Headline — BlurText reveal on page load */}
          <div className="mb-6 flex flex-col items-center gap-0">

            {/* Line 1: "Trade like a" + gradient "pro." — split for styling */}
            <div className="flex items-baseline flex-wrap justify-center gap-x-4 md:gap-x-5">
              <BlurText
                text="Trade like a"
                delay={120}
                animateBy="words"
                direction="top"
                stepDuration={0.45}
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.95] text-white justify-center"
                animationFrom={{ filter: 'blur(14px)', opacity: 0, y: -40 }}
                animationTo={[
                  { filter: 'blur(6px)',  opacity: 0.4, y: -8 },
                  { filter: 'blur(0px)',  opacity: 1,   y: 0  },
                ]}
              />
              <BlurText
                text="pro."
                delay={200}
                animateBy="words"
                direction="top"
                stepDuration={0.45}
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.95] justify-center pro-gradient-text"
                animationFrom={{ filter: 'blur(14px)', opacity: 0, y: -40 }}
                animationTo={[
                  { filter: 'blur(6px)',  opacity: 0.4, y: -8 },
                  { filter: 'blur(0px)',  opacity: 1,   y: 0  },
                ]}
              />
            </div>

            {/* Gradient underline — appears after text */}
            <div
              className="h-0.5 rounded-full mt-1 mb-0.5 animate-fade-in"
              style={{
                width: '60%',
                background: 'linear-gradient(90deg, #00e5a0, #00c4ff, #8b5cf6)',
                boxShadow: '0 0 16px rgba(0,229,160,0.5)',
                animationDelay: '900ms',
                opacity: 0,
                animationFillMode: 'forwards',
              }}
            />

            {/* Line 2: "Risk-free." — delayed */}
            <BlurText
              text="Risk-free."
              delay={100}
              animateBy="words"
              direction="top"
              stepDuration={0.5}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.95] justify-center"
              style={{ color: '#8892b0' } as any}
              animationFrom={{ filter: 'blur(14px)', opacity: 0, y: -30 }}
              animationTo={[
                { filter: 'blur(6px)',  opacity: 0.4, y: -6 },
                { filter: 'blur(0px)',  opacity: 1,   y: 0  },
              ]}
            />
          </div>

          <p className="text-lg md:text-xl text-[#4a5275] max-w-2xl leading-relaxed mb-10 animate-fade-in-up"
            style={{ fontFamily: 'Outfit, sans-serif', animationDelay: '160ms' }}>
            Practice with{' '}
            <span className="text-white font-semibold">$100,000 virtual cash</span> and real-time market data.
            Build strategies, run backtests and deploy{' '}
            <span className="text-[#8b5cf6] font-semibold">AI-powered algo bots</span> — all with zero risk.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 animate-fade-in-up" style={{ animationDelay: '240ms' }}>
            <Link href="/auth/register"
              className="group relative flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold overflow-hidden transition-all hover:-translate-y-1"
              style={{
                background: 'linear-gradient(135deg, #00e5a0, #00c4ff)',
                color: '#04050d',
                fontFamily: 'Syne, sans-serif',
                boxShadow: '0 8px 32px rgba(0,229,160,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset',
              }}>
              <span>Start Trading Free</span>
              <TrendingUp size={18} strokeWidth={2.5} />
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
            </Link>
            <a href="#features"
              className="flex items-center gap-2 px-6 py-4 rounded-2xl text-sm font-semibold text-[#8892b0] hover:text-white transition-all hover:-translate-y-0.5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'Outfit, sans-serif' }}>
              See how it works
              <ChevronDown size={15} className="animate-bounce-subtle" />
            </a>
          </div>

          {/* Trust badges */}
          <div className="flex items-center gap-6 mt-10 animate-fade-in" style={{ animationDelay: '400ms' }}>
            {[
              { icon: Shield, text: 'No real money' },
              { icon: Activity, text: 'Live market data' },
              { icon: Bot, text: 'Algo trading' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-[11px] text-[#4a5275]">
                <Icon size={11} className="text-[#00e5a0]" />
                <span style={{ fontFamily: 'Outfit, sans-serif' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating stock cards */}
        <div className="absolute right-4 xl:right-[8%] top-1/4 hidden xl:flex flex-col gap-3 animate-fade-in-scale"
          style={{ animationDelay: '600ms' }}>
          <StockCard sym="NVDA" name="NVIDIA Corp" price="875.40" chg="+3.82%" up delay={0} />
          <StockCard sym="TSLA" name="Tesla Inc" price="248.50" chg="-2.14%" up={false} delay={100} />
        </div>
        <div className="absolute left-4 xl:left-[6%] top-1/3 hidden xl:flex flex-col gap-3 animate-fade-in-scale"
          style={{ animationDelay: '700ms' }}>
          <StockCard sym="AAPL" name="Apple Inc" price="213.18" chg="+1.24%" up delay={200} />
          <StockCard sym="META" name="Meta Platforms" price="524.11" chg="+2.91%" up delay={300} />
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in" style={{ animationDelay: '800ms' }}>
          <span className="text-[10px] text-[#4a5275] uppercase tracking-widest" style={{ fontFamily: 'Outfit, sans-serif' }}>Scroll</span>
          <div className="w-5 h-8 border border-[#1e2440] rounded-full flex items-start justify-center p-1">
            <div className="w-1 h-2 bg-[#00e5a0] rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          TICKER TAPE
      ════════════════════════════════════════════════════ */}
      <TickerTape />

      {/* ════════════════════════════════════════════════════
          FEATURES
      ════════════════════════════════════════════════════ */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
              style={{ background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.15)' }}>
              <Zap size={11} className="text-[#00e5a0]" />
              <span className="text-[11px] text-[#00e5a0] font-semibold uppercase tracking-widest">Features</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4"
              style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.03em' }}>
              Everything you need to{' '}
              <span style={{ background: 'linear-gradient(135deg, #00e5a0, #00c4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                master markets
              </span>
            </h2>
            <p className="text-[#4a5275] text-lg max-w-2xl mx-auto" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Professional-grade tools used by real traders — completely free, completely risk-free.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: LineChart,  title: 'Pro Charting',        desc: 'TradingView-grade candlestick charts with 20+ technical indicators — RSI, MACD, Bollinger Bands, Ichimoku and more.', accent: '#00e5a0', delay: 0 },
              { icon: Bot,        title: 'Algo Trading Engine', desc: 'Build visual strategies with 30+ templates. Backtest on years of data. Deploy live bots that trade automatically.', accent: '#8b5cf6', delay: 80 },
              { icon: Activity,   title: 'Real-time Data',      desc: 'Live prices via Polygon.io, real-time WebSocket price feeds, news sentiment and economic calendar.', accent: '#3b82f6', delay: 160 },
              { icon: BarChart2,  title: 'Portfolio Analytics', desc: 'Equity curves, Sharpe ratio, max drawdown, sector allocation, win rate and 15+ performance metrics.', accent: '#f59e0b', delay: 240 },
              { icon: Trophy,     title: 'Leaderboards',        desc: 'Compete globally. Weekly challenges, achievements and rankings to gamify your learning journey.', accent: '#f43f5e', delay: 320 },
              { icon: Shield,     title: 'Risk Management',     desc: 'Stop loss, take profit, trailing stop, ATR-based position sizing and Kelly Criterion — all built in.', accent: '#06b6d4', delay: 400 },
            ].map(f => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          ALGO SECTION
      ════════════════════════════════════════════════════ */}
      <section id="algo" className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 30% 50%, rgba(139,92,246,0.07), transparent)' }} />
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
              style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <Cpu size={11} className="text-[#8b5cf6]" />
              <span className="text-[11px] text-[#8b5cf6] font-semibold uppercase tracking-widest">Algo Trading</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-5" style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.03em' }}>
              Let AI trade for{' '}
              <span style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                you.
              </span>
            </h2>
            <p className="text-[#4a5275] text-lg leading-relaxed mb-8" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Build automated strategies with our visual builder. No coding required. Choose from 30+ proven templates including Golden Cross, RSI Reversal, MACD Momentum, Ichimoku Cloud and more.
            </p>
            <div className="space-y-3">
              {['Visual strategy builder with 20+ indicators', 'Full historical backtest with 15+ metrics', 'Live execution with real Polygon.io data', 'Stop loss · Take profit · Trailing stop'].map(f => (
                <div key={f} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6]" />
                  </div>
                  <span className="text-sm text-[#8892b0]" style={{ fontFamily: 'Outfit, sans-serif' }}>{f}</span>
                </div>
              ))}
            </div>
            <Link href="/auth/register" className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: 'white', fontFamily: 'Syne, sans-serif', boxShadow: '0 8px 24px rgba(139,92,246,0.3)' }}>
              Try Algo Trading <ArrowRight size={15} />
            </Link>
          </div>

          {/* Algo preview UI */}
          <div className="relative">
            <div className="rounded-2xl p-5 relative overflow-hidden"
              style={{ background: 'rgba(11,12,23,0.9)', border: '1px solid rgba(139,92,246,0.2)', backdropFilter: 'blur(20px)', boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 60px rgba(139,92,246,0.08)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Golden Cross Strategy</p>
                  <p className="text-[10px] text-[#4a5275]">MA50 × MA200 · SPY · 1D</p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-[#00e5a0] bg-[#00e5a015] border border-[#00e5a030]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00e5a0] animate-pulse" /> LIVE
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[['Return', '+32.4%', true], ['Win Rate', '54.2%', true], ['Sharpe', '1.84', true]].map(([l, v, up]) => (
                  <div key={l as string} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <p className="text-[9px] text-[#4a5275] uppercase tracking-wide mb-1">{l}</p>
                    <p className="text-sm font-bold font-mono" style={{ color: '#00e5a0' }}>{v}</p>
                  </div>
                ))}
              </div>
              {/* Fake equity curve */}
              <div className="h-24 relative">
                <svg viewBox="0 0 300 80" className="w-full h-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00e5a0" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#00e5a0" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0 70 L20 65 L40 60 L60 55 L70 58 L90 45 L110 40 L130 38 L150 35 L160 38 L180 28 L200 22 L220 18 L240 15 L260 12 L280 8 L300 5 L300 80 L0 80 Z" fill="url(#eq)" />
                  <path d="M0 70 L20 65 L40 60 L60 55 L70 58 L90 45 L110 40 L130 38 L150 35 L160 38 L180 28 L200 22 L220 18 L240 15 L260 12 L280 8 L300 5" fill="none" stroke="#00e5a0" strokeWidth="1.5" />
                </svg>
              </div>
              <div className="mt-3 flex gap-2">
                {['+ BUY signal', '↓ SELL signal', '✓ Order placed'].map((t, i) => (
                  <div key={i} className="text-[9px] px-2 py-1 rounded-full flex-1 text-center"
                    style={{ background: i === 0 ? 'rgba(0,229,160,0.1)' : i === 1 ? 'rgba(244,63,94,0.1)' : 'rgba(139,92,246,0.1)', color: i === 0 ? '#00e5a0' : i === 1 ? '#f43f5e' : '#8b5cf6', fontFamily: 'JetBrains Mono, monospace' }}>
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          TESTIMONIALS / SOCIAL PROOF
      ════════════════════════════════════════════════════ */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-1 mb-3">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={16} fill="#f59e0b" className="text-[#f59e0b]" />)}
            </div>
            <h2 className="text-3xl font-black text-white" style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.03em' }}>Loved by traders worldwide</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'Arjun S.', handle: '@arjuntrader', text: 'The algo trading feature is insane. Built a Golden Cross strategy, backtested 3 years, now it auto-trades every day. Up 34% this month!', accent: '#00e5a0' },
              { name: 'Priya M.', handle: '@priyainvests', text: 'Finally a paper trading app that actually feels professional. The charts, the indicators, the portfolio analytics — it\'s everything I need to practice seriously.', accent: '#3b82f6' },
              { name: 'Rahul K.', handle: '@rahulquant', text: 'The backtesting engine is incredibly accurate. Sharpe ratio, Sortino, Calmar, max drawdown — all the metrics a quant needs. This is genuinely impressive.', accent: '#8b5cf6' },
            ].map(({ name, handle, text, accent }, i) => (
              <div key={i} className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1"
                style={{ background: 'rgba(11,12,23,0.8)', border: `1px solid ${accent}20`, backdropFilter: 'blur(20px)' }}>
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, j) => <Star key={j} size={11} fill="#f59e0b" className="text-[#f59e0b]" />)}
                </div>
                <p className="text-sm text-[#8892b0] leading-relaxed mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>"{text}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: `${accent}20`, color: accent, fontFamily: 'Syne, sans-serif' }}>
                    {name[0]}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{name}</p>
                    <p className="text-[10px] text-[#4a5275]">{handle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          CTA SECTION
      ════════════════════════════════════════════════════ */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <Orb x="10%"  y="20%"  size={500} color="rgba(0,229,160,0.08)"  delay={0} />
          <Orb x="70%"  y="30%"  size={400} color="rgba(59,130,246,0.06)" delay={4} />
          <div className="absolute inset-0 bg-grid opacity-10" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-6"
            style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.04em' }}>
            Ready to start?
            <br />
            <span style={{ background: 'linear-gradient(135deg, #00e5a0, #00c4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              It's free.
            </span>
          </h2>
          <p className="text-[#4a5275] text-lg mb-10" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Join thousands of traders mastering the markets without risking a single dollar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register"
              className="group relative flex items-center gap-2.5 px-10 py-4 rounded-2xl text-lg font-bold overflow-hidden transition-all hover:-translate-y-1"
              style={{ background: 'linear-gradient(135deg, #00e5a0, #00c4ff)', color: '#04050d', fontFamily: 'Syne, sans-serif', boxShadow: '0 8px 40px rgba(0,229,160,0.4)' }}>
              Create Free Account
              <ArrowRight size={20} strokeWidth={2.5} />
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
            </Link>
          </div>
          <p className="text-[#4a5275] text-xs mt-4" style={{ fontFamily: 'Outfit, sans-serif' }}>No credit card · No real money · Start in 30 seconds</p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════ */}
      <footer className="py-10 px-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(4,5,13,0.8)' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00e5a0, #00c4ff)' }}>
              <TrendingUp size={14} className="text-[#04050d]" strokeWidth={2.5} />
            </div>
            <span className="text-white font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>PaperTrade</span>
          </div>
          <p className="text-[#4a5275] text-xs" style={{ fontFamily: 'Outfit, sans-serif' }}>
            © 2026 PaperTrade · Neural Grid Trading Platform · All rights reserved
          </p>
          <div className="flex items-center gap-4">
            {['Sign In', 'Register', 'Dashboard'].map(l => (
              <Link key={l} href={l === 'Sign In' ? '/auth/login' : l === 'Register' ? '/auth/register' : '/trading/dashboard'}
                className="text-[#4a5275] hover:text-white text-xs transition-colors" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {l}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}