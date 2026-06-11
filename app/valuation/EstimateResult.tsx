'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, TrendingUp, Shield, ArrowRight, Clock, Zap, RefreshCw, Bookmark } from 'lucide-react';
import { MLEstimate, MLForecast, OfferComps, MLTimeToSellEstimate, mlPriceBand, intentPriceBands } from '@/lib/api';
import { formatQAR, formatKM } from '@/lib/utils';
import { ValuationData } from './page';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface Props {
  estimate: MLEstimate;
  forecast: MLForecast | null;
  comps: OfferComps | null;
  timeToSell: MLTimeToSellEstimate | null;
  data: ValuationData;
}

// Confidence from the model's MAPE: lower error → higher confidence.
function rangeConfidence(estimate: MLEstimate): { label: string; cls: string } {
  const { mapePct } = mlPriceBand(estimate);
  if (mapePct <= 8)  return { label: 'High confidence', cls: 'bg-green-50 text-green-700 border-green-200' };
  if (mapePct <= 15) return { label: 'Medium confidence', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { label: 'Indicative range', cls: 'bg-gray-50 text-gray-500 border-gray-200' };
}

/** KBB-style semicircle gauge: red (low) · green (your range) · grey (high),
 *  with a pointer at where the value sits within its range. */
function PriceGauge({ low, high, value }: { low: number; high: number; value: number }) {
  const cx = 130, cy = 126, r = 98, sw = 28;
  const pt = (a: number): [number, number] => {
    const rad = (a * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)];
  };
  const arc = (a1: number, a2: number) => {
    const [x1, y1] = pt(a1), [x2, y2] = pt(a2);
    return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  };
  const valuePct = high > low ? Math.min(1, Math.max(0, (value - low) / (high - low))) : 0.5;
  const ptrAngle = 116 - valuePct * 52; // map within the green band (116°→64°)
  const [px, py] = pt(ptrAngle);
  return (
    <svg viewBox="0 0 260 140" className="w-full max-w-[330px] mx-auto block">
      <path d={arc(180, 124)} stroke="#dc2626" strokeWidth={sw} fill="none" />
      <path d={arc(116, 64)}  stroke="#16a34a" strokeWidth={sw} fill="none" />
      <path d={arc(56, 0)}    stroke="#cbd5e1" strokeWidth={sw} fill="none" />
      <line x1={px} y1={py} x2={px} y2={2} stroke="#94a3b8" strokeWidth="1.5" />
      <circle cx={px} cy={py} r="10" fill="#16a34a" stroke="#fff" strokeWidth="3" />
    </svg>
  );
}

