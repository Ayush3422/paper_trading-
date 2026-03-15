'use client';
import { useEffect, useRef, useState } from 'react';

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAnimatedCounter(
  target: number,
  duration = 1200,
  delay = 0,
  decimals = 2
) {
  const [value, setValue] = useState(0);
  const frameRef   = useRef<number>();
  const startRef   = useRef<number>();
  const prevTarget = useRef<number>(0);

  useEffect(() => {
    if (isNaN(target)) return;
    const from = prevTarget.current;
    prevTarget.current = target;

    const startAnimation = () => {
      startRef.current = undefined;

      const animate = (timestamp: number) => {
        if (!startRef.current) startRef.current = timestamp;
        const elapsed  = timestamp - startRef.current;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = from + (target - from) * eased;

        setValue(parseFloat(current.toFixed(decimals)));

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(animate);
        } else {
          setValue(target);
        }
      };

      frameRef.current = requestAnimationFrame(animate);
    };

    const timer = setTimeout(startAnimation, delay);
    return () => {
      clearTimeout(timer);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration, delay, decimals]);

  return value;
}

// ── Component ─────────────────────────────────────────────────────────────────
interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  delay?: number;
  className?: string;
  colorize?: boolean; // green if positive, red if negative
  showSign?: boolean;
}

export function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  decimals = 2,
  duration = 1200,
  delay = 0,
  className = '',
  colorize = false,
  showSign = false,
}: AnimatedNumberProps) {
  const animated = useAnimatedCounter(value, duration, delay, decimals);
  const isUp     = value >= 0;

  const colorClass = colorize
    ? isUp ? 'text-[#00d4a0]' : 'text-[#ff4d4d]'
    : '';

  const sign = showSign && value > 0 ? '+' : '';

  return (
    <span className={`tabular-nums ${colorClass} ${className}`}>
      {sign}{prefix}{animated.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}{suffix}
    </span>
  );
}

// ── Portfolio value with flash ─────────────────────────────────────────────────
interface FlashValueProps {
  value: number;
  prefix?: string;
  decimals?: number;
  className?: string;
}

export function FlashValue({ value, prefix = '$', decimals = 2, className = '' }: FlashValueProps) {
  const [flash, setFlash]   = useState<'up' | 'down' | null>(null);
  const prevValue           = useRef(value);

  useEffect(() => {
    if (value === prevValue.current) return;
    setFlash(value > prevValue.current ? 'up' : 'down');
    prevValue.current = value;
    const t = setTimeout(() => setFlash(null), 700);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <span className={`tabular-nums transition-colors duration-300 font-mono font-bold ${
      flash === 'up'   ? 'text-[#00d4a0]' :
      flash === 'down' ? 'text-[#ff4d4d]' : ''
    } ${className}`}>
      {prefix}{value.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </span>
  );
}