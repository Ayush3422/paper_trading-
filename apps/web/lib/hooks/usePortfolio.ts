'use client';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export function usePortfolio() {
  return useQuery({
    queryKey: ['portfolio'],
    queryFn: () => apiClient.get('/api/v1/portfolio').then(r => r.data.data),
    refetchInterval: 15000,
    staleTime: 10000,
  });
}

export function useTrades(page = 1) {
  return useQuery({
    queryKey: ['trades', page],
    queryFn: () => apiClient.get(`/api/v1/portfolio/trades?page=${page}&limit=20`).then(r => r.data),
    staleTime: 30000,
  });
}

export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: () => apiClient.get('/api/v1/portfolio/analytics').then(r => r.data.data),
    staleTime: 60000,
  });
}