export default function EstimateResult({ estimate, forecast, comps, timeToSell, data }: Props) {
  const bands = intentPriceBands(estimate);
  const confidence = rangeConfidence(estimate);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [saved, setSaved] = useState(false);
  const [priceTab, setPriceTab] = useState(0);
  const validDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const carLabel = [data.year, data.make, data.class_name, data.trim].filter(Boolean).join(' ')
    + (data.km ? ` · ${formatKM(data.km)}` : '')
    + (data.city ? ` · ${data.city}` : '');

  const submitParams = new URLSearchParams({
    make: data.make, class_name: data.class_name,
    year: String(data.year ?? ''), km: String(data.km ?? ''),
    condition: data.condition, city: data.city,
    lead_type: 'seller_offer',
    ...(data.model ? { model: data.model } : {}),
    ...(data.trim  ? { trim:  data.trim  } : {}),
  }).toString();

  const urgentParams = new URLSearchParams({
    make: data.make, class_name: data.class_name,
    year: String(data.year ?? ''), km: String(data.km ?? ''), city: data.city,
  }).toString();

  const tradeParams = new URLSearchParams({
    make: data.make, class_name: data.class_name,
    year: String(data.year ?? ''), km: String(data.km ?? ''), city: data.city,
  }).toString();

  // ── Urgency-aware recommendation ────────────────────────────────────────────
  // Derive a recommendation from time-to-sell if available
  const avgDays = timeToSell?.estimated_days_to_sell ?? null;
  const slowMarket = avgDays !== null && avgDays > 45;
  const fastMarket = avgDays !== null && avgDays <= 20;
  const recommendation: { emoji: string; text: string; color: string } | null =
    slowMarket  ? { emoji: '⚡', text: `This model takes ~${avgDays} days to sell privately in Qatar — consider the urgent-sale route to close faster.`, color: 'bg-orange-50 border-orange-200 text-orange-800' }
    : fastMarket ? { emoji: '✅', text: `Great timing — this model moves quickly (avg ~${avgDays} days). Private listing may get you the best price.`, color: 'bg-green-50 border-green-200 text-green-800' }
    : null;

  function handleSave() {
    try {
      // Already persisted to sessionStorage — just surface a saved confirmation
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { /* ignore */ }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">

        {/* Car label + save */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-500 font-medium">{carLabel}</p>
            {comps && (
              <p className="text-xs text-green-700 font-semibold mt-0.5">
                Based on {comps.count} similar cars in Qatar
              </p>
            )}
          </div>
          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
              saved
                ? 'bg-green-100 border-green-300 text-green-700'
                : 'bg-white border-gray-200 text-gray-500 hover:border-[#002b5b] hover:text-[#002b5b]'
            }`}
          >
            <Bookmark size={12} className={saved ? 'fill-green-600' : ''} />
            {saved ? 'Saved!' : 'Save'}
          </button>
        </div>

        {/* Urgency-aware recommendation banner */}
        {recommendation && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border rounded-xl px-4 py-3 mb-5 text-sm font-medium flex items-start gap-2 ${recommendation.color}`}
          >
            <span className="text-base leading-none mt-0.5">{recommendation.emoji}</span>
            <span>{recommendation.text}</span>
          </motion.div>
        )}

        {/* Price evaluation — tabbed gauge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2"
        >
          <h2 className="text-center text-lg font-black text-gray-900 mb-3">What&apos;s your car worth?</h2>

          {(() => {
            const tabs = [
              {
                label: 'Private Party', low: bands.privatePartyLow, high: bands.privatePartyHigh,
                blurb: 'Selling privately — the highest payout, but more time and effort.',
                cta: { href: `/submit-offer?${submitParams}`, label: 'List for Offers', icon: <ChevronRight size={15} />, cls: 'bg-[#002b5b] hover:bg-[#1a7fd4]' },
              },
              {
                label: 'Trade-In', low: bands.tradeInLow, high: bands.tradeInHigh,
                blurb: 'Trading in at a dealer — one smooth transaction, slightly lower payout.',
                cta: { href: `/trade-in?${tradeParams}`, label: 'Start Trade-In', icon: <RefreshCw size={14} />, cls: 'bg-green-600 hover:bg-green-700' },
              },
              {
                label: 'Instant Offer', low: bands.instantLow, high: bands.instantHigh,
                blurb: 'Fastest cash sale — sell within days for a small speed discount.',
                cta: { href: `/urgent-sale?${urgentParams}`, label: 'Sell Fast Now', icon: <Zap size={14} />, cls: 'bg-[#005ca9] hover:bg-[#004a87]' },
              },
            ];
            const cur = tabs[priceTab];
            const value = Math.round((cur.low + cur.high) / 2);
            const rangeStr = `QAR ${cur.low.toLocaleString()} – ${cur.high.toLocaleString()}`;
            return (
              <>
                {/* Pricing-type tabs */}
                <div className="flex rounded-xl bg-gray-100 p-1 mb-4 max-w-md mx-auto">
                  {tabs.map((t, i) => (
                    <button
                      key={t.label}
                      type="button"
                      onClick={() => setPriceTab(i)}
                      className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                        priceTab === i ? 'bg-white shadow-sm text-[#002b5b]' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  {/* Range/value callout + gauge */}
                  <div className="flex flex-col items-center">
                    <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm text-center w-[240px] relative z-10">
                      <div className="bg-green-600 text-white px-4 py-2">
                        <div className="text-[11px] font-semibold opacity-90">{cur.label} Range</div>
                        <div className="text-lg font-black leading-tight">{rangeStr}</div>
                      </div>
                      <div className="bg-white px-4 py-1.5">
                        <div className="text-[11px] font-semibold text-gray-500">{cur.label} Value</div>
                        <div className="text-base font-black text-gray-900">{formatQAR(value)}</div>
                      </div>
                    </div>
                    <div className="-mt-1 w-full">
                      <PriceGauge low={cur.low} high={cur.high} value={value} />
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 -mt-3 mb-4">
                    <span className="text-xs text-gray-400">Valid as of {validDate}</span>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${confidence.cls}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                      {confidence.label}
                    </span>
                  </div>

                  <p className="text-center text-sm text-gray-600 mb-3">{cur.blurb}</p>
                  <Link
                    href={cur.cta.href}
                    className={`flex items-center justify-center gap-1.5 w-full ${cur.cta.cls} text-white font-bold py-3 rounded-xl text-sm transition-all`}
                  >
                    {cur.cta.icon} {cur.cta.label}
                  </Link>

                  {/* Factors that impact value */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Factors that impact value</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {data.year && <span className="bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1 text-gray-600">Year: <b className="text-gray-800">{data.year}</b></span>}
                      {data.km != null && <span className="bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1 text-gray-600">Mileage: <b className="text-gray-800">{formatKM(data.km)}</b></span>}
                      {data.city && <span className="bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1 text-gray-600">City: <b className="text-gray-800">{data.city}</b></span>}
                      {data.condition && <span className="bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1 text-gray-600 capitalize">Condition: <b className="text-gray-800">{data.condition}</b></span>}
                    </div>
                  </div>
                </div>

                <p className="text-center text-xs text-gray-400 mt-4">
                  These are AI estimates — not guaranteed prices. Actual dealer offers depend on inspection and market conditions.
                </p>
              </>
            );
          })()}
        </motion.div>

        {/* ── Analytics accordion ──────────────────────────────────────────────── */}
        {(timeToSell || forecast) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6">
            <button
              onClick={() => setShowAnalytics(v => !v)}
              className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <TrendingUp size={16} className="text-[#002b5b]" />
                Market analytics &amp; price forecast
              </span>
              <ChevronDown size={16} className={`transition-transform text-gray-400 ${showAnalytics ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showAnalytics && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 space-y-4">

                    {/* Time-to-sell */}
                    {timeToSell && (
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <Clock size={18} className="text-[#002b5b]" />
                            Time to Sell
                          </h3>
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#ebf5ff] text-[#002b5b]">
                            AI estimate
                          </span>
                        </div>
                        <div className="text-center py-3 mb-5">
                          <p className="text-5xl font-black text-gray-900">{timeToSell.estimated_days_to_sell}</p>
                          <p className="text-sm text-gray-500 mt-1">estimated days to sell</p>
                        </div>
                        <div className="space-y-2.5">
                          {([7, 14, 30, 60, 90] as const).map((horizon) => {
                            const prob = timeToSell.probability_by_horizon[String(horizon)] ?? 0;
                            const pct = Math.round(prob * 100);
                            return (
                              <div key={horizon}>
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                  <span>Within {horizon} days</span>
                                  <span className="font-semibold text-gray-700">{pct}%</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                      width: `${pct}%`,
                                      backgroundColor: pct >= 70 ? '#22c55e' : pct >= 40 ? '#002b5b' : '#f97316',
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-xs text-gray-400 mt-4">
                          Probability of listing clearing within each horizon, based on Qatar market data.
                        </p>
                      </div>
                    )}

                    {/* Price forecast */}
                    {forecast && (
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <TrendingUp size={18} className="text-[#002b5b]" />
                            Price Forecast
                          </h3>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${forecast.market_trend_annual_pct >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                            Market {forecast.market_trend_annual_pct >= 0 ? '↑' : '↓'} {Math.abs(forecast.market_trend_annual_pct)}%/yr
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {forecast.forecast.filter(f => f.horizon !== '12m').map((f) => {
                            const isPos = f.change_pct >= 0;
                            return (
                              <div key={f.horizon} className="text-center p-3 bg-gray-50 rounded-xl">
                                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{f.horizon}</div>
                                <div className="font-bold text-gray-900 text-sm">{formatQAR(Math.round(f.estimated_price_qar))}</div>
                                <div className={`text-xs font-semibold mt-0.5 ${isPos ? 'text-green-600' : 'text-red-500'}`}>
                                  {isPos ? '+' : ''}{f.change_pct}%
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-xs text-gray-400 mt-3">
                          Combines depreciation + Qatar market trend. Assumes {forecast.annual_km_assumption.toLocaleString()} km/year.
                        </p>
                      </div>
                    )}

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Privacy notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-[#ebf5ff] border border-[#002b5b]/20 rounded-2xl p-5 mt-5 mb-6"
        >
          <div className="flex items-start gap-3">
            <Shield size={20} className="text-[#002b5b] mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-[#002b5b] mb-1">Your privacy is protected</p>
              <p className="text-sm text-[#002b5b]/80">
                Dealers will not see your phone number unless you approve it. All offers are non-binding
                and subject to inspection. You stay in full control.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Value another car */}
        <div className="text-center mb-6">
          <button
            onClick={() => { try { sessionStorage.removeItem('instaoffer_valuation'); } catch { /* ignore */ } window.location.href = '/valuation'; }}
            className="inline-flex items-center gap-2 text-[#002b5b] hover:underline text-sm font-semibold"
          >
            <ArrowRight size={15} /> Value another car
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-2 mb-6">
          All estimates are generated by an AI model trained on Qatar market data. Not a guaranteed purchase price.
          Actual dealer offers depend on physical inspection and market conditions.
        </p>
      </div>

      <Footer />
    </div>
  );
}