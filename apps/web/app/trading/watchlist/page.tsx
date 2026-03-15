'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useMarketStore } from '@/lib/store/market.store';
import { toast } from 'sonner';
import { Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';

export default function WatchlistPage() {
  const qc = useQueryClient();
  const [newListName, setNewListName] = useState('');
  const [addSymbol, setAddSymbol] = useState('');
  const [activeList, setActiveList] = useState<string | null>(null);
  const prices = useMarketStore(s => s.prices);

  const { data, isLoading } = useQuery({
    queryKey: ['watchlists'],
    queryFn: () => apiClient.get('/api/v1/watchlists').then(r => r.data.data),
  });

  const createList = useMutation({
    mutationFn: (name: string) => apiClient.post('/api/v1/watchlists', { name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['watchlists'] }); setNewListName(''); toast.success('Watchlist created'); },
  });

  const deleteList = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/v1/watchlists/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['watchlists'] }); toast.success('Watchlist deleted'); },
  });

  const addToList = useMutation({
    mutationFn: ({ id, symbol }: { id: string; symbol: string }) =>
      apiClient.post(`/api/v1/watchlists/${id}/symbols`, { symbol: symbol.toUpperCase() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['watchlists'] }); setAddSymbol(''); toast.success('Symbol added'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const removeSymbol = useMutation({
    mutationFn: ({ id, symbol }: { id: string; symbol: string }) =>
      apiClient.delete(`/api/v1/watchlists/${id}/symbols/${symbol}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['watchlists'] }); },
  });

  const lists = data || [];
  const currentList = lists.find((l: any) => l.id === activeList) || lists[0];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Watchlist</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-3">
          {lists.map((l: any) => (
            <div key={l.id} onClick={() => setActiveList(l.id)}
              className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${currentList?.id === l.id ? 'bg-[#00d4a020] border border-[#00d4a040]' : 'bg-[#161616] border border-[#262626] hover:border-[#333]'}`}>
              <span className={`text-sm font-medium ${currentList?.id === l.id ? 'text-[#00d4a0]' : 'text-gray-300'}`}>{l.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">{l.symbols?.length || 0}</span>
                <button onClick={(e) => { e.stopPropagation(); deleteList.mutate(l.id); }} className="text-gray-600 hover:text-[#ff4d4d]"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
          {/* Create list */}
          <div className="flex gap-2">
            <input value={newListName} onChange={e => setNewListName(e.target.value)}
              placeholder="New list name"
              className="flex-1 bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#00d4a0]" />
            <button onClick={() => newListName && createList.mutate(newListName)}
              className="w-8 h-8 bg-[#00d4a0] hover:bg-[#00b388] text-black rounded-lg flex items-center justify-center">
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 bg-[#161616] border border-[#262626] rounded-xl overflow-hidden">
          {!currentList ? (
            <div className="text-center py-12 text-gray-600 text-sm">Create a watchlist to get started</div>
          ) : (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#262626]">
                <h2 className="text-sm font-semibold text-white">{currentList.name}</h2>
                <div className="flex gap-2">
                  <input value={addSymbol} onChange={e => setAddSymbol(e.target.value.toUpperCase())}
                    placeholder="Add ticker (e.g. AAPL)"
                    onKeyDown={e => e.key === 'Enter' && addSymbol && addToList.mutate({ id: currentList.id, symbol: addSymbol })}
                    className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#00d4a0] w-40" />
                  <button onClick={() => addSymbol && addToList.mutate({ id: currentList.id, symbol: addSymbol })}
                    className="px-3 py-1.5 bg-[#00d4a020] text-[#00d4a0] rounded-lg text-xs hover:bg-[#00d4a040]">Add</button>
                </div>
              </div>
              {currentList.symbols?.length === 0 ? (
                <div className="text-center py-12 text-gray-600 text-sm">Add a ticker above</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1e1e1e]">
                      {['Symbol','Price','Change','Change %','Action'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs text-gray-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentList.symbols.map((s: any) => {
                      const tick = prices[s.symbol];
                      const isUp = (tick?.change || 0) >= 0;
                      return (
                        <tr key={s.symbol} className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a]">
                          <td className="px-4 py-3">
                            <Link href={`/trading/trade/${s.symbol}`} className="font-mono font-bold text-white hover:text-[#00d4a0]">{s.symbol}</Link>
                          </td>
                          <td className="px-4 py-3 font-mono text-gray-200">{tick?.price ? `$${tick.price.toFixed(2)}` : '—'}</td>
                          <td className={`px-4 py-3 font-mono text-xs ${isUp ? 'text-[#00d4a0]' : 'text-[#ff4d4d]'}`}>
                            {tick?.change ? `${isUp ? '+' : ''}${tick.change.toFixed(2)}` : '—'}
                          </td>
                          <td className={`px-4 py-3 text-xs ${isUp ? 'text-[#00d4a0]' : 'text-[#ff4d4d]'}`}>
                            {tick?.changePercent ? (
                              <span className="flex items-center gap-1">
                                {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                {isUp ? '+' : ''}{tick.changePercent.toFixed(2)}%
                              </span>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => removeSymbol.mutate({ id: currentList.id, symbol: s.symbol })}
                              className="text-gray-600 hover:text-[#ff4d4d] transition-colors"><Trash2 size={13} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
