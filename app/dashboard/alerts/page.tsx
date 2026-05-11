'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Bell, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DealBadge from '@/components/DealBadge';
import { useAuth } from '@/lib/auth-context';
import { getDealerAlerts, DealerAlert } from '@/lib/api';
import { formatQAR, formatKM, formatDate } from '@/lib/utils';

const LIMIT = 20;
const STATUS_TABS = ['all', 'sent', 'opened', 'acted', 'ignored'] as const;
type StatusTab = typeof STATUS_TABS[number];

function AlertCard({ alert }: { alert: DealerAlert }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-bold text-gray-900 text-sm">
              {alert.year} {alert.make} {alert.class_name}
            </span>
            <DealBadge type={alert.deal_classification} score={alert.opportunity_score} />
          </div>

          <div className="flex gap-3 text-xs text-gray-500 flex-wrap mb-2">
            {alert.km && <span>{formatKM(alert.km)}</span>}
            {alert.asking_qar && <span>{formatQAR(alert.asking_qar)} asking</span>}
            {alert.market_est_qar && <span>{formatQAR(alert.market_est_qar)} est.</span>}
            {alert.potential_margin_qar && (
              <span className="text-green-600 font-semibold">
                +{formatQAR(alert.potential_margin_qar)} margin
              </span>
            )}
          </div>

          {alert.score_explanation.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {alert.score_explanation.map((e, i) => (
                <span key={i} className="text-xs bg-gray-50 border border-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {e}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-xs text-gray-400">{formatDate(alert.sent_at)}</span>
          <Link
            href={`/my-offers/${alert.request_uid}`}
            className="flex items-center gap-1 text-xs text-[#003087] hover:underline font-semibold"
          >
            View Listing <ExternalLink size={11} />
          </Link>
          <StatusPill status={alert.status} />
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: DealerAlert['status'] }) {
  const map: Record<DealerAlert['status'], string> = {
    sent: 'bg-blue-50 text-blue-600 border border-blue-200',
    opened: 'bg-purple-50 text-purple-600 border border-purple-200',
    acted: 'bg-green-50 text-green-700 border border-green-200',
    ignored: 'bg-gray-100 text-gray-500 border border-gray-200',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${map[status]}`}>
      {status}
    </span>
  );
}

export default function AlertsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<StatusTab>('all');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<{ rows: DealerAlert[]; total: number } | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login/dealer');
  }, [user, loading, router]);

  const load = useCallback(() => {
    if (!token) return;
    setFetching(true);
    getDealerAlerts(token, {
      limit: LIMIT,
      offset: page * LIMIT,
      ...(activeTab !== 'all' ? { status: activeTab } : {}),
    })
      .then(setData)
      .catch(() => setData({ rows: [], total: 0 }))
      .finally(() => setFetching(false));
  }, [token, activeTab, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
      <Navbar />

      <div className="max-w-4xl mx-auto w-full px-4 py-8 flex-1">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#003087] transition-colors mb-3"
          >
            <ArrowLeft size={15} /> Back to Dashboard
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
                <Bell className="text-[#003087]" size={26} />
                Alert History
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                Acquisition opportunities sent to you based on your preferences.
              </p>
            </div>
            <Link
              href="/dashboard/preferences"
              className="text-sm font-semibold text-[#003087] hover:underline"
            >
              ⚙️ Manage alert preferences
            </Link>
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 mb-6 overflow-x-auto">
          {STATUS_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPage(0); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-[#003087] text-white'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        {fetching && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#003087]/30 border-t-[#003087] rounded-full animate-spin" />
          </div>
        )}

        {data && !fetching && (
          <>
            <p className="text-xs text-gray-400 mb-3">{data.total} alerts</p>

            {data.rows.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <Bell size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No alerts yet.</p>
                <p className="text-sm text-gray-400 mt-1">
                  Alerts appear here when listings match your{' '}
                  <Link href="/dashboard/preferences" className="text-[#003087] hover:underline">
                    preferences
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.rows.map(alert => (
                  <AlertCard key={alert.alert_id} alert={alert} />
                ))}
              </div>
            )}

            {data.total > LIMIT && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="flex items-center gap-1 border border-gray-200 bg-white px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 disabled:opacity-40 hover:border-[#003087] transition-colors"
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {page + 1} of {Math.ceil(data.total / LIMIT)}
                </span>
                <button
                  disabled={(page + 1) * LIMIT >= data.total}
                  onClick={() => setPage(p => p + 1)}
                  className="flex items-center gap-1 border border-gray-200 bg-white px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 disabled:opacity-40 hover:border-[#003087] transition-colors"
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
