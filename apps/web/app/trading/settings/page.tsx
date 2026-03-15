'use client';
import { useAuthStore } from '@/lib/store/auth.store';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const reset = useMutation({
    mutationFn: () => apiClient.post('/api/v1/portfolio/reset'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['portfolio'] }); toast.success('Portfolio reset to $100,000!'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Reset failed'),
  });

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your account</p>
      </div>

      {/* Profile */}
      <div className="bg-[#161616] border border-[#262626] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Profile</h2>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#00d4a020] border border-[#00d4a040] flex items-center justify-center text-[#00d4a0] text-lg font-bold">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-white font-medium">{user?.displayName || user?.username}</p>
            <p className="text-gray-500 text-sm">@{user?.username}</p>
            <p className="text-gray-600 text-xs">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-[#161616] border border-[#ff4d4d30] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-[#ff4d4d] mb-1 flex items-center gap-2"><AlertTriangle size={14} />Danger Zone</h2>
        <p className="text-gray-500 text-xs mb-4">Reset your portfolio back to $100,000 virtual cash. All positions and trade history will be retained but positions will be closed.</p>
        <button onClick={() => { if (confirm('Reset portfolio to $100,000? This cannot be undone.')) reset.mutate(); }}
          disabled={reset.isPending}
          className="px-4 py-2 bg-[#ff4d4d20] hover:bg-[#ff4d4d30] text-[#ff4d4d] border border-[#ff4d4d40] rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          {reset.isPending ? 'Resetting...' : 'Reset Portfolio to $100,000'}
        </button>
      </div>
    </div>
  );
}
