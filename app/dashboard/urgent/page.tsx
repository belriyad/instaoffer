'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, Clock, Car, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import { getAllOfferRequests, OfferRequest } from '@/lib/api';
import { formatQAR, formatKM, formatDate } from '@/lib/utils';

const URGENCY_REASON_LABELS: Record<string, string> = {
  leaving_qatar: 'Leaving Qatar',
  need_cash:     'Needs Cash',
  upgrading:     'Upgrading',
  other:         'Other',
};

const PRIORITY_COLORS: Record<string, string> = {
  speed:    'bg-red-100 text-red-700',
  price:    'bg-blue-100 text-blue-700',
  balanced: 'bg-green-100 text-green-700',
};

function UrgentCard({ req }: { req: OfferRequest }) {
  const urgencyLabel = req.urgency_reason ? URGENCY_REASON_LABELS[req.urgency_reason] ?? req.urgency_reason : null;
  const priorityColor = req.sell_priority ? (PRIORITY_COLORS[req.sell_priority] ?? 'bg-gray-100 text-gray-600') : null;

  return (
    <Link
      href={`/dashboard/leads/${req.request_uid}`}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-orange-200 transition-all block"
    >
      <div className="flex items-start gap-3">
        {/* Urgent badge */}
        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
          <Zap size={18} className="text-orange-500" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-bold text-gray-900 text-sm">
              {req.year} {req.make} {req.class_name}
            </p>
            <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
              <Zap size={9} /> Urgent
            </span>
            {urgencyLabel && (
              <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                {urgencyLabel}
              </span>
            )}
            {req.sell_priority && priorityColor && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${priorityColor}`}>
                Priority: {req.sell_priority}
              </span>
            )}
          </div>

          {/* Details row */}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 mb-2">
            {req.km > 0 && <span>{formatKM(req.km)}</span>}
            {req.condition && <span className="capitalize">{req.condition}</span>}
            {req.city && <span>{req.city}</span>}
            {req.color && <span>{req.color}</span>}
          </div>

          {/* Price + score row */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {req.asking_price_qar && (
                <span className="text-sm font-black text-gray-900">
                  {formatQAR(req.asking_price_qar)}
                </span>
              )}
              {typeof req.opportunity_score === 'number' && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  req.opportunity_score >= 80 ? 'bg-red-100 text-red-700' :
                  req.opportunity_score >= 60 ? 'bg-orange-100 text-orange-700' :
                  req.opportunity_score >= 40 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  🔥 {req.opportunity_score} score
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
              <Clock size={11} />
              {formatDate(req.created_at)}
            </div>
          </div>
        </div>

        <ChevronRight size={16} className="text-gray-300 shrink-0 mt-1" />
      </div>
    </Link>
  );
}

const STATUS_TABS = [
  { label: 'All',    value: '' },
  { label: 'Open',   value: 'open' },
  { label: 'Bidded', value: 'bidded' },
  { label: 'Closed', value: 'closed' },
] as const;

const LIMIT = 30;

export default function UrgentSellersPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [status, setStatus] = useState('');
  const [rows, setRows]     = useState<OfferRequest[]>([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(0);
  const [fetching, setFetching] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/login/dealer');
  }, [user, loading, router]);

  const load = useCallback(() => {
    if (!token) return;
    setFetching(true);
    setError('');
    getAllOfferRequests(token, {
      sort_by:  'urgency',
      sort_dir: 'desc',
      status:   status || undefined,
      limit:    LIMIT,
      offset:   page * LIMIT,
    })
      .then((res: unknown) => {
        const r = res as { rows?: OfferRequest[]; total?: number } | OfferRequest[];
        const allRows = Array.isArray(r) ? r : (r as { rows?: OfferRequest[] }).rows ?? [];
        const tot     = Array.isArray(r) ? allRows.length : (r as { total?: number }).total ?? allRows.length;
        // Client-side filter on is_urgent until BE adds ?is_urgent=true param
        const urgent  = allRows.filter((r: OfferRequest) => r.is_urgent === true);
        setRows(urgent);
        setTotal(tot);
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setFetching(false));
  }, [token, status, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <Zap className="text-orange-500" size={24} /> Urgent Sellers
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Sellers who need to sell fast — sorted by urgency score
            </p>
          </div>
          <button
            onClick={load}
            disabled={fetching}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#002b5b] transition-colors"
          >
            <RefreshCw size={13} className={fetching ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => { setStatus(tab.value); setPage(0); }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                status === tab.value
                  ? 'bg-[#002b5b] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Content */}
        {fetching ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car size={24} className="text-orange-400" />
            </div>
            <p className="font-bold text-gray-900 mb-1">No urgent sellers right now</p>
            <p className="text-sm text-gray-400">Check back soon — new urgent listings come in daily.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-gray-400 mb-1">{rows.length} urgent seller{rows.length !== 1 ? 's' : ''} shown</p>
            {rows.map(req => <UrgentCard key={req.request_uid} req={req} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              ← Prev
            </button>
            <span className="text-sm text-gray-500" dir="ltr">{page + 1} / {totalPages}</span>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Next →
            </button>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}
