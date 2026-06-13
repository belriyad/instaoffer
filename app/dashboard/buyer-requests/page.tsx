'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import { getDealerLeads, DealerLead } from '@/lib/api';
import { formatQAR, formatDate } from '@/lib/utils';

function BuyerRequestCard({ lead }: { lead: DealerLead }) {
  const yearRange =
    lead.year_min && lead.year_max ? `${lead.year_min}–${lead.year_max}` :
    lead.year_min ? `${lead.year_min}+` :
    lead.year_max ? `up to ${lead.year_max}` : null;

  const budget =
    lead.budget_min_qar && lead.budget_max_qar
      ? `${formatQAR(lead.budget_min_qar)} – ${formatQAR(lead.budget_max_qar)}`
      : lead.budget_max_qar ? `up to ${formatQAR(lead.budget_max_qar)}`
      : lead.budget_min_qar ? `from ${formatQAR(lead.budget_min_qar)}`
      : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-bold text-gray-900 text-sm">
              {lead.make} {lead.class_name}{lead.trim ? ` ${lead.trim}` : ''}
            </p>
            <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
              <ShoppingCart size={9} /> Buyer
            </span>
          </div>

          {/* Criteria */}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-1 mb-2">
            {yearRange && <span>Year: {yearRange}</span>}
            {lead.km_max && <span>Max {lead.km_max.toLocaleString()} km</span>}
            {lead.condition && <span className="capitalize">{lead.condition}</span>}
            {lead.city && <span>{lead.city}</span>}
          </div>

          {lead.notes && (
            <p className="text-xs text-gray-400 border-t border-gray-100 pt-2 line-clamp-2 mb-2">
              {lead.notes}
            </p>
          )}

          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Clock size={11} /> {formatDate(lead.created_at)}
          </p>
        </div>

        <div className="text-right shrink-0">
          {budget && (
            <p className="text-sm font-black text-green-600 mb-2">{budget}</p>
          )}
          {lead.estimate_qar && (
            <p className="text-xs text-gray-400 mb-2">Est: {formatQAR(lead.estimate_qar)}</p>
          )}
          <button className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-2 rounded-xl text-xs transition-colors">
            Suggest Match
          </button>
        </div>
      </div>
    </div>
  );
}

const STATUS_TABS = [
  { label: 'All',       value: '' },
  { label: 'New',       value: 'open' },
  { label: 'Responded', value: 'responded' },
  { label: 'Closed',    value: 'closed' },
] as const;

const LIMIT = 20;

export default function BuyerRequestsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [status, setStatus] = useState('');
  const [data, setData]     = useState<{ rows: DealerLead[]; total: number } | null>(null);
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
    getDealerLeads({
      lead_type: 'buyer_request',
      status:    status || undefined,
      limit:     LIMIT,
      offset:    page * LIMIT,
    }, token)
      .then(setData)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setFetching(false));
  }, [token, status, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <ShoppingCart className="text-purple-600" size={22} /> Buyer Requests
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Buyers looking for specific cars — match them with your inventory
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
                  ? 'bg-purple-600 text-white'
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
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Content */}
        {fetching ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : !data || data.rows.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart size={24} className="text-purple-400" />
            </div>
            <p className="font-bold text-gray-900 mb-1">No buyer requests yet</p>
            <p className="text-sm text-gray-400">Buyers looking for cars will appear here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-gray-400 mb-1">{data.total} request{data.total !== 1 ? 's' : ''}</p>
            {data.rows.map(lead => <BuyerRequestCard key={lead.request_uid} lead={lead} />)}
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
