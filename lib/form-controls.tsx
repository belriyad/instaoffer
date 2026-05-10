'use client';

/**
 * Unified form control components — used identically across every form on the site.
 * Every data-entry field that appears in more than one place lives here.
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, ChevronUp, Search } from 'lucide-react';
import {
  CAR_MAKES, CAR_MODELS, CAR_TRIMS,
  CONDITIONS,
  FUEL_TYPES, GEAR_TYPES, CAR_TYPES, QATAR_CITIES,
  formatQAR, formatKM,
} from '@/lib/utils';
import type { MLEstimate } from '@/lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MAKE_COLORS: Record<string, string> = {
  Toyota:        'bg-red-50   border-red-200   text-red-800',
  Lexus:         'bg-slate-50 border-slate-300 text-slate-800',
  Nissan:        'bg-red-50   border-red-200   text-red-800',
  Honda:         'bg-red-50   border-red-200   text-red-800',
  BMW:           'bg-blue-50  border-blue-300  text-blue-900',
  'Mercedes-Benz': 'bg-zinc-50  border-zinc-300  text-zinc-900',
  Audi:          'bg-zinc-50  border-zinc-300  text-zinc-900',
  'Land Rover':  'bg-green-50 border-green-300 text-green-900',
  Porsche:       'bg-yellow-50 border-yellow-300 text-yellow-900',
  Chevrolet:     'bg-amber-50 border-amber-200 text-amber-900',
  Ford:          'bg-blue-50  border-blue-200  text-blue-900',
  Dodge:         'bg-orange-50 border-orange-200 text-orange-900',
  GMC:           'bg-red-50   border-red-200   text-red-900',
  Jeep:          'bg-green-50 border-green-200 text-green-900',
  Hyundai:       'bg-sky-50   border-sky-200   text-sky-900',
  Kia:           'bg-red-50   border-red-100   text-red-900',
  Infiniti:      'bg-slate-50 border-slate-200 text-slate-800',
  Mitsubishi:    'bg-red-50   border-red-100   text-red-800',
};
const DEFAULT_MAKE_COLOR = 'bg-gray-50 border-gray-200 text-gray-800';

/** Year tiles split: recent 8 shown by default, older revealed on demand */
const RECENT_YEARS = Array.from({ length: 8 }, (_, i) => 2025 - i);
const OLDER_YEARS  = Array.from({ length: 18 }, (_, i) => 2017 - i);

/** 6 KM buckets — each carries a display label and the midpoint value sent to the API */
export const KM_BUCKETS = [
  { label: 'Under 20k',  value: 10_000  },
  { label: '20 – 50k',   value: 35_000  },
  { label: '50 – 80k',   value: 65_000  },
  { label: '80 – 120k',  value: 100_000 },
  { label: '120 – 200k', value: 160_000 },
  { label: 'Over 200k',  value: 220_000 },
] as const;

/** Price slider config: 10k – 600k in 5k steps */
const PRICE_MIN  = 10_000;
const PRICE_MAX  = 600_000;
const PRICE_STEP = 5_000;

