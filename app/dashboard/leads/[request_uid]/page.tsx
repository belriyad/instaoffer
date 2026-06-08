'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, Car, Clock, AlertCircle, MapPin, Gauge,
  Send, CheckCircle2, Star, Zap, FileText, Phone, RefreshCw, ExternalLink,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import { getDealerLeadDetail, placeBid, OfferRequest, OfferBid } from '@/lib/api';
import { formatQAR, formatDate, formatKM } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  open:        { label: 'Open',        badgeClass: 'bg-blue-100 text-blue-700' },
  pending:     { label: 'Pending',     badgeClass: 'bg-yellow-100 text-yellow-700' },
  under_offer: { label: 'Under Offer', badgeClass: 'bg-purple-100 text-purple-700' },
  accepted:    { label: 'Accepted',    badgeClass: 'bg-green-100 text-green-700' },
  rejected:    { label: 'Rejected',    badgeClass: 'bg-red-100 text-red-700' },
  expired:     { label: 'Expired',     badgeClass: 'bg-gray-100 text-gray-500' },
  cancelled:   { label: 'Cancelled',   badgeClass: 'bg-gray-100 text-gray-400' },
};

const DEAL_CONFIG: Record<string, { label: string; color: string }> = {
  hot:   { label: '🔥 Hot Deal',    color: 'text-red-600' },
  good:  { label: '✅ Good Deal',   color: 'text-green-600' },
  watch: { label: '👀 Watch',       color: 'text-yellow-600' },
  skip:  { label: '⚠️ Skip',        color: 'text-gray-400' },
};

const LEAD_BANNER: Record<string, { label: string; cls: string }> = {
  urgent_sale:    { label: '⚡ Urgent Sale',    cls: 'bg-red-600 text-white' },
  trade_in:       { label: '🔄 Trade-In Lead',  cls: 'bg-green-600 text-white' },
  buyer_request:  { label: '🛒 Buyer Request',  cls: 'bg-blue-600 text-white' },
  dealer_inquiry: { label: '📋 Dealer Inquiry', cls: 'bg-purple-600 text-white' },
  seller_offer:   { label: '🚗 Seller Offer',   cls: 'bg-[#002b5b] text-white' },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
      <h2 className="font-bold text-gray-900 text-base mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900 text-right ml-4">{value}</span>
    </div>
  );
}

type RequestWithBids = OfferRequest & { bids: OfferBid[]; market_comps?: unknown };

