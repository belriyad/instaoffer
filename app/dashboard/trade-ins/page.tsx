'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RefreshCw, Clock, ChevronLeft, ChevronRight, Eye, Send, Car } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import { getDealerTradeIns, TradeInRequest } from '@/lib/api';
import { formatQAR, formatDate } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  new:       { label: 'New',        badgeClass: 'bg-blue-100 text-blue-700' },
  reviewing: { label: 'Reviewing',  badgeClass: 'bg-yellow-100 text-yellow-700' },
  proposed:  { label: 'Proposed',   badgeClass: 'bg-purple-100 text-purple-700' },
  accepted:  { label: 'Accepted',   badgeClass: 'bg-green-100 text-green-700' },
  rejected:  { label: 'Rejected',   badgeClass: 'bg-red-100 text-red-700' },
  closed:    { label: 'Closed',     badgeClass: 'bg-gray-100 text-gray-500' },
};

function TradeInCard({ req }: { req: TradeInRequest }) {
  const status = STATUS_CONFIG[req.status] ?? { label: req.status, badgeClass: 'bg-gray-100 text-gray-500' };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          {/* Target car */}
          {req.target_car_name ? (
            <div className="mb-2">
              <p className="text-xs font-bold text-green-700 uppercase tracking-wide">Target</p>
              <p className="font-bold text-gray-900 text-base truncate">{req.target_car_name}</p>
              {req.target_price_qar && (
                <p className="text-sm font-bold text-[#003087]">{formatQAR(req.target_price_qar)}</p>
              )}
            </div>
          ) : null}

          {/* Trade-in car */}
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Trade-in</p>
          <p className="font-semibold text-gray-800">
            {req.year} {req.make} {req.class_name}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{req.km?.toLocaleString()} km · {req.city}</p>
        </div>

        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${status.badgeClass}`}>
          {status.label}
        </span>
      </div>

      {/* Estimates */}
      {(req.estimate_low_qar || req.estimate_high_qar) && (
        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-50">
          <div>
            <p className="text-xs text-gray-400 font-medium">Est. Trade-in Value</p>
            <p className="text-sm font-bold text-gray-800">
              {req.estimate_low_qar && req.estimate_high_qar
                ? `${formatQAR(req.estimate_low_qar)} – ${formatQAR(req.estimate_high_qar)}`
                : req.estimate_low_qar ? formatQAR(req.estimate_low_qar)
                : req.estimate_high_qar ? formatQAR(req.estimate_high_qar)
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Est. Difference</p>
            <p className="text-sm font-bold text-[#ff6600]">
              {req.difference_low_qar && req.difference_high_qar
                ? `${formatQAR(req.difference_low_qar)} – ${formatQAR(req.difference_high_qar)}`
                : '—'}
            </p>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
        <Clock size={11} /> {formatDate(req.created_at)}
      </p>

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        <Link
          href={`/dashboard/trade-ins/${req.uid}`}
          className="flex items-center gap-1.5 bg-[#003087] hover:bg-[#002070] text-white font-bold px-3 py-2 rounded-xl text-xs transition-colors flex-1 justify-center"
        >
          <Eye size={13} /> View Details
        </Link>
        <button
          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-2 rounded-xl text-xs transition-colors flex-1 justify-center"
        >
          <Send size={13} /> Send Proposal
        </button>
      </div>
    </div>
  );
}

const LIMIT = 20;

export default function DealerTradeInsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [data, setData] = useState<{ rows: TradeInRequest[]; total: number } | null>(null);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/login/dealer');
  }, [user, loading, router]);

  const load = useCallback(() => {
    if (!token) return;
    setFetching(true);
    setFetchError(null);
    getDealerTradeIns({ limit: LIMIT, offset: page * LIMIT, ...(statusFilter && { status: statusFilter }) }, token)
      .then(setData)
      .catch(err => setFetchError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setFetching(false));
  }, [token, page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
      <Navbar />
      <div className="max-w-4xl mx-auto w-full px-4 py-8 flex-1">
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#003087] mb-3 transition-colors">
            <ChevronLeft size={15} /> Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <RefreshCw size={20} className="text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Trade-in Requests</h1>
              <p className="text-sm text-gray-500">Buyers wanting to trade their car toward one of your vehicles</p>
            </div>
          </div>
        </div>

        {/* Status filter */}
        <div className="flex gap-2 flex-wrap mb-5">
          {['', 'new', 'reviewing', 'proposed', 'accepted', 'closed'].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(0); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                statusFilter === s
                  ? 'bg-[#003087] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-[#003087]'
              }`}>
              {s === '' ? 'All' : STATUS_CONFIG[s]?.label ?? s}
            </button>
          ))}
        </div>

        {fetching && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#003087]/30 border-t-[#003087] rounded-full animate-spin" />
          </div>
        )}

        {fetchError && !fetching && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <Car size={36} className="text-red-300 mx-auto mb-3" />
            <p className="text-red-600 font-semibold mb-1">Could not load trade-in requests</p>
            <p className="text-sm text-red-400 mb-4">{fetchError}</p>
            <button onClick={load} className="bg-[#003087] text-white font-bold px-5 py-2 rounded-xl text-sm hover:bg-[#002070] transition-colors">
              Retry
            </button>
          </div>
        )}

        {data && !fetching && (
          <>
            <p className="text-xs text-gray-400 mb-3">{data.total} trade-in request{data.total !== 1 ? 's' : ''}</p>

            {data.rows.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <RefreshCw size={40} className="text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 font-semibold">No trade-in requests yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  When buyers select one of your cars and choose &quot;Trade in my car&quot;, requests will appear here.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {data.rows.map(req => <TradeInCard key={req.uid} req={req} />)}
              </div>
            )}

            {/* Pagination */}
            {data.total > LIMIT && (
              <div className="flex items-center justify-between mt-6">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronLeft size={16} /> Previous
                </button>
                <span className="text-xs text-gray-400">
                  Page {page + 1} of {Math.ceil(data.total / LIMIT)}
                </span>
                <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * LIMIT >= data.total}
                  className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed">
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