// ─── MakeSelect ───────────────────────────────────────────────────────────────
/** Searchable scrollable grid of makes — primary selection UI for Make everywhere */
export function MakeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (make: string) => void;
}) {
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? CAR_MAKES.filter(m => m.toLowerCase().includes(query.toLowerCase()))
    : CAR_MAKES;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search make…"
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10 bg-gray-50"
        />
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-1">
        {filtered.map(make => {
          const sel = value === make;
          const color = MAKE_COLORS[make] ?? DEFAULT_MAKE_COLOR;
          return (
            <button
              key={make}
              type="button"
              onClick={() => { onChange(make); setQuery(''); }}
              className={`relative py-2.5 px-2 rounded-xl border-2 text-xs font-bold transition-all text-center leading-tight ${
                sel
                  ? 'border-[#003087] bg-[#003087] text-white shadow-md'
                  : `${color} hover:border-[#003087] hover:shadow-sm`
              }`}
            >
              {sel && <Check size={10} className="absolute top-1 right-1 opacity-70" />}
              {make}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-4 py-4 text-center text-xs text-gray-400">No makes found</p>
        )}
      </div>
    </div>
  );
}

// ─── ModelSelect ──────────────────────────────────────────────────────────────
/** Chip-pill list of models for the selected make. Disabled when no make is set. */
export function ModelSelect({
  make,
  value,
  onChange,
}: {
  make: string;
  value: string;
  onChange: (model: string) => void;
}) {
  const models = make ? (CAR_MODELS[make] ?? []) : [];

  if (!make) {
    return (
      <p className="text-xs text-gray-400 italic py-2">Select a make first</p>
    );
  }

  if (models.length === 0) {
    return (
      <p className="text-xs text-gray-400 italic py-2">No models on file for {make}</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
      {models.map(m => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={`px-3 py-1.5 rounded-full border text-sm font-semibold transition-all ${
            value === m
              ? 'border-[#003087] bg-[#003087] text-white'
              : 'border-gray-200 text-gray-600 hover:border-[#003087] hover:text-[#003087]'
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

// ─── TrimSelect ───────────────────────────────────────────────────────────────
/** Chip-pill list of trims for the selected model. Returns null if no trims known. */
export function TrimSelect({
  model,
  value,
  onChange,
}: {
  model: string;
  value: string;
  onChange: (trim: string) => void;
}) {
  const trims = model ? (CAR_TRIMS[model] ?? []) : [];

  if (!model || trims.length === 0) return null;

  return (
    <div>
      <p className="text-sm font-bold text-gray-700 mb-2">
        Trim <span className="text-gray-400 font-normal text-xs">(optional — improves accuracy)</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {trims.map(t => (
          <button
            key={t}
            type="button"
            onClick={() => onChange(value === t ? '' : t)}
            className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
              value === t
                ? 'border-[#003087] bg-[#003087] text-white'
                : 'border-gray-200 text-gray-600 hover:border-[#003087] hover:text-[#003087]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── YearTiles ────────────────────────────────────────────────────────────────
/** Tile grid of years — recent 8 visible, older expand on demand */
export function YearTiles({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (year: number) => void;
}) {
  const [showOlder, setShowOlder] = useState(false);

  return (
    <div>
      <div className="grid grid-cols-4 gap-2">
        {RECENT_YEARS.map(y => (
          <button
            key={y}
            type="button"
            onClick={() => onChange(y)}
            className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
              value === y
                ? 'border-[#003087] bg-[#003087] text-white'
                : 'border-gray-200 hover:border-[#003087] text-gray-700'
            }`}
          >
            {y}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setShowOlder(v => !v)}
        className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-[#003087] transition-colors font-medium"
      >
        {showOlder ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {showOlder ? 'Hide older years' : 'Older than 2018'}
      </button>

      <AnimatePresence>
        {showOlder && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-5 gap-2 mt-2">
              {OLDER_YEARS.map(y => (
                <button
                  key={y}
                  type="button"
                  onClick={() => onChange(y)}
                  className={`py-2 rounded-lg border text-xs font-bold transition-all ${
                    value === y
                      ? 'border-[#003087] bg-[#003087] text-white'
                      : 'border-gray-200 hover:border-[#003087] text-gray-600'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── KmBucketPicker ───────────────────────────────────────────────────────────
/** 6 visual KM bucket buttons — no free-text fallback */
export function KmBucketPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (km: number) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {KM_BUCKETS.map(b => (
        <button
          key={b.label}
          type="button"
          onClick={() => onChange(b.value)}
          className={`py-2.5 rounded-xl border-2 text-xs font-semibold transition-all text-center ${
            value === b.value
              ? 'border-[#003087] bg-[#003087] text-white'
              : 'border-gray-200 hover:border-[#003087] text-gray-600'
          }`}
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}

/** Returns the human-readable label for a KM bucket value, or the formatted raw km. */
export function kmLabel(km: number | null): string {
  if (km == null) return '';
  const bucket = KM_BUCKETS.find(b => b.value === km);
  return bucket ? bucket.label : formatKM(km);
}

// ─── ConditionPicker ──────────────────────────────────────────────────────────
/** 2×2 grid of condition card buttons */
export function ConditionPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {CONDITIONS.map(c => (
        <button
          key={c.value}
          type="button"
          onClick={() => onChange(c.value)}
          className={`p-3 rounded-xl border-2 text-left transition-all ${
            value === c.value
              ? 'border-[#003087] bg-[#e8f0fd]'
              : 'border-gray-200 hover:border-[#003087]'
          }`}
        >
          <div className={`text-sm font-bold ${value === c.value ? 'text-[#003087]' : 'text-gray-900'}`}>
            {c.label}
          </div>
          <div className="text-xs text-gray-400 mt-0.5 leading-tight">{c.description}</div>
        </button>
      ))}
    </div>
  );
}

// ─── CityPicker ───────────────────────────────────────────────────────────────
/** Pill-chip row of Qatar cities */
export function CityPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {QATAR_CITIES.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
            value === c
              ? 'border-[#003087] bg-[#003087] text-white'
              : 'border-gray-200 text-gray-600 hover:border-[#003087]'
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

// ─── PillGroupPicker ──────────────────────────────────────────────────────────
/** Generic pill-chip list — used for Fuel, Gear, Body type */
export function PillGroupPicker({
  options,
  value,
  onChange,
  multi = false,
}: {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  multi?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(multi ? opt : (value === opt ? '' : opt))}
          className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
            value === opt
              ? 'border-[#003087] bg-[#003087] text-white'
              : 'border-gray-200 text-gray-600 hover:border-[#003087] hover:text-[#003087]'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ─── PriceSlider ──────────────────────────────────────────────────────────────
/** Price input as a slider — consistent across every price field on the site */
export function PriceSlider({
  value,
  onChange,
  label = 'Price (QAR)',
  hint,
  minValue = PRICE_MIN,
  maxValue = PRICE_MAX,
  step = PRICE_STEP,
}: {
  value: number | null;
  onChange: (v: number) => void;
  label?: string;
  hint?: React.ReactNode;
  minValue?: number;
  maxValue?: number;
  step?: number;
}) {
  const display = value ?? minValue;
  const pct = ((display - minValue) / (maxValue - minValue)) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-gray-700">{label}</span>
        <span className="text-lg font-black text-[#003087]">{formatQAR(display)}</span>
      </div>
      <input
        type="range"
        min={minValue}
        max={maxValue}
        step={step}
        value={display}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#003087]"
        style={{
          background: `linear-gradient(to right, #003087 ${pct}%, #e5e7eb ${pct}%)`,
        }}
      />
      <div className="flex justify-between mt-1 text-[10px] text-gray-400">
        <span>{formatQAR(minValue)}</span>
        <span>{formatQAR(maxValue)}</span>
      </div>
      {hint && <div className="mt-2">{hint}</div>}
    </div>
  );
}

// ─── PriceBandDisplay ─────────────────────────────────────────────────────────
/** Displays an MLEstimate price as a range band — the canonical price output UI */
export function PriceBandDisplay({ estimate }: { estimate: MLEstimate }) {
  const low  = Math.round(estimate.confidence_range[0]);
  const high = Math.round(estimate.confidence_range[1]);
  const mid  = Math.round(estimate.estimated_price_qar);
  const rangeWidth = high - low;
  const pct = rangeWidth > 0 ? (((mid - low) / rangeWidth) * 100).toFixed(0) : '50';

  return (
    <div className="text-center py-4">
      {/* Band label */}
      <p className="text-xs font-bold text-[#003087] uppercase tracking-widest mb-1">Estimated Range</p>

      {/* Main range */}
      <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 mb-3">
        <span className="text-xl font-black text-gray-700">{formatQAR(low)}</span>
        <span className="text-gray-300 font-bold text-lg">–</span>
        <span className="text-xl font-black text-gray-700">{formatQAR(high)}</span>
      </div>

      {/* Midpoint as secondary */}
      <p className="text-sm text-gray-500">
        Midpoint estimate <span className="font-bold text-gray-800">{formatQAR(mid)}</span>
        <span className="ml-2 text-[#003087] font-semibold text-xs">±{((rangeWidth / 2 / mid) * 100).toFixed(1)}%</span>
      </p>

      {/* Visual range bar */}
      <div className="mt-4 mx-auto max-w-xs">
        <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#003087]/20 via-[#003087]/60 to-[#003087]/20 rounded-full" />
          {/* Midpoint marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-[#003087]"
            style={{ left: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-gray-400">
          <span>Low</span>
          <span className="font-semibold text-[#003087]">Mid</span>
          <span>High</span>
        </div>
      </div>

      {/* Accuracy badges */}
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        <span className="bg-[#e8f0fd] text-[#003087] text-xs font-bold px-3 py-1 rounded-full">
          Model accuracy: {(100 - estimate.mape).toFixed(0)}%
        </span>
        <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full capitalize">
          {estimate.segment} segment
        </span>
        <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full">
          R² {(estimate.r2 * 100).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
