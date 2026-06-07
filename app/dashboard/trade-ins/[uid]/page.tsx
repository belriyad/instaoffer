'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, RefreshCw, Car, Clock, AlertCircle,
  MapPin, Gauge, Phone, FileText, Send, CheckCircle2,
  TrendingDown, TrendingUp, Package, Info, ArrowRight,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import { getDealerTradeInDetail, submitTradeInProposal, getMLEstimate, getMLForecast, MLForecast, TradeInRequest } from '@/lib/api';
import { formatQAR, formatDate } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  open:         { label: 'Open',          badgeClass: 'bg-blue-100 text-blue-700' },
  under_review: { label: 'Under Review',  badgeClass: 'bg-yellow-100 text-yellow-700' },
  offer_made:   { label: 'Offer Sent',    badgeClass: 'bg-purple-100 text-purple-700' },
  accepted:     { label: 'Accepted',      badgeClass: 'bg-green-100 text-green-700' },
  rejected:     { label: 'Declined',      badgeClass: 'bg-red-100 text-red-700' },
  expired:      { label: 'Expired',       badgeClass: 'bg-gray-100 text-gray-400' },
  cancelled:    { label: 'Cancelled',     badgeClass: 'bg-gray-100 text-gray-400' },
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
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900 text-right ml-4">{value}</span>
    </div>
  );
}

