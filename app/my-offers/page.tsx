'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Clock, ChevronRight, Car, AlertCircle, Lock,
  RefreshCw, Tag, X, Pencil, Ban,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import { getMyOfferRequests, getMyTradeInRequests, cancelTradeInRequest, OfferRequest, TradeInRequest } from '@/lib/api';
import { formatQAR, formatDate, waLink } from '@/lib/utils';

const OFFER_STATUS: Record<string, { label: string; color: string }> = {
  open:        { label: 'Open',           color: 'bg-blue-50 text-blue-700' },
  under_offer: { label: 'Offer Received', color: 'bg-orange-50 text-orange-700' },
  accepted:    { label: 'Accepted',       color: 'bg-green-50 text-green-700' },
  rejected:    { label: 'Rejected',       color: 'bg-red-50 text-red-700' },
  expired:     { label: 'Expired',        color: 'bg-gray-100 text-gray-500' },
  cancelled:   { label: 'Cancelled',      color: 'bg-gray-100 text-gray-500' },
  pending:     { label: 'Pending Review', color: 'bg-yellow-50 text-yellow-700' },
};

const TRADEIN_STATUS: Record<string, { label: string; color: string }> = {
  new:       { label: 'Submitted',   color: 'bg-blue-50 text-blue-700' },
  reviewing: { label: 'Reviewing',   color: 'bg-yellow-50 text-yellow-700' },
  proposed:  { label: 'Proposal Received', color: 'bg-purple-50 text-purple-700' },
  accepted:  { label: 'Accepted',    color: 'bg-green-50 text-green-700' },
  rejected:  { label: 'Declined',    color: 'bg-red-50 text-red-700' },
  closed:    { label: 'Closed',      color: 'bg-gray-100 text-gray-500' },
  cancelled: { label: 'Cancelled',   color: 'bg-gray-100 text-gray-500' },
};

