'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, ChevronLeft, ChevronRight, Send, ExternalLink } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import { getDealerLeads, DealerLead } from '@/lib/api';
import { formatQAR, formatDate } from '@/lib/utils';
import Link from 'next/link';

function LeadCard({ lead }: { lead: DealerLead }) {
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
          <p className="font-bold text-gray-900">
            {lead.make} {lead.class_name}{lead.trim ? ` ${lead.trim}` : ''}
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
            {yearRange && <span>Year: {yearRange}</span>}
            {lead.km_max && <span>Max KM: {lead.km_max.toLocaleString()}</span>}
            {lead.city && <span>{lead.city}</span>}
            {lead.condition && <span className="capitalize">{lead.condition}</span>}
          </div>
          {lead.notes && (
            <p className="text-xs text-gray-500 mt-2 border-t border-gray-100 pt-2 line-clamp-2">{lead.notes}</p>
          )}
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            <Clock size={11} /> Posted {formatDate(lead.created_at)}
          </p>
        </div>
        <div className="text-right shrink-0">
          {budget && <p className="text-sm font-black text-green-600">{budget}</p>}
          {lead.estimate_qar && (
            <p className="text-xs text-gray-400">Est: {formatQAR(lead.estimate_qar)}</p>
          )}
          <button className="mt-3 flex items-center gap-1.5 bg-[#002b5b] hover:bg-[#1a7fd4] text-white font-bold px-3 py-2 rounded-xl text-xs transition-colors">
            <Send size={12} /> Submit Offer
          </button>
          <Link href={`/dashboard/leads/${lead.request_uid}`}
            className="mt-2 flex items-center gap-1.5 text-[#002b5b] hover:underline font-semibold text-xs">
            <ExternalLink size={12} /> View Full Lead
          </Link>
        </div>
      </div>
    </div>
  );
}

const LIMIT = 20;

export default function DealerLeadsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [data, setData] = useState<{ rows: DealerLead[]; total: number } | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login/dealer');
  }, [user, loading, router]);

  const load = useCallback(() => {
    if (!token) return;
    setFetching(true);
    getDealerLeads({ limit: LIMIT, offset: page * LIMIT, lead_type: 'seller_offer' }, token)
      .then(setData)
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [token, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      <div className="max-w-4xl mx-auto w-full px-4 py-8 flex-1">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-gray-900">Seller Leads</h1>
          <p className="text-gray-500 mt-1">Sellers who have requested an offer — review and submit a bid.</p>
        </div>

        {fetching && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#002b5b]/30 border-t-[#002b5b] rounded-full animate-spin" />
          </div>
        )}

        {data && !fetching && (
          <>
            <p className="text-xs text-gray-400 mb-3">{data.total} open requests</p>
            <div className="space-y-3">
              {data.rows.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                  <p className="text-gray-500 font-medium">No open leads right now.</p>
                </div>
              )}
              {data.rows.map(lead => <LeadCard key={lead.request_uid} lead={lead} />)}
            </div>

            {data.total > LIMIT && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="flex items-center gap-1 border border-gray-200 bg-white px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 disabled:opacity-40 hover:border-[#002b5b] transition-colors"
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <span className="text-sm text-gray-500">Page {page + 1} of {Math.ceil(data.total / LIMIT)}</span>
                <button
                  disabled={(page + 1) * LIMIT >= data.total}
                  onClick={() => setPage(p => p + 1)}
                  className="flex items-center gap-1 border border-gray-200 bg-white px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 disabled:opacity-40 hover:border-[#002b5b] transition-colors"
                >
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
