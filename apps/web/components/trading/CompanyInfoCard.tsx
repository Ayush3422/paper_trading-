'use client';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Globe, Building2, Users, TrendingUp } from 'lucide-react';

interface Props { symbol: string; }

function StatRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[#1a1a1a] last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-xs font-mono font-medium ${highlight ? 'text-[#00d4a0]' : 'text-gray-200'}`}>{value}</span>
    </div>
  );
}

function fmtMktCap(v?: number) {
  if (!v) return 'N/A';
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9)  return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6)  return `$${(v / 1e6).toFixed(0)}M`;
  return `$${v}`;
}

function fmtVol(v?: number) {
  if (!v) return 'N/A';
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return v.toString();
}

// Company mock data (replace with real Polygon/Finnhub data when keys added)
const COMPANY_DATA: Record<string, any> = {
  AAPL:  { name:'Apple Inc.',           sector:'Technology',         industry:'Consumer Electronics',   exchange:'NASDAQ', employees:164000,  website:'apple.com',       description:'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.' },
  MSFT:  { name:'Microsoft Corp.',      sector:'Technology',         industry:'Software Infrastructure',exchange:'NASDAQ', employees:221000,  website:'microsoft.com',   description:'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.' },
  GOOGL: { name:'Alphabet Inc.',        sector:'Technology',         industry:'Internet Content',        exchange:'NASDAQ', employees:182381, website:'abc.xyz',          description:'Alphabet Inc. provides various products and platforms in the United States, Europe, Middle East, Africa, and Asia Pacific.' },
  AMZN:  { name:'Amazon.com Inc.',      sector:'Consumer Cyclical',  industry:'Internet Retail',         exchange:'NASDAQ', employees:1541000, website:'amazon.com',     description:'Amazon.com engages in the retail sale of consumer products and subscriptions through online and physical stores.' },
  META:  { name:'Meta Platforms',       sector:'Technology',         industry:'Internet Content',        exchange:'NASDAQ', employees:67317,   website:'meta.com',       description:'Meta Platforms engages in the development of products that enable people to connect and share with friends through mobile devices.' },
  TSLA:  { name:'Tesla Inc.',           sector:'Consumer Cyclical',  industry:'Auto Manufacturers',      exchange:'NASDAQ', employees:140473,  website:'tesla.com',      description:'Tesla designs, develops, manufactures, leases, and sells electric vehicles, energy generation and storage systems.' },
  NVDA:  { name:'NVIDIA Corp.',         sector:'Technology',         industry:'Semiconductors',          exchange:'NASDAQ', employees:36000,   website:'nvidia.com',     description:'NVIDIA Corporation provides graphics, computing, and networking solutions in the United States, Taiwan, China, and internationally.' },
  JPM:   { name:'JPMorgan Chase',       sector:'Financial',          industry:'Diversified Banks',       exchange:'NYSE',   employees:309926,  website:'jpmorganchase.com', description:'JPMorgan Chase & Co. operates as a financial services company worldwide.' },
  DEFAULT: { name:'', sector:'N/A', industry:'N/A', exchange:'N/A', employees:0, website:'', description:'Company information not available.' },
};

export function CompanyInfoCard({ symbol }: Props) {
  const { data: quote } = useQuery({
    queryKey: ['quote', symbol],
    queryFn: () => apiClient.get(`/api/v1/market/quote/${symbol}`).then(r => r.data.data),
    refetchInterval: 5000,
  });

  const company = COMPANY_DATA[symbol] || { ...COMPANY_DATA.DEFAULT, name: symbol };
  const isUp    = (quote?.changePercent || 0) >= 0;

  const fmt2 = (n?: number) => n != null ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A';

  return (
    <div className="space-y-3">
      {/* Company header */}
      <div className="bg-[#161616] border border-[#262626] rounded-xl p-4">
        <div className="flex items-start gap-3 mb-3">
          {/* Symbol badge */}
          <div className="w-10 h-10 rounded-xl bg-[#00d4a015] border border-[#00d4a030] flex items-center justify-center flex-shrink-0">
            <span className="text-[#00d4a0] font-bold text-xs">{symbol.slice(0,2)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm leading-tight truncate">{company.name || symbol}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[10px] text-gray-500 bg-[#1e1e1e] px-2 py-0.5 rounded-full">{company.exchange}</span>
              <span className="text-[10px] text-gray-500 bg-[#1e1e1e] px-2 py-0.5 rounded-full">{company.sector}</span>
            </div>
          </div>
        </div>

        {company.description && (
          <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-3">{company.description}</p>
        )}

        {company.website && (
          <a href={`https://${company.website}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-[10px] text-[#00d4a0] hover:underline">
            <Globe size={10} /> {company.website}
          </a>
        )}
      </div>

      {/* Key stats */}
      <div className="bg-[#161616] border border-[#262626] rounded-xl p-4">
        <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Key Statistics</h4>
        <div className="space-y-0">
          <StatRow label="Price"         value={`$${fmt2(quote?.price)}`} />
          <StatRow label="Open"          value={`$${fmt2(quote?.open)}`} />
          <StatRow label="Day High"      value={`$${fmt2(quote?.high)}`} highlight />
          <StatRow label="Day Low"       value={`$${fmt2(quote?.low)}`} />
          <StatRow label="Prev Close"    value={`$${fmt2(quote?.previousClose)}`} />
          <StatRow label="Change"        value={`${isUp ? '+' : ''}$${fmt2(quote?.change)} (${isUp ? '+' : ''}${(quote?.changePercent || 0).toFixed(2)}%)`} />
          <StatRow label="Volume"        value={fmtVol(quote?.volume)} />
          <StatRow label="Mkt Cap"       value={fmtMktCap(quote?.marketCap)} />
          {company.industry && <StatRow label="Industry"  value={company.industry} />}
          {company.employees > 0 && <StatRow label="Employees" value={company.employees.toLocaleString()} />}
        </div>
      </div>
    </div>
  );
}