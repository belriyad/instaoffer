'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, TrendingUp, Shield, ArrowRight, BarChart2, ShoppingCart, Clock } from 'lucide-react';
import { MLEstimate, MLForecast, OfferComps, MLTimeToSellEstimate } from '@/lib/api';
import { formatQAR, formatKM } from '@/lib/utils';
import { PriceBandDisplay } from '@/lib/form-controls';
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

export default function EstimateResult({ estimate, forecast, comps, timeToSell, data }: Props) {
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

          <PriceBandDisplay estimate={estimate} />

          {comps && (
            <div className="flex justify-center mt-3">
              <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                <TrendingUp size={12} />
                Based on {comps.count} similar cars
              </div>
            </div>
          )}
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
              estimate:   String(Math.round(estimate.estimated_price_qar)),
              low:        String(Math.round(estimate.confidence_range[0])),
              high:       String(Math.round(estimate.confidence_range[1])),
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
