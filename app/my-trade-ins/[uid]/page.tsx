'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, Car, Clock, AlertCircle, MapPin, Gauge,
  RefreshCw, Tag, CheckCircle2, Package, TrendingDown, Info,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import { getTradeInDetail, cancelTradeInRequest, TradeInRequest } from '@/lib/api';
import { formatQAR, formatDate } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string; desc: string }> = {
  new:       { label: 'Submitted',         badgeClass: 'bg-blue-100 text-blue-700',    desc: 'Your request has been received and will be reviewed by the dealer.' },
  reviewing: { label: 'Under Review',      badgeClass: 'bg-yellow-100 text-yellow-700', desc: 'The dealer is reviewing your request.' },
  proposed:  { label: 'Proposal Received', badgeClass: 'bg-purple-100 text-purple-700', desc: 'The dealer has sent you a package deal proposal. Review it below.' },
  accepted:  { label: 'Accepted',          badgeClass: 'bg-green-100 text-green-700',   desc: 'Deal accepted. The dealer will be in touch to finalise.' },
  rejected:  { label: 'Declined',          badgeClass: 'bg-red-100 text-red-700',       desc: 'The dealer declined this request.' },
  closed:    { label: 'Closed',            badgeClass: 'bg-gray-100 text-gray-500',     desc: 'This request is closed.' },
  cancelled: { label: 'Cancelled',         badgeClass: 'bg-gray-100 text-gray-500',     desc: 'You cancelled this request.' },
};

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900 text-right ml-4">{value}</span>
    </div>
  );
}

