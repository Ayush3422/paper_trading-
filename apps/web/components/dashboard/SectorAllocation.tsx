'use client';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

const SECTOR_COLORS = [
  '#00d4a0','#3b82f6','#f59e0b','#a855f7',
  '#ff4d4d','#06b6d4','#84cc16','#f97316',
  '#ec4899','#6366f1',
];

const SECTOR_MAP: Record<string, string> = {
  AAPL:'Technology', MSFT:'Technology', GOOGL:'Technology',
  AMZN:'Consumer Cyclical', META:'Technology', TSLA:'Consumer Cyclical',
  NVDA:'Technology', AMD:'Technology', INTC:'Technology',
  JPM:'Financial', BAC:'Financial', V:'Financial', MA:'Financial',
  JNJ:'Healthcare', ABBV:'Healthcare',
  WMT:'Consumer Defensive', PG:'Consumer Defensive',
  DIS:'Communication', NFLX:'Communication',
  XOM:'Energy', CVX:'Energy',
  SPY:'ETF', QQQ:'ETF',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2 shadow-xl">
      <p className="text-xs font-semibold text-white">{d.name}</p>
      <p className="text-sm font-mono font-bold mt-0.5" style={{ color: d.payload.fill }}>
        {d.value?.toFixed(1)}%
      </p>
      <p className="text-[10px] text-gray-500">
        ${d.payload.value?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function SectorAllocation() {
  const { data: portfolio, isLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => apiClient.get('/api/v1/portfolio').then(r => r.data.data),
    refetchInterval: 30000,
  });

  const positions = portfolio?.positions || [];
  const cash      = portfolio?.cashBalance || 0;
  const total     = portfolio?.totalValue  || 100000;

  // Group positions by sector
  const sectorMap: Record<string, number> = {};
  positions.forEach((p: any) => {
    const sector = SECTOR_MAP[p.symbol] || 'Other';
    sectorMap[sector] = (sectorMap[sector] || 0) + Number(p.marketValue);
  });

  // Add cash
  if (cash > 0) sectorMap['Cash'] = cash;

  const chartData = Object.entries(sectorMap)
    .map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
      pct:   parseFloat(((value / total) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.value - a.value);

  const isEmpty = chartData.length === 0 || (chartData.length === 1 && chartData[0].name === 'Cash');

  if (isLoading) {
    return (
      <div className="bg-[#161616] border border-[#262626] rounded-xl p-4 h-64 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#00d4a0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#161616] border border-[#262626] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#1e1e1e]">
        <h3 className="text-sm font-semibold text-white">Allocation</h3>
        <p className="text-[10px] text-gray-500 mt-0.5">By sector</p>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-600">
          <div className="w-16 h-16 rounded-full border-4 border-dashed border-[#262626] flex items-center justify-center mb-3">
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-xs text-center">No positions yet.<br />Buy stocks to see allocation.</p>
        </div>
      ) : (
        <>
          <div className="px-2 pt-2">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="pct"
                  labelLine={false}
                  label={renderCustomLabel}
                >
                  {chartData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={SECTOR_COLORS[i % SECTOR_COLORS.length]}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend list */}
          <div className="px-4 pb-4 space-y-1.5">
            {chartData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: SECTOR_COLORS[i % SECTOR_COLORS.length] }} />
                  <span className="text-xs text-gray-300">{d.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-400">
                    ${d.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-xs font-mono font-semibold text-white w-10 text-right">
                    {d.pct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}