// ─── Unauthenticated teaser ───────────────────────────────────────────────────
function UnauthenticatedState() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">My Requests</h1>
          <p className="text-gray-500">Track offers and trade-in requests</p>
        </motion.div>

        {/* Blurred mock cards */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="relative mb-8">
          <div className="space-y-3">
            {[
              { dealer: 'Al Meera Cars', amount: '285,000 QAR', badge: '🏆 Best Offer' },
              { dealer: 'Qatar Premium Auto', amount: '271,000 QAR', badge: null },
              { dealer: 'Gulf Motors', amount: '268,500 QAR', badge: null },
            ].map((card, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between select-none"
                style={{ filter: 'blur(4px)', userSelect: 'none' }}>
                <div>
                  <p className="font-bold text-gray-900">{card.dealer}</p>
                  <p className="text-sm text-gray-400">Toyota Camry 2022 · 45,000 km</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-lg text-[#002b5b]">{card.amount}</p>
                  {card.badge && <span className="text-xs font-bold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">{card.badge}</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-transparent via-[#f8fafc]/60 to-[#f8fafc]/90 rounded-2xl">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 px-6 py-4 flex items-center gap-3">
              <Lock size={20} className="text-[#002b5b]" />
              <p className="font-bold text-gray-800 text-sm">Sign in to see your requests</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
          <Link href="/login?redirect=/my-offers"
            className="flex items-center justify-center gap-2 w-full bg-[#002b5b] hover:bg-[#001a3d] text-white font-black py-4 rounded-xl text-lg shadow-md transition-all">
            Sign In to View Requests
          </Link>
          <Link href="/valuation"
            className="flex items-center justify-center gap-2 w-full border-2 border-[#002b5b] text-[#002b5b] font-bold py-3 rounded-xl transition-all hover:bg-[#002b5b]/5">
            <Car size={18} /> Get Free Valuation
          </Link>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function MyOffersSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900">My Requests</h1>
            <p className="text-gray-500 mt-1">Track your offer and trade-in requests</p>
          </div>
        </div>
        {/* Tab placeholder */}
        <div className="h-12 bg-white rounded-xl border border-gray-100 mb-6 animate-pulse" />
        {/* Card placeholders */}
        <div className="space-y-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm animate-pulse">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2.5">
                  <div className="h-5 bg-gray-100 rounded w-2/5" />
                  <div className="h-3.5 bg-gray-100 rounded w-3/5" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
                <div className="h-9 w-20 bg-gray-100 rounded-xl shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}

// ─── Authenticated view ───────────────────────────────────────────────────────
function MyOffersContent() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const submitted = searchParams.get('submitted');
  const tabParam = searchParams.get('tab');

  // Land on the right tab: an explicit ?tab=, else the Sell Offers tab when
  // arriving from a sell submission (?submitted=), else Trade-in by default.
  const initialTab: 'offers' | 'tradeins' =
    tabParam === 'offers' || tabParam === 'tradeins'
      ? tabParam
      : submitted ? 'offers' : 'tradeins';
  const [tab, setTab] = useState<'offers' | 'tradeins'>(initialTab);
  const [offers, setOffers] = useState<OfferRequest[]>([]);
  const [tradeIns, setTradeIns] = useState<TradeInRequest[]>([]);
  const [fetching, setFetching] = useState(true);
  const [cancellingUid, setCancellingUid] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setFetching(true);
    Promise.allSettled([
      getMyOfferRequests(token),
      getMyTradeInRequests(token),
    ]).then(([offersRes, tradeInsRes]) => {
      if (offersRes.status === 'fulfilled') {
        setOffers((offersRes.value as { rows?: OfferRequest[] }).rows || []);
      }
      if (tradeInsRes.status === 'fulfilled') {
        setTradeIns(tradeInsRes.value.rows || []);
      }
    }).finally(() => setFetching(false));
  }, [token]);

  async function handleCancel(uid: string) {
    if (!token) return;
    if (!confirm('Cancel this trade-in request? The dealer will be notified.')) return;
    setCancellingUid(uid);
    setCancelError(null);
    try {
      const { request: updated } = await cancelTradeInRequest(uid, token);
      setTradeIns(prev => prev.map(r =>
        (r.uid ?? r.trade_in_uid) === uid ? updated : r
      ));
    } catch {
      setCancelError('Could not cancel. Please try again or contact support.');
    } finally {
      setCancellingUid(null);
    }
  }

  if (fetching) {
    return <MyOffersSkeleton />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900">My Requests</h1>
            <p className="text-gray-500 mt-1">Track your offer and trade-in requests</p>
          </div>
          <Link href="/submit-offer"
            className="flex items-center gap-2 bg-[#005ca9] hover:bg-[#004a87] text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all">
            <Car size={15} /> New Offer
          </Link>
        </div>

        {/* Submitted banner */}
        {submitted && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <CheckCircle2 size={20} className="text-green-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-green-800">Request submitted successfully!</p>
              <p className="text-sm text-green-700 mt-0.5">Dealers will review and send you offers shortly.</p>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 mb-6 shadow-sm">
          {([
            { key: 'tradeins', icon: RefreshCw, label: 'Trade-in Requests', count: tradeIns.length },
            { key: 'offers',   icon: Car,       label: 'Sell Offers',        count: offers.length },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                tab === t.key ? 'bg-[#002b5b] text-white shadow' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <t.icon size={15} />
              {t.label}
              {t.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${tab === t.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {cancelError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4 flex items-center gap-2">
            <AlertCircle size={14} /> {cancelError}
          </div>
        )}

        {/* ── Trade-in requests ── */}
        <AnimatePresence mode="wait">
          {tab === 'tradeins' && (
            <motion.div key="tradeins" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {tradeIns.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                  <RefreshCw size={40} className="text-gray-200 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No trade-in requests yet</h3>
                  <p className="text-gray-500 mb-6">Browse vehicles and start a trade-in from any car listing.</p>
                  <Link href="/listings"
                    className="inline-flex items-center gap-2 bg-[#002b5b] hover:bg-[#1a7fd4] text-white font-bold px-6 py-3 rounded-xl transition-colors">
                    Browse Vehicles <ChevronRight size={18} />
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {tradeIns.map(req => {
                    const uid = req.uid ?? req.trade_in_uid ?? '';
                    const st = TRADEIN_STATUS[req.status] ?? { label: req.status, color: 'bg-gray-100 text-gray-500' };
                    const canCancel = !['cancelled', 'closed', 'accepted'].includes(req.status);
                    const isCancelling = cancellingUid === uid;
                    const tradeInMustHave = req.notes?.includes('REQUIRED');
                    return (
                      <motion.div key={uid} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Status + required badge */}
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${st.color}`}>
                                {st.label}
                              </span>
                              {tradeInMustHave != null && (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tradeInMustHave ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                                  {tradeInMustHave ? '🚫 Must trade-in' : '✅ Optional'}
                                </span>
                              )}
                            </div>

                            {/* My car */}
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <Car size={14} className="text-gray-400 shrink-0" />
                              <p className="font-bold text-gray-900 truncate">
                                {req.year} {req.make} {req.class_name}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500 mb-1">{req.km?.toLocaleString()} km · {req.city}</p>

                            {/* Target car */}
                            {req.target_car_name && (
                              <div className="flex items-center gap-1.5 mt-1.5 bg-[#002b5b]/5 rounded-lg px-2.5 py-1.5">
                                <Tag size={12} className="text-[#002b5b] shrink-0" />
                                <span className="text-xs font-bold text-[#002b5b] truncate">{req.target_car_name}</span>
                                {req.target_price_qar && (
                                  <span className="text-xs font-black text-[#002b5b] ml-auto shrink-0">{formatQAR(req.target_price_qar)}</span>
                                )}
                              </div>
                            )}

                            {/* Estimate */}
                            {req.estimate_low_qar && req.estimate_high_qar && (
                              <p className="text-xs text-green-700 font-semibold mt-1.5">
                                Est. value: {formatQAR(req.estimate_low_qar)} – {formatQAR(req.estimate_high_qar)}
                              </p>
                            )}

                            {/* Proposal received */}
                            {req.status === 'proposed' && (
                              <div className="mt-2 flex items-center gap-1.5 text-xs text-purple-700 font-bold">
                                <AlertCircle size={12} /> Dealer sent a proposal — review it now
                              </div>
                            )}

                            <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                              <Clock size={11} /> Submitted {formatDate(req.created_at)}
                            </p>
                          </div>

                          {/* Actions column */}
                          <div className="flex flex-col gap-2 shrink-0">
                            {uid && (
                              <Link href={`/my-trade-ins/${uid}`}
                                className="flex items-center gap-1 text-sm font-semibold text-[#002b5b] bg-[#ebf5ff] hover:bg-[#d6eeff] px-3 py-2 rounded-xl transition-colors">
                                View <ChevronRight size={14} />
                              </Link>
                            )}
                            {canCancel && uid && (
                              <button onClick={() => handleCancel(uid)} disabled={isCancelling}
                                className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 px-3 py-2 rounded-xl transition-colors disabled:opacity-50">
                                {isCancelling
                                  ? <span className="w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full animate-spin" />
                                  : <Ban size={13} />}
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Sell offer requests ── */}
          {tab === 'offers' && (
            <motion.div key="offers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {offers.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                  <Car size={48} className="text-gray-200 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No offer requests yet</h3>
                  <p className="text-gray-500 mb-6">Start by getting a free valuation on your car</p>
                  <Link href="/valuation"
                    className="inline-flex items-center gap-2 bg-[#002b5b] hover:bg-[#1a7fd4] text-white font-bold px-6 py-3 rounded-xl transition-colors">
                    Get Free Valuation <ChevronRight size={18} />
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {offers.map(req => {
                    const status = OFFER_STATUS[req.status] || { label: req.status, color: 'bg-gray-100 text-gray-500' };
                    return (
                      <motion.div key={req.request_uid} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-gray-900 text-lg">{req.year} {req.make} {req.class_name}</h3>
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.color}`}>{status.label}</span>
                            </div>
                            <p className="text-sm text-gray-500">{req.km?.toLocaleString()} km · {req.city} · {req.condition}</p>
                            {req.asking_price_qar && (
                              <p className="text-sm text-gray-600 mt-1">Asking: {formatQAR(req.asking_price_qar)}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                              <Clock size={12} /> Submitted {formatDate(req.created_at)}
                            </p>
                          </div>
                          <Link href={`/my-offers/${req.request_uid}`}
                            className="flex-shrink-0 flex items-center gap-1 text-sm font-semibold text-[#002b5b] hover:text-[#1a7fd4] bg-[#ebf5ff] px-4 py-2 rounded-xl transition-colors">
                            View <ChevronRight size={16} />
                          </Link>
                        </div>
                        {req.status === 'under_offer' && (
                          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-sm text-orange-600">
                            <AlertCircle size={14} /> You have new dealer offers waiting!
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  );
}

export default function MyOffersPage() {
  return (
    <Suspense fallback={<div />}>
      <MyOffersRouter />
    </Suspense>
  );
}

function MyOffersRouter() {
  const { user, loading } = useAuth();
  if (loading) return <MyOffersSkeleton />;
  if (!user) return <UnauthenticatedState />;
  return <MyOffersContent />;
}
