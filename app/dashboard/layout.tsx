'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

// Dealer area: only dealers/admins may see it. Guests go to the dealer login,
// signed-in non-dealers (sellers) are sent to their own area. This gates every
// /dashboard/* page centrally — the backend still enforces access (403), this just
// stops the dealer shell from ever rendering for the wrong role.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const isDealer = !!user && (user.role === 'dealer' || user.role === 'admin');

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login/dealer');
    } else if (!isDealer) {
      router.replace('/my-offers');
    }
  }, [user, loading, isDealer, router]);

  // Don't flash the dealer UI to a signed-in non-dealer while redirecting.
  if (!loading && user && !isDealer) return null;

  return <>{children}</>;
}
