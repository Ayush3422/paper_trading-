'use client';
import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CrosshairMode } from 'lightweight-charts';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useMarketStore } from '@/lib/store/market.store';

const INTERVALS = ['1m','5m','15m','1H','4H','1D','1W'] as const;
type Interval = typeof INTERVALS[number];

interface Props { symbol: string; height?: number; }

export function StockChart({ symbol, height = 400 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [interval, setInterval] = useState<Interval>('1D');
  const tick = useMarketStore(s => s.prices[symbol]);

  const toDate = new Date().toISOString().split('T')[0];
  const fromDate = new Date(Date.now() - 365 * 86400000).toISOString().split('T')[0];

  const { data: candles, isLoading } = useQuery({
    queryKey: ['ohlcv', symbol, interval],
    queryFn: () => apiClient.get(`/api/v1/market/ohlcv/${symbol}?interval=${interval}&from=${fromDate}&to=${toDate}`).then(r => r.data.data),
    staleTime: 60000,
    enabled: !!symbol,
  });

  // Init chart
  useEffect(() => {
    if (!containerRef.current) return;
    chartRef.current = createChart(containerRef.current, {
      layout: { background: { color: '#161616' }, textColor: '#888' },
      grid: { vertLines: { color: '#1e1e1e' }, horzLines: { color: '#1e1e1e' } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#262626' },
      timeScale: { borderColor: '#262626', timeVisible: true },
      width: containerRef.current.clientWidth,
      height,
    });

    candleRef.current = chartRef.current.addCandlestickSeries({
      upColor: '#00d4a0', downColor: '#ff4d4d',
      borderUpColor: '#00d4a0', borderDownColor: '#ff4d4d',
      wickUpColor: '#00d4a0', wickDownColor: '#ff4d4d',
    });

    volumeRef.current = chartRef.current.addHistogramSeries({
      color: '#262626', priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    chartRef.current.priceScale('volume').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    const observer = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current)
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
    });
    observer.observe(containerRef.current);

    return () => { observer.disconnect(); chartRef.current?.remove(); };
  }, [height]);

  // Update data
  useEffect(() => {
    if (!candles?.length || !candleRef.current || !volumeRef.current) return;
    candleRef.current.setData(candles);
    volumeRef.current.setData(candles.map((c: any) => ({
      time: c.time, value: c.volume, color: c.close >= c.open ? '#00d4a020' : '#ff4d4d20',
    })));
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  // Live tick update
  useEffect(() => {
    if (!tick || !candleRef.current || !candles?.length) return;
    const last = candles[candles.length - 1];
    candleRef.current.update({ time: last.time, open: last.open, high: Math.max(last.high, tick.price), low: Math.min(last.low, tick.price), close: tick.price });
  }, [tick]);

  return (
    <div className="bg-[#161616] border border-[#262626] rounded-xl overflow-hidden">
      {/* Interval selector */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-[#262626]">
        {INTERVALS.map(iv => (
          <button key={iv} onClick={() => setInterval(iv)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${interval === iv ? 'bg-[#00d4a020] text-[#00d4a0]' : 'text-gray-500 hover:text-gray-300'}`}>
            {iv}
          </button>
        ))}
      </div>
      {/* Chart */}
      <div className="relative">
        {isLoading && <div className="absolute inset-0 flex items-center justify-center bg-[#161616] z-10 text-gray-500 text-sm">Loading chart...</div>}
        <div ref={containerRef} style={{ height }} />
      </div>
    </div>
  );
}
