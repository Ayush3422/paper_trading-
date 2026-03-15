'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, Eye, EyeOff, ArrowRight, Zap, Mail, Lock, User, CheckCircle, ChevronLeft, BarChart2, Bot, Trophy } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

const PERKS = [
  { icon: BarChart2, title: '$100,000 virtual cash', desc: 'Start trading immediately with paper money', color: '#00e5a0' },
  { icon: Bot,       title: 'Algo trading engine',   desc: '30+ strategy templates, full backtesting',  color: '#8b5cf6' },
  { icon: Trophy,    title: 'Global leaderboard',    desc: 'Compete with traders worldwide',             color: '#f59e0b' },
];

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', ok: password.length >= 8 },
    { label: 'Uppercase',     ok: /[A-Z]/.test(password) },
    { label: 'Number',        ok: /\d/.test(password) },
  ];
  const strength = checks.filter(c => c.ok).length;
  const colors   = ['#4a5275', '#f43f5e', '#f59e0b', '#00e5a0'];
  const labels   = ['', 'Weak', 'Fair', 'Strong'];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: i < strength ? colors[strength] : 'rgba(255,255,255,0.06)' }} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          {checks.map(c => (
            <div key={c.label} className="flex items-center gap-1 text-[10px]" style={{ color: c.ok ? '#00e5a0' : '#4a5275' }}>
              <div className={`w-1 h-1 rounded-full ${c.ok ? 'bg-[#00e5a0]' : 'bg-[#4a5275]'}`} />
              {c.label}
            </div>
          ))}
        </div>
        <span className="text-[10px] font-semibold transition-colors" style={{ color: colors[strength] }}>
          {labels[strength]}
        </span>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router  = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);
  const [form, setForm]       = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [show, setShow]       = useState({ pass: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [step, setStep]       = useState<'form' | 'success'>('form');

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const res = await apiClient.post('/api/v1/auth/register', {
        username: form.username,
        email:    form.email,
        password: form.password,
      });
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);
      setStep('success');
      setTimeout(() => router.push('/trading/dashboard'), 2000);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ───────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#04050d' }}>
        <div className="text-center animate-fade-in-scale">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-glow"
            style={{ background: 'linear-gradient(135deg, #00e5a0, #00c4ff)', boxShadow: '0 0 40px rgba(0,229,160,0.5)' }}>
            <CheckCircle size={40} className="text-[#04050d]" strokeWidth={2.5} />
          </div>
          <h2 className="text-3xl font-black text-white mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
            Account created! 🚀
          </h2>
          <p className="text-[#4a5275] text-sm">Taking you to your dashboard...</p>
          <div className="mt-4 w-48 h-1 rounded-full overflow-hidden mx-auto" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full bg-[#00e5a0] rounded-full animate-pulse" style={{ width: '100%', transition: 'width 2s linear' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: '#04050d', fontFamily: 'Outfit, sans-serif' }}>

      {/* ── Left — Perks panel ──────────────────────────────── */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #04050d 0%, #080b1a 100%)' }}>

        {/* Orbs */}
        <div className="absolute" style={{ width: 700, height: 700, top: '-200px', right: '-200px', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 65%)', borderRadius: '50%', animation: 'float 10s ease-in-out infinite' }} />
        <div className="absolute" style={{ width: 500, height: 500, bottom: '-100px', left: '-100px', background: 'radial-gradient(circle, rgba(0,229,160,0.08) 0%, transparent 65%)', borderRadius: '50%', animation: 'float 8s ease-in-out infinite', animationDelay: '-4s' }} />
        <div className="absolute inset-0 bg-grid opacity-15" />

        <div className="relative z-10 flex flex-col h-full p-12">
          <Link href="/" className="flex items-center gap-2.5 group w-fit">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
              style={{ background: 'linear-gradient(135deg, #00e5a0, #00c4ff)', boxShadow: '0 4px 20px rgba(0,229,160,0.4)' }}>
              <TrendingUp size={18} className="text-[#04050d]" strokeWidth={2.5} />
            </div>
            <span className="text-white font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>PaperTrade</span>
          </Link>

          <div className="flex-1 flex flex-col justify-center max-w-xs">
            <div className="mb-4 px-3 py-1.5 rounded-full w-fit flex items-center gap-2"
              style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <Zap size={11} className="text-[#8b5cf6]" />
              <span className="text-[11px] text-[#8b5cf6] font-semibold uppercase tracking-widest">Free Forever</span>
            </div>

            <h2 className="text-4xl font-black text-white mb-4" style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.04em' }}>
              Start your trading
              <br />
              <span style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                journey today.
              </span>
            </h2>
            <p className="text-[#4a5275] text-sm leading-relaxed mb-10">
              Everything you need to master trading — from live charts to AI-powered strategies.
            </p>

            <div className="space-y-5">
              {PERKS.map(({ icon: Icon, title, desc, color }, i) => (
                <div key={title} className="flex items-start gap-4 animate-slide-left"
                  style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                    <Icon size={18} style={{ color }} strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{title}</p>
                    <p className="text-xs text-[#4a5275] mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Social proof */}
            <div className="mt-10 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex -space-x-2 mb-2">
                {['A', 'P', 'R', 'K'].map((l, i) => (
                  <div key={i} className="w-7 h-7 rounded-full border-2 border-[#04050d] flex items-center justify-center text-[10px] font-bold"
                    style={{ background: ['#00e5a0', '#3b82f6', '#8b5cf6', '#f59e0b'][i], color: '#04050d', fontFamily: 'Syne, sans-serif', zIndex: 4 - i }}>
                    {l}
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#4a5275]">
                <span className="text-white font-semibold">50,000+ traders</span> already practice here
              </p>
            </div>
          </div>

          <p className="text-[#4a5275] text-xs">© 2026 PaperTrade · Neural Grid Platform</p>
        </div>
      </div>

      {/* ── Right — Registration form ───────────────────────── */}
      <div className="flex-1 lg:max-w-[480px] flex flex-col items-center justify-center px-6 py-10 relative overflow-y-auto"
        style={{ background: 'rgba(7, 8, 16, 0.95)', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>

        <Link href="/" className="absolute top-6 left-6 flex items-center gap-1.5 text-[#4a5275] hover:text-white text-xs transition-colors">
          <ChevronLeft size={14} />
          <span>Home</span>
        </Link>

        <div className={`w-full max-w-sm transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00e5a0, #00c4ff)', boxShadow: '0 4px 16px rgba(0,229,160,0.4)' }}>
              <TrendingUp size={16} className="text-[#04050d]" strokeWidth={2.5} />
            </div>
            <span className="text-white font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>PaperTrade</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.03em' }}>
              Create account
            </h1>
            <p className="text-[#4a5275] text-sm">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-semibold transition-colors hover:text-[#00c4ff]" style={{ color: '#00e5a0' }}>
                Sign in →
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#4a5275] uppercase tracking-widest">Username</label>
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4a5275] pointer-events-none" />
                <input type="text" required value={form.username} minLength={3}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  placeholder="tradingpro"
                  className="w-full h-12 pl-10 pr-4 text-sm rounded-xl outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f0f2ff', fontFamily: 'JetBrains Mono, monospace' }}
                  onFocus={e => Object.assign(e.target.style, { borderColor: 'rgba(0,229,160,0.5)', background: 'rgba(0,229,160,0.04)', boxShadow: '0 0 0 3px rgba(0,229,160,0.08)' })}
                  onBlur={e => Object.assign(e.target.style, { borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', boxShadow: 'none' })}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#4a5275] uppercase tracking-widest">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4a5275] pointer-events-none" />
                <input type="email" required value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="w-full h-12 pl-10 pr-4 text-sm rounded-xl outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f0f2ff', fontFamily: 'Outfit, sans-serif' }}
                  onFocus={e => Object.assign(e.target.style, { borderColor: 'rgba(0,229,160,0.5)', background: 'rgba(0,229,160,0.04)', boxShadow: '0 0 0 3px rgba(0,229,160,0.08)' })}
                  onBlur={e => Object.assign(e.target.style, { borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', boxShadow: 'none' })}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#4a5275] uppercase tracking-widest">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4a5275] pointer-events-none" />
                <input type={show.pass ? 'text' : 'password'} required value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min. 8 characters"
                  className="w-full h-12 pl-10 pr-11 text-sm rounded-xl outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f0f2ff', fontFamily: 'JetBrains Mono, monospace' }}
                  onFocus={e => Object.assign(e.target.style, { borderColor: 'rgba(0,229,160,0.5)', background: 'rgba(0,229,160,0.04)', boxShadow: '0 0 0 3px rgba(0,229,160,0.08)' })}
                  onBlur={e => Object.assign(e.target.style, { borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', boxShadow: 'none' })}
                />
                <button type="button" onClick={() => setShow(s => ({ ...s, pass: !s.pass }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a5275] hover:text-white transition-colors">
                  {show.pass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <PasswordStrength password={form.password} />
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#4a5275] uppercase tracking-widest">Confirm Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4a5275] pointer-events-none" />
                <input type={show.confirm ? 'text' : 'password'} required value={form.confirmPassword}
                  onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  placeholder="Repeat password"
                  className="w-full h-12 pl-10 pr-11 text-sm rounded-xl outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${form.confirmPassword && form.confirmPassword !== form.password ? 'rgba(244,63,94,0.5)' : form.confirmPassword && form.confirmPassword === form.password ? 'rgba(0,229,160,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    color: '#f0f2ff', fontFamily: 'JetBrains Mono, monospace'
                  }}
                  onFocus={e => Object.assign(e.target.style, { boxShadow: '0 0 0 3px rgba(0,229,160,0.08)' })}
                  onBlur={e => Object.assign(e.target.style, { boxShadow: 'none' })}
                />
                <button type="button" onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a5275] hover:text-white transition-colors">
                  {show.confirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                {form.confirmPassword && form.confirmPassword === form.password && (
                  <CheckCircle size={14} className="absolute right-8 top-1/2 -translate-y-1/2 text-[#00e5a0]" />
                )}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="relative w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 overflow-hidden mt-2 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: loading ? 'rgba(0,229,160,0.4)' : 'linear-gradient(135deg, #00e5a0, #00c4ff)', color: '#04050d', fontFamily: 'Syne, sans-serif', boxShadow: loading ? 'none' : '0 4px 24px rgba(0,229,160,0.35)' }}>
              {loading ? (
                <div className="w-4 h-4 border-2 border-[#04050d]/30 border-t-[#04050d] rounded-full animate-spin" />
              ) : (
                <>Create Account — It's Free <ArrowRight size={15} strokeWidth={2.5} /></>
              )}
              {!loading && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700 pointer-events-none" />}
            </button>

            <p className="text-[10px] text-[#4a5275] text-center leading-relaxed">
              By creating an account you agree to our terms. No real money · No credit card required.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}