'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, TrendingUp, Shield, ArrowRight, BarChart2, ShoppingCart } from 'lucide-react';
import { MLEstimate, MLForecast, OfferComps } from '@/lib/api';
import { formatQAR, formatKM } from '@/lib/utils';
import { ValuationData } from './page';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface Props {
  estimate: MLEstimate;
  forecast: MLForecast | null;
  comps: OfferComps | null;
  data: ValuationData;
}

export default function EstimateResult({ estimate, forecast, comps, data }: Props) {
  const low = estimate.confidence_range[0];
  const high = estimate.confidence_range[1];
  const mid = estimate.estimated_price_qar;
  const rangeWidth = high - low;

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
      <Navbar />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {/* Estimate card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6"
        >
          {/* Car summary */}
          <div className="text-sm text-gray-500 mb-4 font-medium">
            {[data.year, data.make, data.class_name, data.trim].filter(Boolean).join(' ')}
            {data.km ? ` · ${formatKM(data.km)}` : ''}
            {data.city ? ` · ${data.city}` : ''}
          </div>

          <div className="text-center py-6">
            <p className="text-sm font-bold text-[#003087] uppercase tracking-widest mb-2">Estimated Market Value</p>
            <div className="text-5xl md:text-6xl font-black text-gray-900 mb-2">
              {formatQAR(Math.round(mid))}
            </div>

            {/* Tight range display */}
            <div className="mt-4 inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2">
              <span className="text-xs text-gray-400 font-medium">Range</span>
              <span className="text-sm font-bold text-gray-700">{formatQAR(Math.round(low))}</span>
              <span className="text-gray-300">–</span>
              <span className="text-sm font-bold text-gray-700">{formatQAR(Math.round(high))}</span>
              <span className="text-xs text-[#003087] font-semibold bg-[#e8f0fd] px-2 py-0.5 rounded-full">
                ±{((rangeWidth / 2 / mid) * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Accuracy badges */}
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            <div className="flex items-center gap-1.5 bg-[#e8f0fd] text-[#003087] px-3 py-1.5 rounded-full text-xs font-semibold">
              <BarChart2 size={12} />
              Model accuracy: {(100 - estimate.mape).toFixed(0)}%
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${estimate.segment === 'premium' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
              {estimate.segment} segment
            </div>
            {comps && (
              <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                <TrendingUp size={12} />
                Based on {comps.count} similar cars
              </div>
            )}
          </div>
        </motion.div>

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

        {/* Market comps */}
        {comps && comps.count > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6"
          >
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-[#003087]" />
              Qatar Market Prices for {data.make} {data.class_name}
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Lowest', value: comps.min },
                { label: 'Average', value: comps.avg },
                { label: 'Highest', value: comps.max },
              ].map(({ label, value }) => (
                <div key={label} className="text-center p-3 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500 mb-1">{label}</div>
                  <div className="font-bold text-gray-900 text-sm">{value ? formatQAR(Math.round(value)) : '—'}</div>
                </div>
              ))}
            </div>
            {comps.samples.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Similar listings</p>
                {comps.samples.slice(0, 3).map((s) => (
                  <div key={s.product_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{s.title}</p>
                      <p className="text-xs text-gray-500">{s.manufacture_year} · {formatKM(s.km)} · {s.city}</p>
                    </div>
                    <div className="font-bold text-[#003087] text-sm">{formatQAR(s.price_qar)}</div>
                  </div>
                ))}
              </div>
            )}
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

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="space-y-3"
        >
          <Link
            href={`/submit-offer?${new URLSearchParams({
              make:       data.make,
              class_name: data.class_name,
              year:       String(data.year ?? ''),
              km:         String(data.km ?? ''),
              condition:  data.condition,
              city:       data.city,
              ...(data.model ? { model: data.model } : {}),
              ...(data.trim  ? { trim:  data.trim  } : {}),
            }).toString()}`}
            className="flex items-center justify-center gap-2 w-full bg-[#ff6600] hover:bg-[#e05a00] text-white font-bold py-4 rounded-xl text-lg transition-all shadow-md"
          >
            Get Real Dealer Offers
            <ChevronRight size={20} />
          </Link>
          <Link
            href={`/buy-request?${new URLSearchParams({
              make:       data.make,
              class_name: data.class_name,
              year:       String(data.year ?? ''),
              km:         String(data.km ?? ''),
              condition:  data.condition,
              city:       data.city,
              estimate:   String(Math.round(mid)),
              low:        String(Math.round(low)),
              high:       String(Math.round(high)),
              ...(data.trim  ? { trim: data.trim } : {}),
            }).toString()}`}
            className="flex items-center justify-center gap-2 w-full bg-[#003087] hover:bg-[#0057b8] text-white font-bold py-4 rounded-xl text-lg transition-all shadow-md"
          >
            <ShoppingCart size={20} />
            I Want to Buy This Car
          </Link>
          <Link
            href="/valuation"
            className="flex items-center justify-center gap-2 w-full bg-white hover:bg-gray-50 text-[#003087] border border-gray-200 font-semibold py-4 rounded-xl text-base transition-all"
          >
            Value Another Car
            <ArrowRight size={18} />
          </Link>
        </motion.div>

        <p className="text-center text-xs text-gray-400 mt-6">
          This estimate is generated by an AI model trained on Qatar market data. It is not a guaranteed purchase price.
          Actual dealer offers may vary based on physical inspection.
        </p>
      </div>

      <Footer />
    </div>
  );
}
