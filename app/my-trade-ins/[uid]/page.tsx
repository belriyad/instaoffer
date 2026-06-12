'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, Car, Clock, AlertCircle, MapPin, Gauge,
  RefreshCw, Tag, CheckCircle2, Package, Info, Image as ImageIcon,
  FileText, User, DollarSign, Ban,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import {
  getTradeInDetail, cancelTradeInRequest, getTradeInOffers,
  acceptTradeInOffer, declineTradeInOffer, TradeInRequest, TradeInOffer,
} from '@/lib/api';
import { formatQAR, formatDate } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string; desc: string }> = {
  open:         { label: 'Open',           badgeClass: 'bg-blue-100 text-blue-700',     desc: 'Your request is live and visible to dealers.' },
  under_review: { label: 'Under Review',   badgeClass: 'bg-yellow-100 text-yellow-700', desc: 'A dealer is currently reviewing your request.' },
  offer_made:   { label: 'Offer Received', badgeClass: 'bg-purple-100 text-purple-700', desc: 'A dealer has sent you a package deal proposal. Review it below.' },
  accepted:     { label: 'Accepted',       badgeClass: 'bg-green-100 text-green-700',   desc: 'Deal accepted. The dealer will be in touch to finalise.' },
  rejected:     { label: 'Declined',       badgeClass: 'bg-red-100 text-red-700',       desc: 'The dealer declined this request.' },
  expired:      { label: 'Expired',        badgeClass: 'bg-gray-100 text-gray-500',     desc: 'This request has expired.' },
  cancelled:    { label: 'Cancelled',      badgeClass: 'bg-gray-100 text-gray-500',     desc: 'You cancelled this request.' },
};

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === '') return null;
  return (
    <div className="flex justify-between items-start py-2.5 border-b border-gray-50 last:border-0 gap-4">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className="text-sm font-semibold text-gray-900 text-right">{value}</span>
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
      <Icon size={13} className="text-gray-400" /> {title}
    </p>
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
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [offers, setOffers] = useState<TradeInOffer[]>([]);
  const [offerAction, setOfferAction] = useState<string | null>(null); // offer_uid being acted on

  useEffect(() => {
    if (!loading && !user) router.push('/login?redirect=/my-offers');
  }, [user, loading, router]);

  const loadOffers = useCallback(() => {
    if (!token || !uid) return;
    getTradeInOffers(uid, token)
      .then(res => setOffers(res.offers ?? []))
      .catch(() => { /* no offers / not yet */ });
  }, [token, uid]);

  useEffect(() => {
    if (!token || !uid) return;
    setFetching(true);
    getTradeInDetail(uid, token)
      .then(setReq)
      .catch(err => setFetchError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setFetching(false));
    loadOffers();
  }, [token, uid, loadOffers]);

  async function handleOfferAction(offerUid: string, action: 'accept' | 'decline') {
    if (!token) return;
    if (action === 'accept' && !confirm('Accept this package proposal? This declines any other offers.')) return;
    setOfferAction(offerUid);
    try {
      if (action === 'accept') await acceptTradeInOffer(offerUid, token);
      else await declineTradeInOffer(offerUid, token);
      // Refresh both the request (status) and the offers list.
      getTradeInDetail(uid, token).then(setReq).catch(() => {});
      loadOffers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not update the offer. Please try again.');
    } finally {
      setOfferAction(null);
    }
  }

  async function handleCancel() {
    if (!token || !uid) return;
    if (!confirm('Cancel this trade-in request? The dealer will be notified.')) return;
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
      <div className="flex flex-col min-h-screen bg-[#f8fafc]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#002b5b]/30 border-t-[#002b5b] rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (fetchError || !req) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f8fafc]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-10 text-center max-w-md w-full shadow-sm border border-gray-100">
            <AlertCircle size={36} className="text-red-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-6">{fetchError ?? 'Request not found.'}</p>
            <Link href="/my-offers" className="inline-flex items-center gap-2 bg-[#002b5b] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#001a3d] transition-colors">
              <ChevronLeft size={16} /> Back to My Requests
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const st = STATUS_CONFIG[req.status] ?? { label: req.status, badgeClass: 'bg-gray-100 text-gray-500', desc: '' };
  const canCancel = !['cancelled', 'expired', 'accepted', 'rejected'].includes(req.status);

  // Parse photo URLs
  let photoUrls: string[] = [];
  if (req.photo_urls_json) {
    try { photoUrls = JSON.parse(req.photo_urls_json); } catch { /* ignore */ }
  }

  // Parse notes — separate internal metadata from free-text notes
  const notesLines = (req.notes ?? '').split('\n').filter(Boolean);
  const timelineLine  = notesLines.find(l => l.startsWith('Timeline:'));
  const tradeInLine   = notesLines.find(l => l.startsWith('Trade-in:'));
  const userNotes     = notesLines
    .filter(l => !l.startsWith('•') && !l.startsWith('📦') && !l.startsWith('Timeline:') && !l.startsWith('Trade-in:'))
    .join('\n');
  const tradeInRequired = tradeInLine?.includes('REQUIRED');
  const timelineLabel   = timelineLine?.replace('Timeline:', '').trim();

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      <div className="max-w-2xl mx-auto w-full px-4 py-8 flex-1">

        <Link href="/my-offers" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#002b5b] mb-6 transition-colors font-medium">
          <ChevronLeft size={16} /> My Requests
        </Link>

        {/* ── Header ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <RefreshCw size={15} className="text-green-600" />
                <p className="text-xs font-bold text-green-700 uppercase tracking-wide">Trade-in Request</p>
              </div>
              <h1 className="text-2xl font-black text-gray-900">
                {req.year} {req.make} {req.class_name}
                {req.model && req.model !== req.class_name && (
                  <span className="text-gray-400 font-medium text-lg"> {req.model}</span>
                )}
              </h1>
              <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-1.5">
                {req.km != null && <span className="flex items-center gap-1"><Gauge size={13} /> {req.km.toLocaleString()} km</span>}
                {req.city && <span className="flex items-center gap-1"><MapPin size={13} /> {req.city}</span>}
                {req.condition && <span className="capitalize">{req.condition}</span>}
                {req.color && <span>{req.color}</span>}
              </div>
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full shrink-0 ${st.badgeClass}`}>
              {st.label}
            </span>
          </div>

          <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2.5">{st.desc}</p>

          <div className="flex flex-wrap gap-2 mt-3">
            {tradeInLine != null && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${tradeInRequired ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {tradeInRequired ? '🚫 Trade-in required to proceed' : '✅ Trade-in optional'}
              </span>
            )}
            {timelineLabel && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                <Clock size={11} /> {timelineLabel}
              </span>
            )}
          </div>

          <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
            <Clock size={11} /> Submitted {formatDate(req.created_at)}
            {req.updated_at && req.updated_at !== req.created_at && (
              <> · Updated {formatDate(req.updated_at)}</>
            )}
          </p>
        </div>

        {/* ── Dealer proposals (fetched from the trade-in offers API) ── */}
        {offers.length > 0 && (
          <div className="space-y-4 mb-4">
            {offers.map(offer => {
              const acting = offerAction === offer.offer_uid;
              const canAct = offer.status === 'pending' && req.status !== 'accepted' && req.status !== 'cancelled';
              return (
                <div key={offer.offer_uid} className={`bg-white rounded-2xl border-2 shadow-sm p-5 ${offer.status === 'accepted' ? 'border-green-300' : 'border-purple-200'}`}>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <SectionHeader icon={Package} title="Dealer Package Proposal" />
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      offer.status === 'accepted' ? 'bg-green-100 text-green-700' :
                      offer.status === 'declined' ? 'bg-red-50 text-red-600' :
                      offer.status === 'withdrawn' || offer.status === 'expired' ? 'bg-gray-100 text-gray-500' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {offer.status === 'pending' ? 'Awaiting your response' : offer.status}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-xs text-gray-500">Trade-in offer</span>
                    <span className="text-2xl font-black text-[#002b5b]">{formatQAR(offer.offered_value_qar)}</span>
                  </div>

                  {offer.message && (
                    <div className="bg-purple-50 rounded-xl p-4 space-y-1.5 whitespace-pre-line text-sm text-gray-700">
                      {offer.message}
                    </div>
                  )}

                  {canAct ? (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleOfferAction(offer.offer_uid, 'accept')}
                        disabled={acting}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold px-4 py-2.5 rounded-xl transition-colors"
                      >
                        <CheckCircle2 size={15} /> {acting ? 'Working…' : 'Accept Proposal'}
                      </button>
                      <button
                        onClick={() => handleOfferAction(offer.offer_uid, 'decline')}
                        disabled={acting}
                        className="flex items-center justify-center gap-1.5 border border-gray-200 hover:border-red-300 hover:text-red-600 text-gray-600 font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60"
                      >
                        <Ban size={15} /> Decline
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                      <Info size={11} />
                      {offer.status === 'accepted' ? 'You accepted this proposal — the dealer will be in touch to finalise.' : 'This proposal is no longer actionable.'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Target vehicle ── */}
        {req.target_car_name && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
            <SectionHeader icon={Tag} title="Target Vehicle" />
            <div className="bg-[#002b5b]/5 rounded-xl p-4">
              <p className="font-black text-gray-900 text-lg leading-tight">{req.target_car_name}</p>
              {req.target_dealer && <p className="text-sm text-gray-500 mt-1">Dealer: {req.target_dealer}</p>}
              {req.target_price_qar != null && (
                <p className="text-xl font-black text-[#002b5b] mt-2">{formatQAR(req.target_price_qar)}</p>
              )}
            </div>
          </div>
        )}

        {/* ── Estimated value ── */}
        {req.market_est_qar != null && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
            <SectionHeader icon={DollarSign} title="Estimated Market Value" />
            <p className="text-2xl font-black text-green-700">{formatQAR(req.market_est_qar)}</p>
            {(req.equity_est_qar != null || req.asking_delta_qar != null) && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                {req.equity_est_qar != null && (
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500 mb-0.5">Est. Equity</p>
                    <p className="font-black text-green-700">{formatQAR(req.equity_est_qar)}</p>
                  </div>
                )}
                {req.asking_delta_qar != null && (
                  <div className={`rounded-xl p-3 text-center ${req.asking_delta_qar >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                    <p className="text-xs text-gray-500 mb-0.5">vs. Asking Price</p>
                    <p className={`font-black ${req.asking_delta_qar >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                      {req.asking_delta_qar >= 0 ? '+' : ''}{formatQAR(req.asking_delta_qar)}
                    </p>
                  </div>
                )}
              </div>
            )}
            {req.target_price_qar != null && req.market_est_qar < req.target_price_qar && (
              <div className="mt-3 bg-[#ebf5ff] rounded-xl px-4 py-3">
                <p className="text-xs font-bold text-[#002b5b] uppercase tracking-wide mb-1">Estimated top-up needed</p>
                <p className="text-xl font-black text-[#002b5b]">
                  {formatQAR(Math.max(0, req.target_price_qar - req.market_est_qar))}
                </p>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Info size={11} /> Indicative. Final depends on dealer inspection.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Car details ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <SectionHeader icon={Car} title="Your Trade-in Car" />
          <Row label="Make"      value={req.make} />
          <Row label="Model"     value={req.class_name} />
          {req.model && req.model !== req.class_name && <Row label="Variant" value={req.model} />}
          <Row label="Year"      value={req.year} />
          <Row label="Mileage"   value={req.km != null ? `${req.km.toLocaleString()} km` : null} />
          <Row label="City"      value={req.city} />
          <Row label="Condition" value={req.condition ? req.condition.charAt(0).toUpperCase() + req.condition.slice(1) : null} />
          <Row label="Colour"    value={req.color} />
          <Row label="Asking Price"        value={req.asking_price_qar != null ? formatQAR(req.asking_price_qar) : null} />
          <Row label="Outstanding Finance" value={req.outstanding_finance_qar != null ? formatQAR(req.outstanding_finance_qar) : null} />
          {!req.target_car_name && <Row label="Desired Next Car" value={req.desired_vehicle} />}
          {!req.target_price_qar && <Row label="Budget" value={req.target_budget_qar != null ? formatQAR(req.target_budget_qar) : null} />}
          {req.description && (
            <div className="pt-2.5">
              <p className="text-xs text-gray-500 mb-1">Description</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 rounded-lg px-3 py-2">{req.description}</p>
            </div>
          )}
          {userNotes && !req.description && (
            <div className="pt-2.5">
              <p className="text-xs text-gray-500 mb-1">Notes to dealer</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 rounded-lg px-3 py-2">{userNotes}</p>
            </div>
          )}
        </div>

        {/* ── Contact info ── */}
        {(req.contact_name || req.contact_phone) && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
            <SectionHeader icon={User} title="Contact Details" />
            <Row label="Name"  value={req.contact_name} />
            <Row label="Phone" value={req.contact_phone} />
          </div>
        )}

        {/* ── Photos ── */}
        {photoUrls.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
            <SectionHeader icon={ImageIcon} title={`Evidence Photos (${photoUrls.length})`} />
            <div className="grid grid-cols-3 gap-2">
              {photoUrls.map((url, i) => (
                <button key={i} onClick={() => setLightboxUrl(url)}
                  className="aspect-square rounded-xl overflow-hidden border border-gray-100 hover:border-[#002b5b] transition-colors focus:outline-none">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
              <Info size={11} /> Tap a photo to view full size.
            </p>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4 space-y-3">
          {canCancel && req.target_car_name && (
            <Link
              href={`/trade-in?target_car_id=${req.target_car_id ?? ''}&target_name=${encodeURIComponent(req.target_car_name)}&target_price=${req.target_price_qar ?? ''}&target_dealer=${encodeURIComponent(req.target_dealer ?? '')}&cur_make=${encodeURIComponent(req.make)}&cur_model=${encodeURIComponent(req.class_name)}&cur_year=${req.year}&cur_km=${req.km}&cur_city=${encodeURIComponent(req.city)}&cur_condition=${req.condition ?? ''}`}
              className="flex items-center justify-center gap-2 text-sm font-bold text-[#002b5b] bg-[#ebf5ff] hover:bg-[#d6eeff] px-4 py-3 rounded-xl transition-colors"
            >
              ✏️ Edit &amp; Resubmit
            </Link>
          )}
          {canCancel && (
            <>
              {cancelError && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} /> {cancelError}
                </p>
              )}
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="w-full flex items-center justify-center gap-2 text-sm font-bold text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 px-4 py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {cancelling
                  ? <span className="w-4 h-4 border border-red-400 border-t-transparent rounded-full animate-spin" />
                  : <Ban size={15} />}
                Cancel this request
              </button>
            </>
          )}
          {!canCancel && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <CheckCircle2 size={15} className={req.status === 'accepted' ? 'text-green-500' : 'text-gray-400'} />
              <span>
                {req.status === 'accepted'  ? 'This request has been accepted.' :
                 req.status === 'rejected'  ? 'This request was declined by the dealer.' :
                 req.status === 'expired'   ? 'This request has expired.' :
                 'This request is closed.'}
              </span>
            </div>
          )}
        </div>

      </div>

      {/* ── Photo lightbox ── */}
      {lightboxUrl && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightboxUrl} alt="Full size" className="max-w-full max-h-full rounded-xl object-contain"
            onClick={e => e.stopPropagation()} />
          <button onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-xl font-bold transition-colors">
            ×
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
}
