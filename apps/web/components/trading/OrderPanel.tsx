'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useMarketStore } from '@/lib/store/market.store';
import { AlertCircle } from 'lucide-react';

interface Props {
  symbol: string;
  currentPrice: number;
  availableCash: number;
  heldShares: number;
}

const schema = z.object({
  orderType: z.enum(['MARKET','LIMIT','STOP']),
  quantity:  z.number({ invalid_type_error: 'Enter quantity' }).positive('Must be > 0').int('Whole shares only'),
  limitPrice: z.number().positive().optional(),
  stopPrice:  z.number().positive().optional(),
});
type Form = z.infer<typeof schema>;

export function OrderPanel({ symbol, currentPrice, availableCash, heldShares }: Props) {
  const qc = useQueryClient();
  const [side, setSide] = useState<'BUY'|'SELL'>('BUY');
  const liveTick = useMarketStore(s => s.prices[symbol]);
  const price = liveTick?.price || currentPrice;

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { orderType: 'MARKET', quantity: 1 },
  });

  const orderType = watch('orderType');
  const quantity  = watch('quantity') || 0;
  const estimated = price * quantity;
  const maxBuyQty = Math.floor(availableCash / price);

  const mutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/api/v1/orders', data),
    onSuccess: () => {
      toast.success(`${side} order placed successfully!`);
      qc.invalidateQueries({ queryKey: ['portfolio'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      reset();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Order failed'),
  });

  const onSubmit = (data: Form) => {
    mutation.mutate({ symbol, side, ...data });
  };

  return (
    <div className="bg-[#161616] border border-[#262626] rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-4">Place Order — {symbol}</h3>

      {/* Buy / Sell Toggle */}
      <div className="flex bg-[#1a1a1a] rounded-lg p-0.5 mb-4">
        {(['BUY','SELL'] as const).map(s => (
          <button key={s} onClick={() => setSide(s)}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${side === s ? (s === 'BUY' ? 'bg-[#00d4a0] text-black' : 'bg-[#ff4d4d] text-white') : 'text-gray-400 hover:text-white'}`}>
            {s}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {/* Order type */}
        <div>
          <label className="text-xs text-gray-500 block mb-1">Order Type</label>
          <select {...register('orderType')} className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4a0]">
            <option value="MARKET">Market</option>
            <option value="LIMIT">Limit</option>
            <option value="STOP">Stop</option>
          </select>
        </div>

        {/* Quantity */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-xs text-gray-500">Quantity</label>
            {side === 'BUY' && <span className="text-xs text-gray-600">Max: {maxBuyQty}</span>}
            {side === 'SELL' && <span className="text-xs text-gray-600">Held: {heldShares}</span>}
          </div>
          <input {...register('quantity', { valueAsNumber: true })} type="number" min="1"
            className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4a0]" />
          {errors.quantity && <p className="text-red-400 text-xs mt-1">{errors.quantity.message}</p>}
        </div>

        {/* Limit price */}
        {orderType === 'LIMIT' && (
          <div>
            <label className="text-xs text-gray-500 block mb-1">Limit Price</label>
            <input {...register('limitPrice', { valueAsNumber: true })} type="number" step="0.01" defaultValue={price}
              className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4a0]" />
          </div>
        )}

        {/* Stop price */}
        {orderType === 'STOP' && (
          <div>
            <label className="text-xs text-gray-500 block mb-1">Stop Price</label>
            <input {...register('stopPrice', { valueAsNumber: true })} type="number" step="0.01"
              className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4a0]" />
          </div>
        )}

        {/* Estimated cost */}
        <div className="bg-[#1a1a1a] rounded-lg p-3 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Market Price</span>
            <span className="text-white font-mono">${price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">{side === 'BUY' ? 'Est. Cost' : 'Est. Proceeds'}</span>
            <span className="text-white font-mono font-semibold">${estimated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Available Cash</span>
            <span className={`font-mono ${side === 'BUY' && estimated > availableCash ? 'text-[#ff4d4d]' : 'text-gray-300'}`}>
              ${availableCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {side === 'BUY' && estimated > availableCash && (
          <div className="flex items-center gap-2 text-xs text-[#ff4d4d] bg-[#ff4d4d10] border border-[#ff4d4d30] rounded-lg p-2">
            <AlertCircle size={12} /> Insufficient buying power
          </div>
        )}
        {side === 'SELL' && quantity > heldShares && (
          <div className="flex items-center gap-2 text-xs text-[#ff4d4d] bg-[#ff4d4d10] border border-[#ff4d4d30] rounded-lg p-2">
            <AlertCircle size={12} /> Not enough shares
          </div>
        )}

        <button type="submit" disabled={mutation.isPending || (side === 'BUY' && estimated > availableCash) || (side === 'SELL' && quantity > heldShares)}
          className={`w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40 transition-colors ${side === 'BUY' ? 'bg-[#00d4a0] hover:bg-[#00b388] text-black' : 'bg-[#ff4d4d] hover:bg-[#e03e3e] text-white'}`}>
          {mutation.isPending ? 'Placing...' : `${side} ${quantity > 0 ? quantity : ''} ${symbol}`}
        </button>
      </form>
    </div>
  );
}