export default function TradeInDetailPage() {
  const { uid } = useParams<{ uid: string }>();
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [req, setReq] = useState<TradeInRequest | null>(null);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [proposalOpen, setProposalOpen] = useState(false);
  const [proposalNote, setProposalNote] = useState('');
  const [tradeInOffer, setTradeInOffer] = useState('');     // what dealer offers for customer's car
  const [newCarPrice,  setNewCarPrice]  = useState('');     // price of new car (pre-filled from target)
  const [submitting, setSubmitting] = useState(false);
  const [proposalSent, setProposalSent] = useState(false);
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [mlEstimate, setMlEstimate] = useState<number | null>(null);
  const [forecast, setForecast] = useState<MLForecast | null>(null);

  // Auto-open proposal form if navigated here via #proposal hash (from list "Send Proposal" button)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#proposal') {
      setProposalOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) router.push('/login/dealer');
  }, [user, loading, router]);

  useEffect(() => {
    if (!token || !uid) return;
    setFetching(true);
    getDealerTradeInDetail(uid, token)
      .then(setReq)
      .catch(err => setFetchError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setFetching(false));
  }, [token, uid]);

  // The dealer trade-in feed doesn't include market_est_qar or a forward value, so
  // compute both from the ML model — otherwise the valuation tiles show "—".
  useEffect(() => {
    if (!token || !req || !req.make || !req.class_name || !req.year || !req.km) return;
    const params = {
      make: req.make,
      class_name: req.class_name,
      manufacture_year: req.year,
      km: req.km,
      city: req.city || undefined,
    };
    if (!req.market_est_qar) {
      getMLEstimate(params, token)
        .then(est => setMlEstimate(Math.round(est.estimated_price_qar)))
        .catch(() => { /* leave as — */ });
    }
    getMLForecast(params, token)
      .then(setForecast)
      .catch(() => { /* forecast optional */ });
  }, [token, req]);

  async function handleSendProposal() {
    if (!token || !req) return;
    const offerNum     = parseFloat(tradeInOffer.replace(/[^0-9.]/g, ''));
    const newCarNum    = parseFloat(newCarPrice.replace(/[^0-9.]/g, '')) || req.target_price_qar || 0;
    if (!offerNum || offerNum <= 0) { setProposalError('Enter a valid trade-in offer amount'); return; }
    setSubmitting(true);
    setProposalError(null);
    try {
      // Build transparent breakdown message
      const packagePrice = Math.max(0, newCarNum - offerNum);
      const mktMid = req.market_est_qar ?? mlEstimate;
      const mktPackage = mktMid ? Math.max(0, newCarNum - mktMid) : null;
      const lines = [
        `📦 Package Deal Proposal`,
        `• Trade-in offer for your vehicle: QAR ${offerNum.toLocaleString()}`,
        `• New vehicle price (${req.target_car_name ?? 'target car'}): QAR ${newCarNum.toLocaleString()}`,
        `• You pay (package price): QAR ${packagePrice.toLocaleString()}`,
        mktMid ? `• Market value of your car: ~QAR ${mktMid.toLocaleString()}` : null,
        mktPackage != null ? `• At market rate, you'd pay: ~QAR ${mktPackage.toLocaleString()}` : null,
        proposalNote ? `\nMessage: ${proposalNote}` : null,
      ].filter(Boolean).join('\n');
      await submitTradeInProposal(uid, { offered_value_qar: offerNum, message: lines }, token);
      setProposalSent(true);
      setProposalOpen(false);
    } catch (err) {
      setProposalError(err instanceof Error ? err.message : 'Failed to send proposal');
    } finally {
      setSubmitting(false);
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
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center max-w-md w-full shadow-sm">
            <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Not Found</h2>
            <p className="text-sm text-gray-500 mb-6">
              {fetchError || "This trade-in request doesn't exist or you don't have access."}
            </p>
            <Link href="/dashboard/trade-ins"
              className="inline-flex items-center gap-2 bg-[#003087] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#002070] transition-colors">
              <ChevronLeft size={16} /> Back to Trade-ins
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const status = STATUS_CONFIG[req.status] ?? { label: req.status, badgeClass: 'bg-gray-100 text-gray-500' };
  const photos: string[] = (() => {
    try { return req.photo_urls_json ? JSON.parse(req.photo_urls_json) : []; } catch { return []; }
  })();

  // Parse trade-in required flag from notes
  const tradeInRequired = req.notes?.includes('REQUIRED') ?? false;
  const tradeInOptional = req.notes?.includes('Optional') ?? false;

  // Use the record's estimate, falling back to the ML-computed one.
  const marketEst = req.market_est_qar ?? mlEstimate;
  const diffLow = req.target_price_qar && marketEst
    ? Math.max(0, req.target_price_qar - marketEst) : null;
  // Forward-looking value — shown when there's no target vehicle to gap against.
  // Prefer the 12-month point; fall back to the longest horizon the model returned.
  const fcPoints = forecast?.forecast ?? [];
  const fcProjection = fcPoints.find(f => f.horizon === '12m') ?? fcPoints[fcPoints.length - 1] ?? null;

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
      <Navbar />
      <div className="max-w-3xl mx-auto w-full px-4 py-8 flex-1">
        <Link href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#003087] mb-6 transition-colors">
          <ChevronLeft size={16} /> Dashboard
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw size={18} className="text-green-600" />
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
              {(tradeInRequired || tradeInOptional) && (
                <div className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-bold ${tradeInRequired ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {tradeInRequired ? '🚫 Trade-in REQUIRED to proceed' : '✅ Trade-in is optional'}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <Clock size={12} /> Submitted {formatDate(req.created_at)}
              </p>
            </div>
            <span className={`text-sm font-semibold px-3 py-1.5 rounded-full shrink-0 ${status.badgeClass}`}>
              {status.label}
            </span>
          </div>
        </div>

        {/* Target car */}
        {req.target_car_name && (
          <Section title="🎯 Target Vehicle">
            <div className="bg-green-50 rounded-xl p-4">
              <p className="font-black text-gray-900 text-lg">{req.target_car_name}</p>
              {req.target_dealer && <p className="text-sm text-gray-500 mt-0.5">Dealer: {req.target_dealer}</p>}
              {req.target_price_qar && (
                <p className="text-xl font-black text-[#003087] mt-2">{formatQAR(req.target_price_qar)}</p>
              )}
            </div>
          </Section>
        )}

        {/* Trade-in vehicle detail */}
        <Section title="🚗 Trade-in Vehicle">
          <Row label="Make" value={req.make} />
          <Row label="Model" value={req.class_name} />
          <Row label="Year" value={req.year} />
          <Row label="Mileage" value={req.km ? `${req.km.toLocaleString()} km` : null} />
          <Row label="City" value={req.city} />
          <Row label="Condition" value={req.condition} />
        </Section>

        {/* Valuation */}
        <Section title="💰 Estimated Valuation">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-1">Est. Trade-in Value</p>
              <p className="text-lg font-black text-gray-900">
                {marketEst ? formatQAR(marketEst) : '—'}
              </p>
            </div>
            {diffLow != null ? (
              <div className="bg-orange-50 rounded-xl p-4">
                <p className="text-xs text-orange-600 font-bold uppercase tracking-wide mb-1">Est. Gap to Target</p>
                <p className="text-lg font-black text-gray-900">{formatQAR(diffLow)}</p>
              </div>
            ) : fcProjection ? (
              <div className="bg-orange-50 rounded-xl p-4">
                <p className="text-xs text-orange-600 font-bold uppercase tracking-wide mb-1">Projected Value ({fcProjection.horizon})</p>
                <p className="text-lg font-black text-gray-900">{formatQAR(Math.round(fcProjection.estimated_price_qar))}</p>
                <p className={`text-xs font-semibold mt-0.5 ${fcProjection.change_pct >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {fcProjection.change_pct >= 0 ? '+' : ''}{fcProjection.change_pct}% vs today
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-1">Gap to Target</p>
                <p className="text-sm text-gray-400">No target vehicle selected</p>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
            * Estimates are indicative. Final offer depends on vehicle inspection.
          </p>
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

        {/* Contact */}
        {(req.contact_name || req.contact_phone) && (
          <Section title="📞 Contact Details">
            <Row label="Name" value={req.contact_name} />
            {req.contact_phone && (
              <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Phone size={13} /> Phone
                </span>
                <a href={`tel:${req.contact_phone}`} className="text-sm font-semibold text-[#003087] hover:underline">
                  {req.contact_phone}
                </a>
              </div>
            )}
          </Section>
        )}

        {/* Notes */}
        {req.notes && (
          <Section title="📝 Notes">
            <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{req.notes}</p>
          </Section>
        )}

        {/* Timeline */}
        <Section title="📋 Status Timeline">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
              <Car size={15} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Request submitted</p>
              <p className="text-xs text-gray-400">{formatDate(req.created_at)}</p>
            </div>
          </div>
          {req.status !== 'new' && (
            <div className="flex items-center gap-3 mt-3 pl-4 border-l-2 border-gray-100 ml-4">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center shrink-0">
                <Clock size={15} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 capitalize">{req.status}</p>
              </div>
            </div>
          )}
          {req.status === 'accepted' && (
            <div className="flex items-center gap-3 mt-3 pl-4 border-l-2 border-green-200 ml-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle2 size={15} className="text-green-600" />
              </div>
              <p className="text-sm font-semibold text-green-700">Deal accepted</p>
            </div>
          )}
        </Section>

        {/* Actions */}
        {proposalSent ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
            <CheckCircle2 size={32} className="text-green-500 mx-auto mb-2" />
            <p className="font-bold text-green-800">Proposal sent!</p>
            <p className="text-sm text-green-600 mt-1">The buyer will be notified of your proposal.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FileText size={16} className="text-[#003087]" /> Actions
            </h2>
            {!proposalOpen ? (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setProposalOpen(true);
                    // Pre-fill new car price from request target
                    if (req.target_price_qar && !newCarPrice) setNewCarPrice(String(req.target_price_qar));
                  }}
                  disabled={['offer_made', 'accepted', 'rejected', 'closed'].includes(req.status)}
                  className="flex items-center gap-2 bg-[#003087] hover:bg-[#002070] text-white font-bold px-5 py-3 rounded-xl text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send size={15} /> {req.status === 'offer_made' ? 'Proposal Sent' : 'Send Proposal'}
                </button>
              </div>
            ) : (() => {
              // Live package calculation
              const offerNum   = parseFloat(tradeInOffer.replace(/[^0-9.]/g, '')) || 0;
              const newCarNum  = parseFloat(newCarPrice.replace(/[^0-9.]/g, ''))  || req.target_price_qar || 0;
              const pkgPrice   = offerNum > 0 && newCarNum > 0 ? Math.max(0, newCarNum - offerNum) : null;
              const mktMid     = req.market_est_qar ?? mlEstimate;
              const mktPkg     = mktMid && newCarNum > 0 ? Math.max(0, newCarNum - mktMid) : null;
              const saving     = pkgPrice != null && mktPkg != null ? mktPkg - pkgPrice : null;

              return (
                <div className="space-y-4" id="proposal">
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Info size={12} /> Fill in the package deal details so the buyer can see exactly what they are getting.
                  </p>

                  {/* ── Input fields ── */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                        Your offer for their car (QAR) *
                      </label>
                      <input
                        type="number"
                        value={tradeInOffer}
                        onChange={e => setTradeInOffer(e.target.value)}
                        placeholder={mktMid ? `Market ~${Math.round(mktMid / 1000)}k` : 'e.g. 60000'}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]"
                      />
                      {mktMid && offerNum > 0 && (
                        <p className={`text-xs mt-1 font-semibold ${offerNum >= mktMid ? 'text-green-600' : 'text-orange-500'}`}>
                          {offerNum >= mktMid
                            ? `✓ Above market (${formatQAR(mktMid)} mid)`
                            : `↓ Below market by ${formatQAR(mktMid - offerNum)}`}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                        New car price (QAR)
                      </label>
                      <input
                        type="number"
                        value={newCarPrice}
                        onChange={e => setNewCarPrice(e.target.value)}
                        placeholder={req.target_price_qar ? String(req.target_price_qar) : 'e.g. 280000'}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]"
                      />
                    </div>
                  </div>

                  {/* ── Live package breakdown ── */}
                  {(offerNum > 0 || newCarNum > 0) && (
                    <div className="bg-[#f0f4ff] border border-[#003087]/15 rounded-2xl p-4 space-y-3">
                      <p className="text-xs font-black text-[#003087] uppercase tracking-wide flex items-center gap-1">
                        <Package size={13} /> Package Deal Breakdown
                      </p>

                      {/* Row: new car */}
                      {newCarNum > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 flex items-center gap-1.5">
                            🚗 {req.target_car_name ?? 'New vehicle'}
                          </span>
                          <span className="font-bold text-gray-900">{formatQAR(newCarNum)}</span>
                        </div>
                      )}

                      {/* Row: trade-in credit */}
                      {offerNum > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 flex items-center gap-1.5">
                            <TrendingDown size={13} className="text-green-600" /> Trade-in credit
                          </span>
                          <span className="font-bold text-green-700">− {formatQAR(offerNum)}</span>
                        </div>
                      )}

                      {/* Divider + package price */}
                      {pkgPrice != null && (
                        <>
                          <div className="border-t border-[#003087]/15" />
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-gray-900">Buyer pays</span>
                            <span className="text-xl font-black text-[#003087]">{formatQAR(pkgPrice)}</span>
                          </div>
                        </>
                      )}

                      {/* Market comparison */}
                      {mktMid && mktPkg != null && pkgPrice != null && (
                        <div className="bg-white rounded-xl p-3 border border-gray-100 space-y-1.5">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Market Value Comparison</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Market trade-in value (est.)</span>
                            <span className="font-semibold text-gray-800">
                              {mktMid ? formatQAR(mktMid) : '—'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>If buyer sold at market rate, they&apos;d pay</span>
                            <span className="font-semibold text-gray-800">~{formatQAR(mktPkg)}</span>
                          </div>
                          <div className="flex items-center justify-between border-t pt-1.5 mt-1">
                            <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                              {saving != null && saving > 0
                                ? <><TrendingUp size={12} className="text-green-600" /> Buyer saves</>
                                : <><ArrowRight size={12} className="text-orange-500" /> Extra cost vs market</>}
                            </span>
                            <span className={`text-sm font-black ${saving != null && saving > 0 ? 'text-green-700' : 'text-orange-600'}`}>
                              {saving != null ? (saving > 0 ? `${formatQAR(saving)}` : `${formatQAR(-saving)}`) : '—'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <Info size={10} /> Market estimate is indicative. Actual value depends on inspection.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Optional message ── */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                      Message to buyer (optional)
                    </label>
                    <textarea
                      value={proposalNote}
                      onChange={e => setProposalNote(e.target.value)}
                      rows={2}
                      placeholder="e.g. This package includes a full service and 1-year warranty..."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087] resize-none"
                    />
                  </div>

                  {/* ── Submit row ── */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSendProposal}
                      disabled={submitting || !tradeInOffer}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting
                        ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        : <Send size={14} />}
                      {submitting ? 'Sending…' : 'Send Package Proposal'}
                    </button>
                    <button
                      onClick={() => { setProposalOpen(false); setProposalError(null); }}
                      className="text-sm text-gray-500 hover:text-gray-700 font-semibold px-4 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  {proposalError && (
                    <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                      <AlertCircle size={12} /> {proposalError}
                    </p>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
