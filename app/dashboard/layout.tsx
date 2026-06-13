'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Building2, ChevronRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// Dealer area: only dealers/admins may see it. The backend independently
// enforces access (403) and the /api/proxy layer rejects token-less dealer
// calls (401) — this guard just stops the dealer shell from rendering or
// fetching for the wrong role.
//
// Two cases are deliberately handled differently:
//   • Guest (not signed in) → dealer login, preserving the return URL.
//   • Signed-in seller       → a clear "this is for dealers" explanation, NOT a
//                              silent bounce to a second login (which reads as
//                              "I'm already logged in, why am I being logged out?").
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isDealer = !!user && (user.role === 'dealer' || user.role === 'admin');
  const isSeller = !!user && !isDealer;

  useEffect(() => {
    if (loading) return;
    // Only guests are sent to authenticate; signed-in sellers stay put.
    if (!user) {
      const redirect = encodeURIComponent(pathname || '/dashboard');
      router.replace(`/login?role=dealer&redirect=${redirect}`);
    }
  }, [user, loading, pathname, router]);

  // Confirmed dealer → render the dashboard.
  if (isDealer) return <>{children}</>;

  // Signed-in seller → explain the role mismatch instead of bouncing them.
  if (isSeller) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f8fafc]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="w-14 h-14 bg-[#ebf5ff] rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 size={26} className="text-[#002b5b]" />
            </div>
            <h1 className="text-xl font-black text-gray-900 mb-2">This area is for dealer accounts</h1>
            <p className="text-gray-500 text-sm mb-6">
              You&apos;re signed in as <strong>{user!.full_name || user!.email}</strong> (seller).
              The dealer workspace — leads, bids and analytics — is only available to verified
              dealer accounts.
            </p>
            <Link
              href="/dealer-signup"
              className="flex items-center justify-center gap-2 w-full bg-[#002b5b] hover:bg-[#1a7fd4] text-white font-bold py-3 rounded-xl mb-3 transition-colors"
            >
              Apply as a dealer <ChevronRight size={16} />
            </Link>
            <Link href="/my-offers" className="text-sm text-gray-500 hover:text-[#002b5b] transition-colors">
              ← Back to my requests
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Loading, or a guest about to be redirected → neutral loader.
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <div className="h-8 w-8 rounded-full border-2 border-gray-200 border-t-[#002b5b] animate-spin" />
    </div>
  );
}