export default function DealerLeadDetailPage() {
  const { request_uid } = useParams<{ request_uid: string }>();
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [req, setReq] = useState<RequestWithBids | null>(null);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Bid form
  const [bidOpen, setBidOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bidSent, setBidSent] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login/dealer');
  }, [user, loading, router]);

  useEffect(() => {
    if (!token || !request_uid) return;
    setFetching(true);
    getDealerLeadDetail(request_uid, token)
      .then(setReq)
      .catch(err => setFetchError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setFetching(false));
  }, [token, request_uid]);

  async function handlePlaceBid() {
    if (!token || !req) return;
    const amount = parseFloat(bidAmount.replace(/[^0-9.]/g, ''));
    if (!amount || amount <= 0) { setBidError('Enter a valid bid amount'); return; }
    setSubmitting(true);
    setBidError(null);
    try {
      await placeBid(req.request_uid, { amount_qar: amount, message: bidMessage || undefined }, token);
      setBidSent(true);
      setBidOpen(false);
      // Reload to show updated bid in list
      const updated = await getDealerLeadDetail(request_uid, token);
      setReq(updated);
    } catch (err) {
      setBidError(err instanceof Error ? err.message : 'Failed to place bid');
    } finally {
      setSubmitting(false);
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
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center max-w-md w-full shadow-sm">
            <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Lead Not Found</h2>
            <p className="text-sm text-gray-500 mb-6">{fetchError ?? 'This lead may have expired or been removed.'}</p>
            <Link href="/dashboard/leads"
              className="inline-flex items-center gap-2 bg-[#002b5b] text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-[#001a3d] transition-colors">
              <ChevronLeft size={16} /> Back to Leads
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[req.status] ?? { label: req.status, badgeClass: 'bg-gray-100 text-gray-500' };
  const dealCfg = req.deal_classification ? DEAL_CONFIG[req.deal_classification] : null;
  const leadType = req.lead_type ?? 'seller_offer';
  const leadBanner = LEAD_BANNER[leadType] ?? LEAD_BANNER.seller_offer;
  const isTradeIn = leadType === 'trade_in';
  const isUrgent = req.is_urgent || leadType === 'urgent_sale';
  const photos: string[] = (() => {
    try { return req.photo_urls_json ? JSON.parse(req.photo_urls_json) : []; } catch { return []; }
  })();

  const urgencyLabels: Record<string, string> = {
    leaving_qatar: 'Leaving Qatar',
    need_cash: 'Needs Cash',
    upgrading: 'Upgrading Vehicle',
    other: 'Other',
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      <div className="max-w-3xl mx-auto w-full px-4 py-8 flex-1">

        {/* Back + Header */}
        <div className="flex items-center gap-3 mb-4">
          <Link href="/dashboard/leads"
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-[#002b5b] transition-colors">
            <ChevronLeft size={16} /> Seller Leads
          </Link>
        </div>

        {/* Lead type banner */}
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl mb-4 text-sm font-bold ${leadBanner.cls}`}>
          {leadBanner.label}
        </div>

        {/* Urgent sale top alert */}
        {isUrgent && (
          <div className="bg-red-600 text-white rounded-2xl p-5 mb-4 flex items-start gap-4 shadow-lg">
            <Zap size={28} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-lg leading-tight">Urgent Sale — Act Fast</p>
              {req.urgency_reason && (
                <p className="text-sm mt-1 opacity-90">{urgencyLabels[req.urgency_reason] ?? req.urgency_reason}</p>
              )}
              {req.sell_priority && (
                <p className="text-xs opacity-75 mt-0.5 capitalize">Priority: {req.sell_priority}</p>
              )}
              <p className="text-xs opacity-75 mt-1">Seller wants to close quickly — respond now for best chance.</p>
            </div>
          </div>
        )}

        {/* Trade-in info panel */}
        {isTradeIn && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw size={16} className="text-green-600" />
              <p className="font-bold text-green-800 text-sm">This seller wants to trade in their car</p>
            </div>
            {req.description && (
              <p className="text-sm text-green-700 mb-3 bg-white/60 rounded-xl p-3">{req.description}</p>
            )}
            <Link
              href="/dashboard/trade-ins"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors"
            >
              <ExternalLink size={14} /> View Trade-In Queue
            </Link>
          </div>
        )}

        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              {req.year} {req.make} {req.class_name}
              {req.model ? ` ${req.model}` : ''}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
              <Clock size={13} /> Submitted {formatDate(req.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusCfg.badgeClass}`}>
              {statusCfg.label}
            </span>
            {dealCfg && (
              <span className={`text-sm font-bold ${dealCfg.color}`}>{dealCfg.label}</span>
            )}
          </div>
        </div>

        {/* Opportunity Score */}
        {req.opportunity_score !== undefined && req.opportunity_score !== null && (
          <div className="bg-[#002b5b] text-white rounded-2xl p-5 mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Opportunity Score</p>
              <p className="text-4xl font-black mt-1">{req.opportunity_score}<span className="text-lg font-semibold opacity-70">/100</span></p>
              {(() => {
                // Drop the stale "market estimate unavailable / asking price missing"
                // note when we actually have a market estimate (backend leaves it in).
                const explanations = (req.score_explanation ?? []).filter(
                  e => !(req.market_est_qar && /unavailable|missing/i.test(e))
                );
                return explanations.length > 0 ? (
                  <ul className="mt-2 space-y-0.5">
                    {explanations.map((e, i) => (
                      <li key={i} className="text-xs opacity-80 flex items-start gap-1.5">
                        <Star size={10} className="mt-0.5 shrink-0 opacity-60" /> {e}
                      </li>
                    ))}
                  </ul>
                ) : null;
              })()}
            </div>
            {req.potential_margin_qar && (
              <div className="text-right">
                <p className="text-xs opacity-70 font-medium">Est. Margin</p>
                <p className="text-2xl font-black">{formatQAR(req.potential_margin_qar)}</p>
              </div>
            )}
          </div>
        )}

        {/* Bid sent success banner */}
        {bidSent && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <CheckCircle2 size={20} className="text-green-600 shrink-0" />
            <div>
              <p className="font-bold text-green-900 text-sm">Bid Submitted</p>
              <p className="text-xs text-green-700 mt-0.5">Your offer has been sent to the seller.</p>
            </div>
          </div>
        )}

        {/* Vehicle Details */}
        <Section title="Vehicle Details">
          <div className="flex flex-wrap gap-3 mb-4">
            <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl text-sm font-semibold text-gray-700">
              <Car size={13} className="text-[#002b5b]" /> {req.year}
            </span>
            <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl text-sm font-semibold text-gray-700">
              <Gauge size={13} className="text-[#002b5b]" /> {formatKM(req.km)}
            </span>
            <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl text-sm font-semibold text-gray-700">
              <MapPin size={13} className="text-[#002b5b]" /> {req.city}
            </span>
            <span className="bg-gray-50 px-3 py-1.5 rounded-xl text-sm font-semibold text-gray-700 capitalize">
              {req.condition}
            </span>
          </div>
          <Row label="Make" value={req.make} />
          <Row label="Model" value={req.class_name + (req.model ? ` ${req.model}` : '')} />
          <Row label="Year" value={req.year} />
          <Row label="Mileage" value={formatKM(req.km)} />
          <Row label="Color" value={req.color} />
          <Row label="Condition" value={req.condition} />
          <Row label="City" value={req.city} />
          <Row label="VIN" value={req.vin} />
          <Row label="Chassis #" value={req.chassis_number} />
        </Section>

        {/* Seller Intent */}
        <Section title="Seller Intent">
          {req.asking_price_qar && (
            <div className="mb-4 bg-orange-50 rounded-xl p-4 border border-orange-100">
              <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-0.5">Asking Price</p>
              <p className="text-2xl font-black text-orange-600">{formatQAR(req.asking_price_qar)}</p>
            </div>
          )}
          {req.market_est_qar && (
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-500 mb-0.5">Market Estimate</p>
                <p className="font-bold text-gray-900">{formatQAR(req.market_est_qar)}</p>
              </div>
              {req.discount_pct && (
                <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                  <p className="text-xs text-gray-500 mb-0.5">Discount vs Market</p>
                  <p className="font-bold text-green-700">{req.discount_pct.toFixed(1)}%</p>
                </div>
              )}
            </div>
          )}
          {req.is_urgent && !isUrgent && (
            <div className="bg-red-50 rounded-xl p-3 border border-red-100 mb-3">
              <p className="text-xs font-bold text-red-700 flex items-center gap-1 mb-1">
                <Zap size={12} /> Urgent Sale
              </p>
              {req.urgency_reason && (
                <p className="text-xs text-red-600">{urgencyLabels[req.urgency_reason] ?? req.urgency_reason}</p>
              )}
              {req.sell_priority && (
                <p className="text-xs text-red-500 mt-0.5 capitalize">Priority: {req.sell_priority}</p>
              )}
            </div>
          )}
          {!isTradeIn && req.description && (
            <div className="mt-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                <FileText size={11} /> Seller Notes
              </p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{req.description}</p>
            </div>
          )}
        </Section>

        {/* Photos */}
        {photos.length > 0 && (
          <Section title={`Photos (${photos.length})`}>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Photo ${i + 1}`}
                    className="w-full aspect-square object-cover rounded-xl border border-gray-100 hover:opacity-90 transition-opacity" />
                </a>
              ))}
            </div>
          </Section>
        )}

        {/* Seller Contact */}
        {(req.contact_name || req.contact_phone) && (
          <Section title="Seller Contact">
            <Row label="Name" value={req.contact_name} />
            {req.contact_phone && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500">Phone</span>
                <div className="flex items-center gap-2">
                  <a href={`tel:${req.contact_phone}`}
                    className="flex items-center gap-1.5 text-sm font-semibold text-[#002b5b] hover:underline">
                    <Phone size={13} /> {req.contact_phone}
                  </a>
                  <a
                    href={`https://wa.me/${req.contact_phone.replace(/\D/g, '')}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-xs bg-green-100 hover:bg-green-200 text-green-700 font-bold px-2.5 py-1 rounded-lg transition-colors"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            )}
          </Section>
        )}

        {/* Existing Bids */}
        {req.bids && req.bids.length > 0 && (
          <Section title={`Bids (${req.bids.length})`}>
            <div className="space-y-3">
              {req.bids.map((bid, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <div>
                    <p className="font-bold text-gray-900">{formatQAR(bid.amount_qar)}</p>
                    {bid.message && <p className="text-xs text-gray-500 mt-0.5">{bid.message}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(bid.created_at)}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                    bid.status === 'accepted' ? 'bg-green-100 text-green-700' :
                    bid.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {bid.status}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Place Bid CTA — only for seller_offer / urgent_sale */}
        {!isTradeIn && req.status === 'open' && !bidSent && (
          <div className="sticky bottom-6 z-10">
            {!bidOpen ? (
              <button
                onClick={() => setBidOpen(true)}
                className="w-full flex items-center justify-center gap-2 bg-[#005ca9] hover:bg-orange-600 text-white font-black py-4 rounded-2xl text-base shadow-lg transition-colors"
              >
                <Send size={18} /> Place a Bid
              </button>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-5">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Send size={16} className="text-[#002b5b]" /> Submit Your Offer
                </h3>
                <div className="mb-3">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Your Offer (QAR)</label>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={e => setBidAmount(e.target.value)}
                    placeholder="e.g. 85000"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#002b5b]"
                  />
                </div>
                <div className="mb-3">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Message to Seller (optional)</label>
                  <textarea
                    value={bidMessage}
                    onChange={e => setBidMessage(e.target.value)}
                    rows={2}
                    placeholder="e.g. We can complete the transfer within 2 days..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-[#002b5b]"
                  />
                </div>
                {bidError && (
                  <p className="text-xs text-red-600 mb-2 flex items-center gap-1">
                    <AlertCircle size={12} /> {bidError}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setBidOpen(false); setBidError(null); }}
                    className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:border-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePlaceBid}
                    disabled={submitting}
                    className="flex-1 bg-[#002b5b] hover:bg-[#001a3d] text-white font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <><Send size={14} /> Send Offer</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Trade-in CTA */}
        {isTradeIn && (
          <div className="sticky bottom-6 z-10">
            <Link
              href="/dashboard/trade-ins"
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-2xl text-base shadow-lg transition-colors"
            >
              <RefreshCw size={18} /> View Trade-In Queue
            </Link>
          </div>
        )}

      </div>
      <Footer />
    </div>
  );
}
