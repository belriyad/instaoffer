'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, TrendingUp, Shield, ArrowRight, Clock, Zap, RefreshCw } from 'lucide-react';
import { MLEstimate, MLForecast, OfferComps, MLTimeToSellEstimate } from '@/lib/api';
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

/** Compute the 3 intent-based price bands from the ML estimate */
function computePriceBands(estimate: MLEstimate) {
  const [low, high] = estimate.confidence_range;
  const spread = (high - low) / 2;          // half-width from the model
  const mid    = (low + high) / 2;          // model midpoint

  const band = (center: number) => ({
    low:  Math.round((center - spread) / 1000) * 1000,
    high: Math.round((center + spread) / 1000) * 1000,
  });

  // Private party  — model centre, full confidence band
  const pp = band(mid);

  // Trade-in       — 8% below market (dealer needs margin)
  const ti = band(mid * 0.92);

  // Instant offer  — 17% below market (speed premium for dealer)
  const io = band(mid * 0.83);

  return {
    privatePartyLow: pp.low,  privatePartyHigh: pp.high,
    tradeInLow:      ti.low,  tradeInHigh:      ti.high,
    instantLow:      io.low,  instantHigh:      io.high,
  };
}

export default function EstimateResult({ estimate, forecast, comps, timeToSell, data }: Props) {
  const bands = computePriceBands(estimate);

  const carLabel = [data.year, data.make, data.class_name, data.trim].filter(Boolean).join(' ')
    + (data.km ? ` · ${formatKM(data.km)}` : '')
    + (data.city ? ` · ${data.city}` : '');

  const submitParams = new URLSearchParams({
    make: data.make, class_name: data.class_name,
    year: String(data.year ?? ''), km: String(data.km ?? ''),
    condition: data.condition, city: data.city,
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

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
      <Navbar />

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">

        {/* Car label */}
        <div className="text-center mb-2">
          <p className="text-sm text-gray-500 font-medium">{carLabel}</p>
          {comps && (
            <p className="text-xs text-green-700 font-semibold mt-1">
              Based on {comps.count} similar cars in Qatar
            </p>
          )}
        </div>

        {/* Intent price bands */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2"
        >
          <h2 className="text-center text-lg font-black text-gray-900 mb-1">What is your car worth to you?</h2>
          <p className="text-center text-xs text-gray-400 mb-5">Price depends on how fast you want to sell and how much effort you want to put in.</p>

          <div className="space-y-4">

            {/* Band 1 — Maximize Value */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-5"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">Maximize Value</div>
                  <div className="font-black text-gray-900 text-base">Private Sale</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-black text-gray-900">
                    {formatQAR(bands.privatePartyLow)}–{formatQAR(bands.privatePartyHigh)}
                  </div>
                  <div className="text-xs text-gray-400">Highest expected payout</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-4">
                <span className="flex items-center gap-1"><span className="text-amber-500">~</span> Weeks to months to sell</span>
                <span className="flex items-center gap-1"><span className="text-amber-500">~</span> More effort and negotiation</span>
                <span className="flex items-center gap-1"><span className="text-green-500">✓</span> Best final price</span>
              </div>
              <Link
                href={`/submit-offer?${submitParams}`}
                className="flex items-center justify-center gap-1.5 w-full bg-[#003087] hover:bg-[#0057b8] text-white font-bold py-3 rounded-xl text-sm transition-all"
              >
                List for Offers <ChevronRight size={15} />
              </Link>
            </motion.div>

            {/* Band 2 — Easy Upgrade */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="bg-white rounded-2xl border-2 border-green-200 shadow-sm p-5"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="text-xs font-bold text-green-500 uppercase tracking-widest mb-0.5">Easy Upgrade</div>
                  <div className="font-black text-gray-900 text-base">Trade-In Value</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-black text-gray-900">
                    {formatQAR(bands.tradeInLow)}–{formatQAR(bands.tradeInHigh)}
                  </div>
                  <div className="text-xs text-gray-400">Typical trade-in range</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-4">
                <span className="flex items-center gap-1"><span className="text-green-500">✓</span> One smooth transaction</span>
                <span className="flex items-center gap-1"><span className="text-green-500">✓</span> Sell &amp; upgrade together</span>
                <span className="flex items-center gap-1"><span className="text-amber-500">~</span> Slightly lower payout</span>
              </div>
              <Link
                href={`/trade-in?${tradeParams}`}
                className="flex items-center justify-center gap-1.5 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl text-sm transition-all"
              >
                <RefreshCw size={14} /> Start Trade-In
              </Link>
            </motion.div>

            {/* Band 3 — Fastest Sale */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border-2 border-orange-300 shadow-md p-5 relative overflow-hidden"
            >
              <span className="absolute top-4 right-4 bg-[#ff6600] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Fastest</span>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="text-xs font-bold text-[#ff6600] uppercase tracking-widest mb-0.5">Fastest Sale</div>
                  <div className="font-black text-gray-900 text-base">Instant Offer</div>
                </div>
                <div className="text-right shrink-0 pr-12">
                  <div className="text-2xl font-black text-[#ff6600]">
                    {formatQAR(bands.instantLow)}–{formatQAR(bands.instantHigh)}
                  </div>
                  <div className="text-xs text-gray-400">Expected urgent-sale range</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-4">
                <span className="flex items-center gap-1"><span className="text-green-500">✓</span> Fastest and most convenient</span>
                <span className="flex items-center gap-1"><span className="text-green-500">✓</span> Sell within days</span>
                <span className="flex items-center gap-1"><span className="text-amber-500">~</span> Lower payout for speed</span>
              </div>
              <Link
                href={`/urgent-sale?${urgentParams}`}
                className="flex items-center justify-center gap-1.5 w-full bg-[#ff6600] hover:bg-[#e05a00] text-white font-bold py-3 rounded-xl text-sm transition-all"
              >
                <Zap size={14} /> Sell Fast Now
              </Link>
            </motion.div>

          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            These are AI estimates — not guaranteed prices. Actual dealer offers depend on inspection and market conditions.
          </p>
        </motion.div>

        {/* Time-to-sell */}
        {timeToSell && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Clock size={18} className="text-[#003087]" />
                Time to Sell
              </h3>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#e8f0fd] text-[#003087]">
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
                          backgroundColor: pct >= 70 ? '#22c55e' : pct >= 40 ? '#003087' : '#f97316',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Probability of listing clearing (sold or removed) within each horizon, based on Qatar market data.
            </p>
          </motion.div>
        )}

        {/* Price forecast */}
        {forecast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp size={18} className="text-[#003087]" />
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
          </motion.div>
        )}

        {/* Privacy notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-[#e8f0fd] border border-[#003087]/20 rounded-2xl p-5 mb-6"
        >
          <div className="flex items-start gap-3">
            <Shield size={20} className="text-[#003087] mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-[#003087] mb-1">Your privacy is protected</p>
              <p className="text-sm text-[#003087]/80">
                Dealers will not see your phone number unless you approve it. All offers are non-binding
                and subject to inspection. You stay in full control.
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTAs — moved into price band cards above; just offer re-valuation here */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-center mt-2 mb-6"
        >
          <button
            onClick={() => { try { sessionStorage.removeItem('instaoffer_valuation'); } catch { /* ignore */ } window.location.href = '/valuation'; }}
            className="inline-flex items-center gap-2 text-[#003087] hover:underline text-sm font-semibold"
          >
            <ArrowRight size={15} /> Value another car
          </button>
        </motion.div>

        <p className="text-center text-xs text-gray-400 mt-2 mb-6">
          All estimates are generated by an AI model trained on Qatar market data. Not a guaranteed purchase price.
          Actual dealer offers depend on physical inspection and market conditions.
        </p>
      </div>

      <Footer />
    </div>
  );
}