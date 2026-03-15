'use client';

const SECTOR_DATA = [
  { name: 'Technology',         change: 1.82,  size: 35 },
  { name: 'Healthcare',         change: -0.43, size: 13 },
  { name: 'Financial',          change: 0.91,  size: 14 },
  { name: 'Consumer Cyclical',  change: -1.22, size: 11 },
  { name: 'Communication',      change: 0.64,  size: 9  },
  { name: 'Industrial',         change: 0.32,  size: 9  },
  { name: 'Consumer Defensive', change: 0.12,  size: 7  },
  { name: 'Energy',             change: -1.38, size: 5  },
  { name: 'Utilities',          change: -0.22, size: 3  },
  { name: 'Real Estate',        change: -0.55, size: 3  },
];

function getColor(change: number) {
  if (change > 2)  return { bg: '#00d4a0', text: '#003d2e', opacity: 1 };
  if (change > 1)  return { bg: '#00d4a0', text: '#00d4a0', opacity: 0.7 };
  if (change > 0)  return { bg: '#00d4a0', text: '#00d4a0', opacity: 0.4 };
  if (change > -1) return { bg: '#ff4d4d', text: '#ff4d4d', opacity: 0.4 };
  if (change > -2) return { bg: '#ff4d4d', text: '#ff4d4d', opacity: 0.7 };
  return              { bg: '#ff4d4d', text: '#ff4d4d', opacity: 1 };
}

export function SectorHeatmap() {
  return (
    <div className="bg-[#161616] border border-[#262626] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#1e1e1e]">
        <h3 className="text-sm font-semibold text-white">Sector Performance</h3>
        <p className="text-[10px] text-gray-500 mt-0.5">Today's change by sector</p>
      </div>

      <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {SECTOR_DATA.map(sector => {
          const { bg, text, opacity } = getColor(sector.change);
          const isUp = sector.change >= 0;
          return (
            <div
              key={sector.name}
              className="rounded-lg p-3 flex flex-col justify-between cursor-default hover:scale-[1.02] transition-transform"
              style={{ backgroundColor: `${bg}${Math.floor(opacity * 25).toString(16).padStart(2, '0')}`, border: `1px solid ${bg}${Math.floor(opacity * 40).toString(16).padStart(2, '0')}` }}
            >
              <p className="text-[10px] text-gray-300 leading-tight font-medium">{sector.name}</p>
              <div className="mt-2">
                <p className="text-sm font-mono font-bold" style={{ color: isUp ? '#00d4a0' : '#ff4d4d' }}>
                  {isUp ? '+' : ''}{sector.change.toFixed(2)}%
                </p>
                <div className="w-full bg-[#1a1a1a] rounded-full h-0.5 mt-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(Math.abs(sector.change) * 20, 100)}%`, backgroundColor: isUp ? '#00d4a0' : '#ff4d4d' }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-4 pb-3 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(to right, #00d4a015, #00d4a0)' }} />
          <span className="text-[10px] text-gray-500">Bullish</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(to right, #ff4d4d15, #ff4d4d)' }} />
          <span className="text-[10px] text-gray-500">Bearish</span>
        </div>
      </div>
    </div>
  );
}