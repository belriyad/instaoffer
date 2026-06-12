'use client';

import { useEffect, useState } from 'react';
import { Info, TrendingUp } from 'lucide-react';
import { getMLEstimate, intentPriceBands, IntentPriceBands } from '@/lib/api';
import { formatQAR } from '@/lib/utils';

interface Props {
  make: string;
  class_name: string;
  year: string;
  km: string;
  city?: string;
  // Optional estimate inputs — when provided they must match what /valuation
  // sent so the ranges shown here are byte-identical to the valuation result.
  condition?: string;
  trim?: string;
  fuel_type?: string;
  gear_type?: string;
  car_type?: string;
  cylinder_count?: string | number;
  warranty_status?: string;
}

type Bands = IntentPriceBands;

export default function PriceGuidanceCard({
  make, class_name, year, km, city = 'Doha',
  condition, trim, fuel_type, gear_type, car_type, cylinder_count, warranty_status,
}: Props) {
  const [bands, setBands] = useState<Bands | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const ready = make && class_name && year && km;

  useEffect(() => {
    if (!ready) { setBands(null); setFailed(false); return; }
    const controller = new AbortController();
    setLoading(true);
    setFailed(false);
    // Send the full input set (same normalization as /valuation). The backend
    // is deterministic, so identical inputs yield an identical estimate and,
    // through the shared intentPriceBands(), identical ranges across pages.
    getMLEstimate({
      make,
      class_name,
      manufacture_year: parseInt(year),
      km: parseInt(km.replace(/,/g, '')),
      city,
      condition: condition || 'good',
      trim:            trim            || undefined,
      fuel_type:       fuel_type       || undefined,
      gear_type:       gear_type       || undefined,
      car_type:        car_type        || undefined,
      cylinder_count:  cylinder_count != null && cylinder_count !== '' ? Number(cylinder_count) : undefined,
      warranty_status: warranty_status || undefined,
    })
      .then((res) => {
        if (!controller.signal.aborted) {
          if ('error' in res) { setFailed(true); }
          else {
            setBands(intentPriceBands(res));
          }
        }
      })
      .catch(() => { if (!controller.signal.aborted) setFailed(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [make, class_name, year, km, city, condition, trim, fuel_type, gear_type, car_type, cylinder_count, warranty_status, ready]);

  if (!ready || failed) return null;

  return (
    <div className="bg-gradient-to-br from-[#ebf5ff] to-white border border-[#002b5b]/15 rounded-xl p-4 mb-0">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={15} className="text-[#002b5b]" />
        <span className="text-sm font-bold text-[#002b5b]">Estimated options for your car</span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
          <div className="w-4 h-4 border-2 border-[#002b5b]/40 border-t-[#002b5b] rounded-full animate-spin" />
          Calculating…
        </div>
      ) : bands ? (
        <>
          <div className="space-y-2">
            {[
              { label: 'Private sale',   low: bands.privatePartyLow,  high: bands.privatePartyHigh,  color: 'text-gray-800' },
              { label: 'Trade-in',       low: bands.tradeInLow,       high: bands.tradeInHigh,       color: 'text-green-700' },
              { label: 'Instant offer',  low: bands.instantLow,       high: bands.instantHigh,       color: 'text-[#005ca9]' },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-xs text-gray-500 w-28">{row.label}</span>
                <span className={`text-sm font-bold ${row.color}`}>
                  {formatQAR(row.low)} – {formatQAR(row.high)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-1.5 mt-3 pt-3 border-t border-[#002b5b]/10">
            <Info size={11} className="text-gray-400 mt-0.5 shrink-0" />
            <p className="text-[10px] text-gray-400 leading-relaxed">
              These are estimates. Actual dealer offers depend on photos, inspection, and market demand.
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
