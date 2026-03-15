import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@paper-trading/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken?: string) => void;
  setToken: (accessToken: string, refreshToken?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),
      setToken: (accessToken, refreshToken) => 
        set((state) => ({ 
          accessToken, 
          refreshToken: refreshToken || state.refreshToken,
          isAuthenticated: true 
        })),
      logout: () => set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
    }),
    { name: 'auth', partialize: (s) => ({ user: s.user, refreshToken: s.refreshToken }) }
  )
);
