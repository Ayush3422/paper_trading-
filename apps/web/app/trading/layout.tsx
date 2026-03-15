import { Sidebar }    from '@/components/layout/Sidebar';
import { MobileNav }  from '@/components/layout/MobileNav';
import { TopBar }     from '@/components/layout/TopBar';

export default function TradingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#04050d] bg-mesh flex">

      {/* ── Left Sidebar — desktop only ─────────────────────── */}
      <Sidebar />

      {/* ── Main content area ────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-[72px] xl:ml-[220px]">

        {/* Top bar with search + user */}
        <TopBar />

        {/* Page content */}
        <main className="flex-1 pt-16 pb-24 md:pb-6 overflow-x-hidden">
          <div className="max-w-screen-2xl mx-auto px-4 py-6">
            {children}
          </div>
        </main>
      </div>

      {/* ── Mobile bottom nav ────────────────────────────────── */}
      <MobileNav />
    </div>
  );
}