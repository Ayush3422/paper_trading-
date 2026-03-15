'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useMarketStore } from '../store/market.store';
import { subscribeToSymbols } from '../socket/socket.client';

export function useQuote(symbol: string) {
  const storePrice = useMarketStore((s) => s.prices[symbol]);

  const query = useQuery({
    queryKey: ['quote', symbol],
    queryFn: () => apiClient.get(`/api/v1/market/quote/${symbol}`).then(r => r.data.data),
    refetchInterval: 5000,
    enabled: !!symbol,
  });

  useEffect(() => {
    if (symbol) subscribeToSymbols([symbol]);
  }, [symbol]);

  const data = storePrice
    ? { ...query.data, price: storePrice.price, change: storePrice.change, changePercent: storePrice.changePercent }
    : query.data;

  return { ...query, data };
}
