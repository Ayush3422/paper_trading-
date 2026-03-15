'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { useState } from 'react';
import { X } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  FILLED: 'text-[#00d4a0] bg-[#00d4a020]',
  OPEN: 'text-blue-400 bg-blue-400/10',
  CANCELLED: 'text-gray-500 bg-gray-500/10',
  REJECTED: 'text-[#ff4d4d] bg-[#ff4d4d20]',
  PENDING: 'text-yellow-400 bg-yellow-400/10',
  EXPIRED: 'text-gray-600 bg-gray-600/10',
};

export default function OrdersPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['orders', status],
    queryFn: () => apiClient.get(`/api/v1/orders${status ? `?status=${status}` : ''}`).then(r => r.data),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/v1/orders/${id}`),
    onSuccess: () => { toast.success('Order cancelled'); qc.invalidateQueries({ queryKey: ['orders'] }); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to cancel'),
  });

  const orders = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Orders</h1>
          <p className="text-gray-500 text-sm mt-0.5">Your order history</p>
        </div>
        {/* Filter */}
        <div className="flex gap-2">
          {['','OPEN','FILLED','CANCELLED'].map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${status === s ? 'bg-[#00d4a020] text-[#00d4a0]' : 'text-gray-500 hover:text-gray-300 bg-[#1a1a1a]'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#161616] border border-[#262626] rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500 text-sm">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-600 text-sm">No orders found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e1e1e]">
                  {['Symbol','Side','Type','Qty','Limit/Stop','Exec Price','Status','Date','Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o: any) => (
                  <tr key={o.id} className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a]">
                    <td className="px-4 py-3 font-mono font-bold text-white">{o.symbol}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${o.side === 'BUY' ? 'bg-[#00d4a020] text-[#00d4a0]' : 'bg-[#ff4d4d20] text-[#ff4d4d]'}`}>{o.side}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{o.orderType}</td>
                    <td className="px-4 py-3 font-mono text-gray-300">{Number(o.quantity)}</td>
                    <td className="px-4 py-3 font-mono text-gray-400 text-xs">{o.limitPrice ? `$${Number(o.limitPrice).toFixed(2)}` : o.stopPrice ? `$${Number(o.stopPrice).toFixed(2)}` : '—'}</td>
                    <td className="px-4 py-3 font-mono text-gray-300">{o.executedPrice ? `$${Number(o.executedPrice).toFixed(2)}` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status] || 'text-gray-400'}`}>{o.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {['OPEN','PENDING'].includes(o.status) && (
                        <button onClick={() => cancel.mutate(o.id)}
                          className="w-6 h-6 flex items-center justify-center rounded bg-[#ff4d4d20] text-[#ff4d4d] hover:bg-[#ff4d4d40] transition-colors">
                          <X size={12} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
