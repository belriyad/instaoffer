'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Clock, AlertCircle, RefreshCw, User } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import { getDealerLeads, DealerLead } from '@/lib/api';
import { formatDate } from '@/lib/utils';

function InquiryCard({ lead }: { lead: DealerLead }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="inline-flex items-center gap-1 bg-sky-100 text-sky-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
              <MessageSquare size={9} /> Inquiry
            </span>
            <p className="font-bold text-gray-900 text-sm">
              {lead.make} {lead.class_name}{lead.trim ? ` ${lead.trim}` : ''}
            </p>
          </div>

          {/* Inquirer */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
            <User size={11} />
            <span>{lead.notes ? 'Message included' : 'No message'}</span>
            {lead.city && <span>· {lead.city}</span>}
          </div>

          {lead.notes && (
            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2.5 line-clamp-3 mb-2 italic">
              "{lead.notes}"
            </p>
          )}

          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Clock size={11} /> {formatDate(lead.created_at)}
          </p>
        </div>

        <div className="shrink-0 flex flex-col gap-2 items-end">
          <button className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold px-3 py-2 rounded-xl text-xs transition-colors">
            Reply
          </button>
          <button className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold px-3 py-2 rounded-xl text-xs transition-colors">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

const STATUS_TABS = [
  { label: 'All',     value: '' },
  { label: 'New',     value: 'open' },
  { label: 'Replied', value: 'replied' },
  { label: 'Closed',  value: 'closed' },
] as const;

const LIMIT = 20;

export default function InquiriesPage() {
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
      lead_type: 'dealer_inquiry',
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
              <MessageSquare className="text-sky-600" size={22} /> Direct Inquiries
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Buyers who contacted you directly about specific cars
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
                  ? 'bg-sky-600 text-white'
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
            <div className="w-14 h-14 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={24} className="text-sky-400" />
            </div>
            <p className="font-bold text-gray-900 mb-1">No inquiries yet</p>
            <p className="text-sm text-gray-400">Direct inquiries from car listing pages will appear here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-gray-400 mb-1">{data.total} inquir{data.total !== 1 ? 'ies' : 'y'}</p>
            {data.rows.map(lead => <InquiryCard key={lead.request_uid} lead={lead} />)}
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
