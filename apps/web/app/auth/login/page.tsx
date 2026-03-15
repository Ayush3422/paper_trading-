'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, Eye, EyeOff, ArrowRight, Zap } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

export default function LoginPage() {
  const router  = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [show,    setShow]    = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiClient.post('/api/v1/auth/login', form);
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);
      toast.success('Welcome back!');
      router.push('/trading/dashboard');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: '#04050d' }}>

      {/* ── Animated background orbs ─────────────────────────── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Orb 1 — green */}
        <div className="absolute animate-float"
          style={{
            width: 600, height: 600,
            top: '-200px', left: '-100px',
            background: 'radial-gradient(circle, rgba(0, 229, 160, 0.08) 0%, transparent 70%)',
            animationDelay: '0s', animationDuration: '8s',
          }} />
        {/* Orb 2 — blue */}
        <div className="absolute animate-float"
          style={{
            width: 500, height: 500,
            bottom: '-150px', right: '-100px',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
            animationDelay: '-3s', animationDuration: '10s',
          }} />
        {/* Orb 3 — purple */}
        <div className="absolute animate-float"
          style={{
            width: 400, height: 400,
            top: '40%', right: '30%',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%)',
            animationDelay: '-6s', animationDuration: '12s',
          }} />
        {/* Grid */}
        <div className="absolute inset-0 bg-grid opacity-30" />
      </div>

      {/* ── Card ─────────────────────────────────────────────── */}
      <div className="relative w-full max-w-sm mx-4 animate-fade-in-scale">

        {/* Glow behind card */}
        <div className="absolute -inset-4 rounded-3xl opacity-30 blur-2xl"
          style={{ background: 'radial-gradient(ellipse, rgba(0, 229, 160, 0.15), transparent 70%)' }} />

        <div className="relative rounded-3xl p-8 overflow-hidden"
          style={{
            background: 'rgba(11, 12, 23, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(40px)',
            boxShadow: '0 32px 80px rgba(0, 0, 0, 0.7), 0 1px 0 rgba(255,255,255,0.05) inset',
          }}>

          {/* Top gradient line */}
          <div className="absolute top-0 left-8 right-8 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(0, 229, 160, 0.6), transparent)' }} />

          {/* ── Logo ─────────────────────────────────────────── */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 relative"
              style={{
                background: 'linear-gradient(135deg, #00e5a0, #00c4ff)',
                boxShadow: '0 8px 32px rgba(0, 229, 160, 0.4)',
              }}>
              <TrendingUp size={26} className="text-[#04050d]" strokeWidth={2.5} />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent" />
            </div>
            <h1 className="text-2xl font-bold text-white text-center"
              style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.03em' }}>
              PaperTrade
            </h1>
            <p className="text-[#4a5275] text-sm mt-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Neural Grid Trading Platform
            </p>
          </div>

          {/* ── Form ─────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#4a5275] uppercase tracking-widest mb-1.5">
                Email
              </label>
              <input
                type="email" required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="trader@example.com"
                className="w-full h-11 px-4 text-sm rounded-xl outline-none transition-all"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#f0f2ff',
                  fontFamily: 'Outfit, sans-serif',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'rgba(0, 229, 160, 0.5)';
                  e.target.style.background  = 'rgba(0, 229, 160, 0.04)';
                  e.target.style.boxShadow   = '0 0 0 3px rgba(0, 229, 160, 0.08)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.target.style.background  = 'rgba(255, 255, 255, 0.04)';
                  e.target.style.boxShadow   = 'none';
                }}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#4a5275] uppercase tracking-widest mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'} required
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full h-11 px-4 pr-11 text-sm rounded-xl outline-none transition-all"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#f0f2ff',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = 'rgba(0, 229, 160, 0.5)';
                    e.target.style.background  = 'rgba(0, 229, 160, 0.04)';
                    e.target.style.boxShadow   = '0 0 0 3px rgba(0, 229, 160, 0.08)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.target.style.background  = 'rgba(255, 255, 255, 0.04)';
                    e.target.style.boxShadow   = 'none';
                  }}
                />
                <button type="button" onClick={() => setShow(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a5275] hover:text-[#8892b0] transition-colors">
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 relative overflow-hidden transition-all mt-2"
              style={{
                background: loading ? 'rgba(0, 229, 160, 0.3)' : 'linear-gradient(135deg, #00e5a0, #00c4ff)',
                color: '#04050d',
                fontFamily: 'Syne, sans-serif',
                boxShadow: loading ? 'none' : '0 4px 24px rgba(0, 229, 160, 0.4)',
                transform: loading ? 'none' : undefined,
              }}>
              {loading ? (
                <div className="w-4 h-4 border-2 border-[#04050d]/30 border-t-[#04050d] rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
              {/* Shine effect */}
              {!loading && <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-500" />}
            </button>
          </form>

          {/* ── Footer ───────────────────────────────────────── */}
          <div className="mt-6 text-center">
            <p className="text-[#4a5275] text-xs" style={{ fontFamily: 'Outfit, sans-serif' }}>
              No account?{' '}
              <Link href="/auth/register" className="text-[#00e5a0] font-semibold hover:text-[#00c4ff] transition-colors">
                Create one free
              </Link>
            </p>
          </div>

          {/* ── Feature pills ────────────────────────────────── */}
          <div className="mt-6 pt-5 border-t border-white/[0.06] flex items-center justify-center gap-3 flex-wrap">
            {['Real Market Data', 'Algo Trading', 'Risk Free'].map(f => (
              <div key={f} className="flex items-center gap-1.5 text-[10px] text-[#4a5275]">
                <Zap size={9} className="text-[#00e5a0]" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}