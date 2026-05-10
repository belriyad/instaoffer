'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart2, TrendingUp, Users, Bookmark, ArrowLeft,
  AlertCircle, Send, CheckCircle, XCircle, Clock, DollarSign, Brain,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import { getDealerStats, getDealerBids, DealerStats } from '@/lib/api';
import { formatQAR } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BidRecord {
  bid_uid: string;
  request_uid: string;
  amount_qar: number;
  status: string;
  created_at: string;
  expires_at?: string | null;
  make?: string;
  class_name?: string;
  year?: number;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-xl bg-[#003087]/10 flex items-center justify-center text-[#003087] flex-shrink-0">
        {icon}
      </div>
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">{title}</h2>
    </div>
  );
}

function StatCard({
  label, value, sub, color = 'text-[#003087]', icon,
}: {
  label: string; value: string | number; sub?: string; color?: string; icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      {icon && <div className="mb-2 text-gray-300">{icon}</div>}
      <div className={`text-2xl font-black ${color}`}>{value}</div>
      <div className="text-sm font-semibold text-gray-700 mt-1">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function MiniBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500 font-medium">{label}</span>
        <span className="font-bold text-gray-700">{count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<DealerStats | null>(null);
  const [bids, setBids] = useState<BidRecord[]>([]);
  const [statsError, setStatsError] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login/dealer');
  }, [user, loading, router]);

  useEffect(() => {
    if (!token) return;

    Promise.allSettled([
      getDealerStats(token),
      getDealerBids(token),
    ]).then(([statsRes, bidsRes]) => {
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      else setStatsError(true);

      if (bidsRes.status === 'fulfilled') {
        const raw = bidsRes.value;
        const arr: BidRecord[] = Array.isArray(raw) ? raw : (raw as { bids?: BidRecord[] }).bids ?? [];
        setBids(arr);
      }
    }).finally(() => setFetching(false));
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

  // ── Derived bid-level metrics ──────────────────────────────────────────────
  const totalBids     = bids.length;
  const pendingBids   = bids.filter(b => b.status === 'pending').length;
  const acceptedBids  = bids.filter(b => b.status === 'accepted').length;
  const rejectedBids  = bids.filter(b => b.status === 'rejected').length;
  const withdrawnBids = bids.filter(b => b.status === 'withdrawn').length;
  const expiredBids   = bids.filter(b => b.status === 'expired').length;
  const myWinRate     = totalBids > 0 ? ((acceptedBids / totalBids) * 100).toFixed(1) : '—';

  const amounts = bids.filter(b => b.amount_qar > 0).map(b => b.amount_qar);
  const avgBid  = amounts.length > 0 ? Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length) : null;
  const maxBid  = amounts.length > 0 ? Math.max(...amounts) : null;
  const minBid  = amounts.length > 0 ? Math.min(...amounts) : null;

  const now = Date.now();
  const bidsLast30 = bids.filter(b => b.created_at && (now - new Date(b.created_at).getTime()) < 30 * 24 * 3600 * 1000).length;

  const makeCounts: Record<string, number> = {};
  bids.forEach(b => { if (b.make) makeCounts[b.make] = (makeCounts[b.make] ?? 0) + 1; });
  const topMakes = Object.entries(makeCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const winColor =
    myWinRate !== '—' && parseFloat(myWinRate) >= 30 ? 'text-green-600' :
    myWinRate !== '—' && parseFloat(myWinRate) >= 15 ? 'text-amber-600' :
    totalBids === 0 ? 'text-gray-400' : 'text-red-500';

  const hasAnyData = totalBids > 0 || stats !== null;

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
      <Navbar />
      <div className="max-w-4xl mx-auto w-full px-4 py-8 flex-1">

        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#003087] transition-colors mb-3">
            <ArrowLeft size={15} /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-black text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">Acquisition performance and deal activity.</p>
        </div>

        {/* Stats API soft warning */}
        {statsError && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-5 text-sm text-amber-800">
            <AlertCircle size={16} className="flex-shrink-0 text-amber-500" />
            Market activity data couldn&apos;t be loaded right now. Showing your personal bid history below.
          </div>
        )}

        {/* Empty state */}
        {!hasAnyData && (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <BarChart2 size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold">No activity yet</p>
            <p className="text-sm text-gray-400 mt-1">Place your first offer from the Leads tab to start seeing analytics here.</p>
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 mt-5 bg-[#003087] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#0057b8] transition-colors">
              Go to Leads
            </Link>
          </div>
        )}

        {hasAnyData && (
          <div className="space-y-6">

            {/* ── My Offer Performance ── */}
            <div>
              <SectionHeader icon={<Send size={16} />} title="My Offer Performance" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <StatCard
                  label="Offers Sent"
                  value={totalBids > 0 ? totalBids : (stats?.offers_sent ?? 0)}
                  sub="Total instant offers submitted"
                  icon={<Send size={18} />}
                />
                <StatCard
                  label="Accepted"
                  value={acceptedBids > 0 ? acceptedBids : (stats?.offers_accepted ?? 0)}
                  sub="Seller accepted your offer"
                  color="text-green-600"
                  icon={<CheckCircle size={18} />}
                />
                <StatCard
                  label="Win Rate"
                  value={totalBids > 0 ? `${myWinRate}%` : `${stats?.win_rate_pct ?? 0}%`}
                  sub="Accepted ÷ total sent"
                  color={winColor}
                  icon={<TrendingUp size={18} />}
                />
                <StatCard
                  label="Last 30 Days"
                  value={bidsLast30}
                  sub="Offers placed this month"
                  icon={<Clock size={18} />}
                />
              </div>

              {/* Status breakdown */}
              {totalBids > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <p className="text-sm font-bold text-gray-700 mb-4">Offer Status Breakdown</p>
                  <div className="space-y-3">
                    <MiniBar label="Pending"   count={pendingBids}   total={totalBids} color="bg-[#003087]" />
                    <MiniBar label="Accepted"  count={acceptedBids}  total={totalBids} color="bg-green-500" />
                    <MiniBar label="Rejected"  count={rejectedBids}  total={totalBids} color="bg-red-400" />
                    <MiniBar label="Withdrawn" count={withdrawnBids} total={totalBids} color="bg-gray-400" />
                    <MiniBar label="Expired"   count={expiredBids}   total={totalBids} color="bg-orange-400" />
                  </div>
                </div>
              )}
            </div>

            {/* ── Bid Amount Stats ── */}
            {avgBid !== null && (
              <div>
                <SectionHeader icon={<DollarSign size={16} />} title="Bid Amount Stats" />
                <div className="grid grid-cols-3 gap-4">
                  <StatCard label="Average Offer" value={formatQAR(avgBid)}  sub="Across all submitted offers" />
                  <StatCard label="Highest Offer" value={formatQAR(maxBid!)} sub="Your largest bid" color="text-green-600" />
                  <StatCard label="Lowest Offer"  value={formatQAR(minBid!)} sub="Your smallest bid" color="text-amber-600" />
                </div>
              </div>
            )}

            {/* ── Top Makes ── */}
            {topMakes.length > 0 && (
              <div>
                <SectionHeader icon={<BarChart2 size={16} />} title="Most Bid Makes" />
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
                  {topMakes.map(([make, count]) => (
                    <MiniBar key={make} label={make} count={count} total={totalBids} color="bg-[#003087]" />
                  ))}
                </div>
              </div>
            )}

            {/* ── Market Activity (from /dealer/stats) ── */}
            {stats && (
              <div>
                <SectionHeader icon={<BarChart2 size={16} />} title="Market Activity" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <StatCard label="Good Deals Available" value={stats.good_deals}    sub="Listings ≥8% below market" />
                  <StatCard label="Hot Deals This Week"  value={stats.hot_this_week} sub="≥12% below market, last 7 days" color="text-green-600" />
                  <StatCard label="Open Buyer Leads"     value={stats.open_leads}    sub="WTB requests waiting" />
                </div>
              </div>
            )}

            {/* ── Watchlists ── */}
            {stats && (
              <div>
                <SectionHeader icon={<Users size={16} />} title="Watchlists" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <StatCard label="Saved Filters" value={stats.saved_filters} sub="Acquisition strategies configured" />
                </div>
                <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
                  <Bookmark size={12} />
                  Configure acquisition filters in Dashboard → Settings to get notified when matching inventory appears.
                </p>
              </div>
            )}

            {/* ── Outcome icon strip ── */}
            {totalBids > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Pending',   count: pendingBids,   icon: <Clock size={20} />,       bg: 'bg-blue-50',  text: 'text-[#003087]' },
                  { label: 'Accepted',  count: acceptedBids,  icon: <CheckCircle size={20} />,  bg: 'bg-green-50', text: 'text-green-600' },
                  { label: 'Rejected',  count: rejectedBids,  icon: <XCircle size={20} />,      bg: 'bg-red-50',   text: 'text-red-500' },
                  { label: 'Withdrawn', count: withdrawnBids, icon: <AlertCircle size={20} />,  bg: 'bg-gray-50',  text: 'text-gray-500' },
                ].map(item => (
                  <div key={item.label} className={`${item.bg} rounded-2xl p-4 flex items-center gap-3`}>
                    <div className={item.text}>{item.icon}</div>
                    <div>
                      <div className={`text-xl font-black ${item.text}`}>{item.count}</div>
                      <div className="text-xs text-gray-500 font-medium">{item.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── AI BI CTA ── */}
            <div className="bg-[#003087] rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <Brain size={22} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-white">Want deeper insights on a specific vehicle?</p>
                <p className="text-sm text-white/70 mt-0.5">Run valuation, price forecast, time-to-sell and margin analysis instantly.</p>
              </div>
              <Link href="/dashboard/bi" className="flex-shrink-0 bg-white text-[#003087] font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors whitespace-nowrap">
                Open AI BI →
              </Link>
            </div>

            <p className="text-xs text-gray-400">
              Per-deal P&L and margin tracking will be available once deal outcomes are recorded by the platform.
            </p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
