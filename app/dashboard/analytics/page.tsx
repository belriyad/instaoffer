'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BarChart2, TrendingUp, Users, Bookmark, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import { getDealerStats, DealerStats } from '@/lib/api';

function StatCard({ label, value, sub, color = 'text-[#003087]' }: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className={`text-2xl font-black ${color}`}>{value}</div>
      <div className="text-sm font-semibold text-gray-700 mt-1">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function AnalyticsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DealerStats | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login/dealer');
  }, [user, loading, router]);

  useEffect(() => {
    if (token) {
      getDealerStats(token)
        .then(setStats)
        .catch(() => {})
        .finally(() => setFetching(false));
    }
  }, [token]);

  if (loading || fetching) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#003087]/30 border-t-[#003087] rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  const winColor =
    (stats?.win_rate_pct ?? 0) >= 30 ? 'text-green-600' :
    (stats?.win_rate_pct ?? 0) >= 15 ? 'text-amber-600' :
    'text-red-500';

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
      <Navbar />
      <div className="max-w-4xl mx-auto w-full px-4 py-8 flex-1">
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#003087] transition-colors mb-3">
            <ArrowLeft size={15} /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-black text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">Acquisition performance and deal activity.</p>
        </div>

        {stats && (
          <div className="space-y-6">
            {/* Offer performance */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-[#003087]" />
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Offer Performance</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard label="Offers Sent" value={stats.offers_sent} sub="Total instant offers submitted" />
                <StatCard label="Offers Accepted" value={stats.offers_accepted} sub="Seller accepted your offer" />
                <StatCard
                  label="Win Rate"
                  value={`${stats.win_rate_pct}%`}
                  sub="Accepted / sent"
                  color={winColor}
                />
              </div>
            </div>

            {/* Market activity */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 size={16} className="text-[#003087]" />
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Market Activity</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard label="Good Deals Available" value={stats.good_deals} sub="Listings ≥8% below market" />
                <StatCard label="Hot Deals This Week" value={stats.hot_this_week} sub="≥12% below market, last 7 days" color="text-green-600" />
                <StatCard label="Open Buyer Leads" value={stats.open_leads} sub="WTB requests waiting" />
              </div>
            </div>

            {/* Watchlists */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} className="text-[#003087]" />
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Watchlists</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard
                  label="Saved Filters"
                  value={stats.saved_filters}
                  sub="Acquisition strategies configured"
                />
              </div>
              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
                <Bookmark size={12} />
                Configure acquisition filters in Dashboard → Settings to get notified when matching inventory appears.
              </p>
            </div>

            <p className="text-xs text-gray-400">
              Offer-level margin tracking and per-deal P&L will be available once deal outcomes are recorded.
            </p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