export default function MyTradeInDetailPage() {
  const { uid } = useParams<{ uid: string }>();
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [req, setReq] = useState<TradeInRequest | null>(null);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login?redirect=/my-offers');
  }, [user, loading, router]);

  useEffect(() => {
    if (!token || !uid) return;
    setFetching(true);
    getTradeInDetail(uid, token)
      .then(setReq)
      .catch(err => setFetchError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setFetching(false));
  }, [token, uid]);

  async function handleCancel() {
    if (!token || !uid) return;
    if (!confirm('Cancel this trade-in request?')) return;
    setCancelling(true);
    setCancelError(null);
    try {
      const { request: updated } = await cancelTradeInRequest(uid, token);
      setReq(updated);
    } catch {
      setCancelError('Could not cancel. Please contact support if the issue persists.');
    } finally {
      setCancelling(false);
    }
  }

  if (fetching || loading) {
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

  if (fetchError || !req) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-10 text-center max-w-md w-full shadow-sm border border-gray-100">
            <AlertCircle size={36} className="text-red-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-6">{fetchError ?? 'Request not found.'}</p>
            <Link href="/my-offers" className="inline-flex items-center gap-2 bg-[#003087] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#002070] transition-colors">
              <ChevronLeft size={16} /> Back to My Requests
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const st = STATUS_CONFIG[req.status] ?? { label: req.status, badgeClass: 'bg-gray-100 text-gray-500', desc: '' };
  const canCancel = !['cancelled', 'closed', 'accepted'].includes(req.status);
  const tradeInMustHave = req.notes?.includes('REQUIRED');

  // Parse proposal from notes if present
  const proposalLines = req.notes?.split('\n').filter(l => l.startsWith('•') || l.startsWith('📦')) ?? [];
  const hasProposal = req.status === 'proposed' && proposalLines.length > 0;

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
      <Navbar />
      <div className="max-w-2xl mx-auto w-full px-4 py-8 flex-1">
        <Link href="/my-offers" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#003087] mb-6 transition-colors">
          <ChevronLeft size={16} /> My Requests
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <RefreshCw size={16} className="text-green-600" />
                <p className="text-xs font-bold text-green-700 uppercase tracking-wide">Trade-in Request</p>
              </div>
              <h1 className="text-2xl font-black text-gray-900">
                {req.year} {req.make} {req.class_name}
              </h1>
              <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-1">
                <span className="flex items-center gap-1"><Gauge size={13} /> {req.km?.toLocaleString()} km</span>
                {req.city && <span className="flex items-center gap-1"><MapPin size={13} /> {req.city}</span>}
                {req.condition && <span className="capitalize">{req.condition}</span>}
              </div>
            </div>
            <span className={`text-sm font-semibold px-3 py-1.5 rounded-full shrink-0 ${st.badgeClass}`}>
              {st.label}
            </span>
          </div>

          {/* Status description */}
          <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">{st.desc}</p>

          {/* Trade-in required badge */}
          {tradeInMustHave != null && (
            <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-bold ${tradeInMustHave ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {tradeInMustHave ? '🚫 Trade-in required to proceed' : '✅ Trade-in optional'}
            </div>
          )}

          <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
            <Clock size={11} /> Submitted {formatDate(req.created_at)}
          </p>
        </div>

        {/* Target vehicle */}
        {req.target_car_name && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1">
              <Tag size={12} /> Target Vehicle
            </p>
            <div className="bg-[#003087]/5 rounded-xl p-4">
              <p className="font-black text-gray-900 text-lg">{req.target_car_name}</p>
              {req.target_dealer && <p className="text-sm text-gray-500 mt-0.5">Dealer: {req.target_dealer}</p>}
              {req.target_price_qar && (
                <p className="text-xl font-black text-[#003087] mt-2">{formatQAR(req.target_price_qar)}</p>
              )}
            </div>
          </div>
        )}

        {/* Trade-in vehicle details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1">
            <Car size={12} /> Your Trade-in Car
          </p>
          <Row label="Make" value={req.make} />
          <Row label="Model" value={req.class_name} />
          <Row label="Year" value={req.year} />
          <Row label="Mileage" value={req.km ? `${req.km.toLocaleString()} km` : null} />
          <Row label="City" value={req.city} />
          <Row label="Condition" value={req.condition} />
        </div>

        {/* Estimated value */}
        {req.estimate_low_qar && req.estimate_high_qar && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Estimated Market Value</p>
            <p className="text-2xl font-black text-green-700">
              {formatQAR(req.estimate_low_qar)} – {formatQAR(req.estimate_high_qar)}
            </p>
            {req.target_price_qar && (
              <div className="mt-3 bg-[#f0f4ff] rounded-xl px-4 py-3">
                <p className="text-xs font-bold text-[#003087] uppercase tracking-wide mb-1">Estimated top-up needed</p>
                <p className="text-xl font-black text-[#003087]">
                  {(() => {
                    const lo = Math.max(0, Math.round((req.target_price_qar - req.estimate_high_qar) / 1000) * 1000);
                    const hi = Math.max(0, Math.round((req.target_price_qar - req.estimate_low_qar) / 1000) * 1000);
                    return lo === 0 && hi === 0 ? 'Your car may fully cover it' : `${formatQAR(lo)} – ${formatQAR(hi)}`;
                  })()}
                </p>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Info size={11} /> Indicative. Final depends on dealer inspection.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Dealer proposal (if received) */}
        {hasProposal && (
          <div className="bg-white rounded-2xl border border-purple-200 shadow-sm p-5 mb-4">
            <p className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-3 flex items-center gap-1">
              <Package size={12} /> Dealer Package Proposal
            </p>
            <div className="bg-purple-50 rounded-xl p-4 space-y-2">
              {proposalLines.map((line, i) => (
                <p key={i} className={`text-sm ${line.startsWith('📦') ? 'font-black text-gray-900' : 'text-gray-700'}`}>
                  {line}
                </p>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
              <Info size={11} /> Contact the dealer to accept or negotiate this proposal.
            </p>
          </div>
        )}

        {/* Cancel action */}
        {canCancel && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
            {cancelError && (
              <p className="text-xs text-red-600 mb-3 flex items-center gap-1">
                <AlertCircle size={12} /> {cancelError}
              </p>
            )}
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {cancelling
                ? <span className="w-4 h-4 border border-red-400 border-t-transparent rounded-full animate-spin" />
                : '✕'}
              Cancel this request
            </button>
            <p className="text-xs text-gray-400 mt-2">
              The dealer will be notified. You can always submit a new request later.
            </p>
          </div>
        )}

        {/* Edit — redirect back to trade-in form with pre-filled params */}
        {canCancel && req.target_car_name && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Need to update details?</p>
            <Link
              href={`/trade-in?target_car_id=${req.target_car_id ?? ''}&target_name=${encodeURIComponent(req.target_car_name)}&target_price=${req.target_price_qar ?? ''}&target_dealer=${encodeURIComponent(req.target_dealer ?? '')}&cur_make=${encodeURIComponent(req.make)}&cur_model=${encodeURIComponent(req.class_name)}&cur_year=${req.year}&cur_km=${req.km}&cur_city=${encodeURIComponent(req.city)}&cur_condition=${req.condition ?? ''}`}
              className="inline-flex items-center gap-2 text-sm font-bold text-[#003087] bg-[#e8f0fd] hover:bg-[#d0e0fb] px-4 py-2.5 rounded-xl transition-colors"
            >
              ✏️ Edit &amp; Resubmit
            </Link>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
