'use client';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const RANGES = [
  { label: '1W',  days: 7   },
  { label: '1M',  days: 30  },
  { label: '3M',  days: 90  },
  { label: '6M',  days: 180 },
  { label: '1Y',  days: 365 },
  { label: 'ALL', days: 999 },
];

function generateMockCurve(days: number, startingCapital: number, currentValue: number) {
  const points = [];
  const now    = Date.now();
  let value    = startingCapital;
  const target = currentValue;
  const trend  = (target - startingCapital) / days;

  for (let i = days; i >= 0; i--) {
    const noise   = (Math.random() - 0.48) * startingCapital * 0.008;
    const dayTrend = trend * (1 + (Math.random() - 0.5) * 0.3);
    value = Math.max(startingCapital * 0.5, value + dayTrend + noise);
    const date = new Date(now - i * 86400000);
    points.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: date.toISOString().split('T')[0],
      value:  parseFloat(value.toFixed(2)),
      return: parseFloat(((value - startingCapital) / startingCapital * 100).toFixed(2)),
    });
  }
  // Force last point to match current
  if (points.length > 0) {
    points[points.length - 1].value  = currentValue;
    points[points.length - 1].return = parseFloat(((currentValue - startingCapital) / startingCapital * 100).toFixed(2));
  }
  return points;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d       = payload[0]?.payload;
  const isUp    = d?.return >= 0;
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2.5 shadow-2xl">
      <p className="text-[10px] text-gray-500 mb-1">{d?.fullDate}</p>
      <p className="text-sm font-mono font-bold text-white">
        ${d?.value?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </p>
      <p className={`text-xs font-mono font-medium ${isUp ? 'text-[#00d4a0]' : 'text-[#ff4d4d]'}`}>
        {isUp ? '+' : ''}{d?.return}%
      </p>
    </div>
  );
};

export function EquityCurve() {
  const [range, setRange]   = useState(1); // index into RANGES

  const { data: portfolio } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => apiClient.get('/api/v1/portfolio').then(r => r.data.data),
    refetchInterval: 30000,
  });

  const { data: history } = useQuery({
    queryKey: ['portfolio-history'],
    queryFn: () => apiClient.get('/api/v1/portfolio/history').then(r => r.data.data),
    staleTime: 60000,
  });

  const startingCapital = portfolio?.startingCapital || 100000;
  const currentValue    = portfolio?.totalValue      || 100000;
  const days            = RANGES[range].days;

  // Use real history if available, else generate mock
  const rawData = (history?.length > 0)
    ? history.slice(-days).map((s: any) => ({
        date:     new Date(s.snapshotDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: s.snapshotDate,
        value:    parseFloat(s.totalValue),
        return:   parseFloat(s.totalReturnPct),
      }))
    : generateMockCurve(Math.min(days, 365), startingCapital, currentValue);

  const data = rawData.length > 1 ? rawData : generateMockCurve(30, startingCapital, currentValue);

  const first    = data[0]?.value || startingCapital;
  const last     = data[data.length - 1]?.value || currentValue;
  const isUp     = last >= first;
  const retPct   = ((last - first) / first * 100).toFixed(2);
  const retAbs   = (last - first).toFixed(2);
  const minVal   = Math.min(...data.map((d: { value: number }) => d.value)) * 0.998;
  const maxVal   = Math.max(...data.map((d: { value: number }) => d.value)) * 1.002;

  const color = isUp ? '#00d4a0' : '#ff4d4d';

  return (
    <div className="bg-[#161616] border border-[#262626] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 border-b border-[#1e1e1e]">
        <div>
          <p className="text-xs text-gray-500 mb-1">Portfolio Value</p>
          <p className="text-2xl font-mono font-bold text-white">
            ${currentValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <div className={`flex items-center gap-1.5 mt-1 ${isUp ? 'text-[#00d4a0]' : 'text-[#ff4d4d]'}`}>
            {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            <span className="text-sm font-mono font-semibold">
              {isUp ? '+' : ''}{retAbs} ({isUp ? '+' : ''}{retPct}%)
            </span>
            <span className="text-xs text-gray-600">{RANGES[range].label}</span>
          </div>
        </div>

        {/* Range selector */}
        <div className="flex bg-[#1a1a1a] rounded-lg p-0.5 gap-0.5">
          {RANGES.map((r, i) => (
            <button key={r.label} onClick={() => setRange(i)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                range === i ? 'bg-[#00d4a0] text-black font-bold' : 'text-gray-500 hover:text-gray-200'
              }`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="px-2 pt-4 pb-2">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={color} stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#444', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[minVal, maxVal]}
              tick={{ fill: '#444', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `$${(v / 1000).toFixed(0)}K`}
              width={52}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={startingCapital}
              stroke="#333"
              strokeDasharray="4 4"
              label={{ value: 'Start', position: 'insideTopRight', fill: '#555', fontSize: 10 }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill="url(#equityGrad)"
              dot={false}
              activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}