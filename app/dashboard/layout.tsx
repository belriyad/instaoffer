'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

// Dealer area: only dealers/admins may see it. Guests and signed-in non-dealers
// (sellers) are sent to the dealer login with a return URL. This gates every
// /dashboard/* page centrally. The backend independently enforces access (403),
// and the /api/proxy layer rejects token-less dealer calls (401) — this guard
// just stops the dealer shell from ever rendering, or fetching, for the wrong role.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isDealer = !!user && (user.role === 'dealer' || user.role === 'admin');

  useEffect(() => {
    if (loading) return;
    if (!isDealer) {
      // Guests and sellers alike must authenticate as a dealer; preserve where
      // they were headed so login can return them there.
      const redirect = encodeURIComponent(pathname || '/dashboard');
      router.replace(`/login?role=dealer&redirect=${redirect}`);
    }
  }, [isDealer, loading, pathname, router]);

  // Render nothing but a loader until we have *confirmed* a dealer session.
  // Anything else (loading, guest, seller) must never see the dealer shell or
  // let its children mount and fire dealer data fetches.
  if (loading || !isDealer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="h-8 w-8 rounded-full border-2 border-gray-200 border-t-[#002b5b] animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
