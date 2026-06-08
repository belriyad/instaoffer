'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, SlidersHorizontal, X, ChevronLeft, ChevronRight,
  Fuel, Zap, Car, Calculator, CreditCard, Banknote, ChevronDown, ChevronUp,
  BarChart2,
} from 'lucide-react';
import { COMPARE_KEY, MAX_COMPARE } from './compare/page';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  getWakalatFilters, getWakalatCars,
  WakalatFilterOptions, WakalatCarSummary, WakalatCarsParams,
  wakalatImageUrl,
} from '@/lib/api';
import { formatQAR, EXCLUDED_NON_CAR_KEYWORDS, NON_CAR_MAKES, MIN_LISTING_YEAR, BUDGET_BANDS, BudgetBand } from '@/lib/utils';

// ─── Finance calculator ───────────────────────────────────────────────────────
function calcMonthlyPayment(price: number, downPayment: number, annualRate: number, termMonths: number): number {
  const principal = price - downPayment;
  if (principal <= 0 || termMonths <= 0) return 0;
  if (annualRate === 0) return principal / termMonths;
  const r = annualRate / 100 / 12;
  return (principal * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
}

// ─── Budget mode ──────────────────────────────────────────────────────────────
type BudgetMode = 'cash' | 'finance';

// ─── Non-car + stale listing filter ──────────────────────────────────────────
function isValidCarListing(car: WakalatCarSummary): boolean {
  const haystack = [car.make, car.model, car.body_type ?? '']
    .join(' ').toLowerCase();
  if (EXCLUDED_NON_CAR_KEYWORDS.some(kw => haystack.includes(kw))) return false;
  if (NON_CAR_MAKES.some(m => car.make?.toLowerCase().includes(m))) return false;
  if (car.year && car.year < MIN_LISTING_YEAR) return false;
  return true;
}

const SORT_OPTIONS = [
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'year_desc', label: 'Newest First' },
  { value: 'year_asc', label: 'Oldest First' },
  { value: 'make_asc', label: 'Make A–Z' },
] as const;

const FUEL_ICONS: Record<string, React.ReactNode> = {
  Electric: <Zap size={12} />,
  Hybrid: <Zap size={12} />,
};

export default function CarsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<WakalatFilterOptions | null>(null);
  const [cars, setCars] = useState<WakalatCarSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const perPage = 24;

  // ── Compare state ──
  type CompareCar = { slug: string; name: string; thumbnail: string | null; price: number | null };
  const [compareItems, setCompareItems] = useState<CompareCar[]>([]);
  const compareList = compareItems.map(c => c.slug);

  // Load compare list from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(COMPARE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed[0]?.slug) {
          setCompareItems(parsed.slice(0, MAX_COMPARE));
        }
      }
    } catch { /* ok */ }
  }, []);

  // Persist to localStorage whenever it changes
  useEffect(() => {
    try { localStorage.setItem(COMPARE_KEY, JSON.stringify(compareItems)); } catch { /* ok */ }
  }, [compareItems]);

  function toggleCompare(car: WakalatCarSummary) {
    setCompareItems(prev => {
      if (prev.some(c => c.slug === car.slug)) return prev.filter(c => c.slug !== car.slug);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, {
        slug: car.slug,
        name: `${car.year} ${car.make} ${car.model}`,
        thumbnail: car.thumbnail,
        price: car.base_price_qar,
      }];
    });
  }

  // ── Search & filter state ──
  const [q, setQ] = useState('');
  const [selMakes, setSelMakes] = useState<string[]>([]);
  const [selModels, setSelModels] = useState<string[]>([]);
  const [selDealers, setSelDealers] = useState<string[]>([]);
  const [selBodyTypes, setSelBodyTypes] = useState<string[]>([]);
  const [selFuelTypes, setSelFuelTypes] = useState<string[]>([]);
  const [selTransmissions, setSelTransmissions] = useState<string[]>([]);
  const [selDrivetrains, setSelDrivetrains] = useState<string[]>([]);
  const [yearMin, setYearMin] = useState('');
  const [yearMax, setYearMax] = useState('');
  const [sort, setSort] = useState<WakalatCarsParams['sort']>('price_asc');

  // ── Budget mode ──
  const [budgetMode, setBudgetMode] = useState<BudgetMode>('cash');
  const [budgetBand, setBudgetBand] = useState<BudgetBand>('any');
  const [cashBudget, setCashBudget] = useState('');
  const [downPayment, setDownPayment] = useState('');
  const [loanTerm, setLoanTerm] = useState('60');
  const [interestRate, setInterestRate] = useState('4.5');
  const [monthlyBudget, setMonthlyBudget] = useState('');

  // Computed: max price from finance inputs
  const maxPriceFromFinance = (() => {
    const monthly = Number(monthlyBudget);
    const dp = Number(downPayment);
    const term = Number(loanTerm);
    const rate = Number(interestRate);
    if (!monthly || !term) return undefined;
    if (rate === 0) return dp + monthly * term;
    const r = rate / 100 / 12;
    const principal = (monthly * (Math.pow(1 + r, term) - 1)) / (r * Math.pow(1 + r, term));
    return Math.round(dp + principal);
  })();

  // ── Fetch ──
  const fetchCars = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params: WakalatCarsParams = {
        page: pg,
        per_page: perPage,
        sort,
        year_min: yearMin ? Number(yearMin) : MIN_LISTING_YEAR,
        ...(q ? { q } : {}),
        ...(selMakes.length ? { make: selMakes.join(',') } : {}),
        ...(selModels.length ? { model: selModels.join(',') } : {}),
        ...(selDealers.length ? { dealer: selDealers.join(',') } : {}),
        ...(selBodyTypes.length ? { body_type: selBodyTypes.join(',') } : {}),
        ...(selFuelTypes.length ? { fuel_type: selFuelTypes.join(',') } : {}),
        ...(selTransmissions.length ? { transmission: selTransmissions.join(',') } : {}),
        ...(selDrivetrains.length ? { drivetrain: selDrivetrains.join(',') } : {}),
        ...(yearMax ? { year_max: Number(yearMax) } : {}),
      };

      // Budget band chips take priority over manual cash input
      if (budgetBand !== 'any') {
        const band = BUDGET_BANDS.find(b => b.value === budgetBand);
        if (band) {
          if (band.max !== undefined) params.price_max = band.max;
          if (band.min > 0) params.price_min = band.min;
        }
      } else if (budgetMode === 'cash' && cashBudget) {
        params.price_max = Number(cashBudget);
      } else if (budgetMode === 'finance' && maxPriceFromFinance) {
        params.price_max = maxPriceFromFinance;
      }

      const res = await getWakalatCars(params);
      const filtered = res.cars.filter(isValidCarListing);
      setCars(filtered);
      setTotal(res.total);
      setPage(res.page);
      setPages(res.pages);
    } catch {
      setCars([]);
    } finally {
      setLoading(false);
    }
  }, [q, selMakes, selModels, selDealers, selBodyTypes, selFuelTypes, selTransmissions, selDrivetrains, yearMin, yearMax, sort, budgetMode, budgetBand, cashBudget, maxPriceFromFinance]);

  // Fetch filter options once
  useEffect(() => {
    getWakalatFilters().then(setFilters).catch(() => {});
  }, []);

  // Debounced search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { fetchCars(1); }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [fetchCars]);

  // Toggle helpers
  function toggle(arr: string[], val: string, set: (v: string[]) => void) {
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
    setPage(1);
  }

  const activeFilterCount = [
    selMakes, selModels, selDealers, selBodyTypes, selFuelTypes, selTransmissions, selDrivetrains,
  ].reduce((n, a) => n + a.length, 0) +
    (yearMin ? 1 : 0) + (yearMax ? 1 : 0) +
    (budgetBand !== 'any' ? 1 : 0) +
    (budgetBand === 'any' && budgetMode === 'cash' && cashBudget ? 1 : 0) +
    (budgetBand === 'any' && budgetMode === 'finance' && monthlyBudget ? 1 : 0);

  function clearAll() {
    setSelMakes([]); setSelModels([]); setSelDealers([]);
    setSelBodyTypes([]); setSelFuelTypes([]); setSelTransmissions([]); setSelDrivetrains([]);
    setYearMin(''); setYearMax('');
    setBudgetBand('any');
    setCashBudget(''); setMonthlyBudget(''); setDownPayment('');
    setQ('');
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />

      {/* Hero bar */}
      <div className="bg-[#002b5b] text-white py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-black mb-1">New Cars in Qatar</h1>
          <p className="text-blue-200 text-sm">Browse new cars from authorised dealerships across Qatar</p>

          {/* Search bar */}
          <div className="mt-5 flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow">
              <Search size={18} className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={q}
                onChange={e => { setQ(e.target.value); setPage(1); }}
                placeholder="Search make, model or dealer…"
                className="flex-1 text-gray-900 text-sm outline-none bg-transparent placeholder:text-gray-400"
              />
              {q && (
                <button onClick={() => { setQ(''); setPage(1); }}>
                  <X size={16} className="text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${showFilters ? 'bg-[#005ca9] text-white' : 'bg-white text-[#002b5b]'}`}
            >
              <SlidersHorizontal size={16} />
              Filters
              {activeFilterCount > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${showFilters ? 'bg-white text-[#005ca9]' : 'bg-[#002b5b] text-white'}`}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Budget band chips */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-blue-200 font-semibold shrink-0">Budget:</span>
            <button
              onClick={() => { setBudgetBand('any'); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${budgetBand === 'any' ? 'bg-white text-[#002b5b] border-white' : 'border-white/30 text-white/80 hover:border-white hover:text-white'}`}
            >
              Any
            </button>
            {BUDGET_BANDS.map(band => (
              <button
                key={band.value}
                onClick={() => { setBudgetBand(budgetBand === band.value ? 'any' : band.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${budgetBand === band.value ? 'bg-[#005ca9] text-white border-[#005ca9]' : 'border-white/30 text-white/80 hover:border-white hover:text-white'}`}
              >
                {band.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full px-4 py-6 flex-1">

        {/* Filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-6">

                {/* Budget toggle */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <Calculator size={15} className="text-[#002b5b]" /> Budget
                    </h3>
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                      <button
                        onClick={() => setBudgetMode('cash')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${budgetMode === 'cash' ? 'bg-white shadow text-[#002b5b]' : 'text-gray-500'}`}
                      >
                        <Banknote size={13} /> Cash
                      </button>
                      <button
                        onClick={() => setBudgetMode('finance')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${budgetMode === 'finance' ? 'bg-white shadow text-[#002b5b]' : 'text-gray-500'}`}
                      >
                        <CreditCard size={13} /> Finance
                      </button>
                    </div>
                  </div>

                  {budgetMode === 'cash' ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="number"
                          value={cashBudget}
                          onChange={e => { setCashBudget(e.target.value); setPage(1); }}
                          placeholder="Max budget (QAR)"
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#002b5b]"
                        />
                        {cashBudget && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">QAR</span>
                        )}
                      </div>
                      {cashBudget && (
                        <div className="text-sm font-bold text-[#002b5b] whitespace-nowrap">
                          Up to {formatQAR(Number(cashBudget))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 font-medium block mb-1">Monthly Budget (QAR)</label>
                          <input
                            type="number"
                            value={monthlyBudget}
                            onChange={e => { setMonthlyBudget(e.target.value); setPage(1); }}
                            placeholder="e.g. 3500"
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#002b5b]"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 font-medium block mb-1">Down Payment (QAR)</label>
                          <input
                            type="number"
                            value={downPayment}
                            onChange={e => setDownPayment(e.target.value)}
                            placeholder="e.g. 20000"
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#002b5b]"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 font-medium block mb-1">Loan Term (months)</label>
                          <select
                            value={loanTerm}
                            onChange={e => setLoanTerm(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#002b5b]"
                          >
                            {[12, 24, 36, 48, 60, 72, 84].map(m => (
                              <option key={m} value={m}>{m} months ({m / 12}yr)</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 font-medium block mb-1">Interest Rate (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={interestRate}
                            onChange={e => setInterestRate(e.target.value)}
                            placeholder="e.g. 4.5"
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#002b5b]"
                          />
                        </div>
                      </div>
                      {maxPriceFromFinance && monthlyBudget && (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-3">
                          <Calculator size={16} className="text-[#002b5b] flex-shrink-0" />
                          <div>
                            <span className="text-xs text-gray-500">Estimated max car price: </span>
                            <span className="font-black text-[#002b5b]">{formatQAR(maxPriceFromFinance)}</span>
                            <span className="text-xs text-gray-400 ml-2">
                              (QAR {Number(monthlyBudget).toLocaleString()}/mo × {loanTerm}m @ {interestRate}% + QAR {Number(downPayment || 0).toLocaleString()} down)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Filter grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <FilterGroup label="Make" items={filters?.makes ?? []} selected={selMakes} onToggle={v => toggle(selMakes, v, setSelMakes)} />
                  <FilterGroup label="Body Type" items={filters?.body_types ?? []} selected={selBodyTypes} onToggle={v => toggle(selBodyTypes, v, setSelBodyTypes)} />
                  <FilterGroup label="Fuel Type" items={filters?.fuel_types ?? []} selected={selFuelTypes} onToggle={v => toggle(selFuelTypes, v, setSelFuelTypes)} />
                  <FilterGroup label="Transmission" items={filters?.transmissions ?? []} selected={selTransmissions} onToggle={v => toggle(selTransmissions, v, setSelTransmissions)} />
                  <FilterGroup label="Drivetrain" items={filters?.drivetrains ?? []} selected={selDrivetrains} onToggle={v => toggle(selDrivetrains, v, setSelDrivetrains)} />
                  <FilterGroup label="Dealer" items={filters?.dealers ?? []} selected={selDealers} onToggle={v => toggle(selDealers, v, setSelDealers)} />
                </div>

                {/* Year range */}
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Year Range</h4>
                  <div className="flex items-center gap-2">
                    <input type="number" value={yearMin} onChange={e => { setYearMin(e.target.value); setPage(1); }} placeholder="From" className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#002b5b]" />
                    <span className="text-gray-400">–</span>
                    <input type="number" value={yearMax} onChange={e => { setYearMax(e.target.value); setPage(1); }} placeholder="To" className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#002b5b]" />
                  </div>
                </div>

                {/* Footer */}
                {activeFilterCount > 0 && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-sm text-gray-500">{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active</span>
                    <button onClick={clearAll} className="text-sm text-red-500 font-semibold hover:text-red-700 flex items-center gap-1">
                      <X size={14} /> Clear all
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="text-sm text-gray-600">
            {loading ? 'Loading…' : <><span className="font-bold text-gray-900">{total.toLocaleString()}</span> cars found</>}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sort}
              onChange={e => { setSort(e.target.value as WakalatCarsParams['sort']); setPage(1); }}
              className="border border-gray-200 bg-white rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:border-[#002b5b]"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Car grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="h-44 bg-gray-100" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-5 bg-gray-100 rounded w-1/3 mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : cars.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <Car size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="font-bold text-gray-700 text-lg mb-1">No cars found</p>
            <p className="text-gray-400 text-sm">Try adjusting your filters or search</p>
            {activeFilterCount > 0 && (
              <button onClick={clearAll} className="mt-4 text-sm text-[#002b5b] font-semibold hover:underline">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {cars.map((car, i) => (
              <CarCard key={car.slug} car={car} index={i}
                financeMode={budgetMode === 'finance' && !!monthlyBudget}
                downPayment={Number(downPayment || 0)}
                loanTerm={Number(loanTerm)}
                interestRate={Number(interestRate)}
                isCompared={compareList.includes(car.slug)}
                compareDisabled={compareList.length >= MAX_COMPARE && !compareList.includes(car.slug)}
                onToggleCompare={() => toggleCompare(car)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => fetchCars(page - 1)}
              disabled={page <= 1}
              className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-[#002b5b] hover:text-[#002b5b] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <span className="text-sm text-gray-500 px-2">
              Page <span className="font-bold text-gray-900">{page}</span> of <span className="font-bold text-gray-900">{pages}</span>
            </span>
            <button
              onClick={() => fetchCars(page + 1)}
              disabled={page >= pages}
              className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-[#002b5b] hover:text-[#002b5b] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* ── Compare tray (shopping-cart style) ── */}
      <AnimatePresence>
        {compareItems.length >= 1 && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl"
          >
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4 flex-wrap sm:flex-nowrap">

              {/* Slots */}
              <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto pb-1">
                {Array.from({ length: MAX_COMPARE }).map((_, i) => {
                  const item = compareItems[i];
                  return item ? (
                    <div key={item.slug} className="relative flex-shrink-0 w-28 bg-[#002b5b]/5 border border-[#002b5b]/20 rounded-xl overflow-hidden group">
                      {/* Thumbnail */}
                      {item.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={wakalatImageUrl(item.thumbnail)} alt="" className="w-full h-16 object-cover" />
                      ) : (
                        <div className="w-full h-16 bg-gray-100 flex items-center justify-center text-2xl">🚗</div>
                      )}
                      {/* Remove */}
                      <button
                        onClick={() => setCompareItems(prev => prev.filter(c => c.slug !== item.slug))}
                        className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full shadow flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <X size={10} />
                      </button>
                      {/* Name */}
                      <div className="px-2 py-1.5">
                        <p className="text-xs font-bold text-gray-800 leading-tight truncate">{item.name}</p>
                        {item.price && <p className="text-xs text-[#002b5b] font-black mt-0.5">{formatQAR(item.price)}</p>}
                      </div>
                    </div>
                  ) : (
                    <div key={`empty-${i}`} className="flex-shrink-0 w-28 h-[94px] border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-300">
                      <Car size={18} />
                      <span className="text-xs font-medium">Add car</span>
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setCompareItems([])}
                  className="text-xs text-gray-400 hover:text-gray-700 font-semibold px-2 py-1.5 transition-colors"
                >
                  Clear all
                </button>
                <button
                  disabled={compareItems.length < 2}
                  onClick={() => router.push(`/cars/compare?slugs=${compareList.join(',')}`)}
                  className="flex items-center gap-2 text-sm font-black bg-[#005ca9] hover:bg-[#004a87] disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
                >
                  <BarChart2 size={16} />
                  {compareItems.length < 2
                    ? `Compare (need ${2 - compareItems.length} more)`
                    : `Compare ${compareItems.length} Cars →`}
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Spacer so footer isn't hidden behind tray */}
      {compareItems.length >= 1 && <div className="h-36" />}
      <Footer />
    </div>
  );
}

// ─── Car card ─────────────────────────────────────────────────────────────────
function CarCard({
  car, index, financeMode, downPayment, loanTerm, interestRate,
  isCompared, compareDisabled, onToggleCompare,
}: {
  car: WakalatCarSummary;
  index: number;
  financeMode: boolean;
  downPayment: number;
  loanTerm: number;
  interestRate: number;
  isCompared?: boolean;
  compareDisabled?: boolean;
  onToggleCompare?: () => void;
}) {
  const monthly = car.base_price_qar
    ? calcMonthlyPayment(car.base_price_qar, downPayment, interestRate, loanTerm)
    : 0;

  const imgSrc = car.thumbnail ? wakalatImageUrl(car.thumbnail) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.5) }}
      className="flex flex-col"
    >
      <div className={`group flex flex-col bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all h-full ${isCompared ? 'border-[#002b5b] ring-2 ring-[#002b5b]/20' : 'border-gray-100 hover:border-[#002b5b]/30'}`}>

        {/* Image with checkbox overlay */}
        <div className="relative h-44 bg-gray-50 overflow-hidden flex-shrink-0">
          <Link href={`/cars/${car.slug}`} className="block w-full h-full">
            {imgSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imgSrc}
                alt={`${car.year} ${car.make} ${car.model}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Car size={48} className="text-gray-200" />
              </div>
            )}
          </Link>

          {/* Fuel badge */}
          {car.fuel_type && (
            <span className={`absolute top-2 right-2 flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full pointer-events-none ${
              car.fuel_type === 'Electric' ? 'bg-green-500 text-white' :
              car.fuel_type === 'Hybrid' ? 'bg-teal-500 text-white' :
              'bg-black/60 text-white'
            }`}>
              {FUEL_ICONS[car.fuel_type] ?? <Fuel size={11} />}
              {car.fuel_type}
            </span>
          )}

          {/* Checkbox — top-left */}
          <button
            onClick={e => { e.preventDefault(); if (!compareDisabled || isCompared) onToggleCompare?.(); }}
            title={isCompared ? 'Remove from compare' : compareDisabled ? `Max ${MAX_COMPARE} cars` : 'Add to compare'}
            className={`absolute top-2 left-2 w-7 h-7 rounded-lg flex items-center justify-center transition-all shadow-md z-10 ${
              isCompared
                ? 'bg-[#002b5b] border-2 border-[#002b5b]'
                : compareDisabled
                  ? 'bg-white/60 border-2 border-gray-200 cursor-not-allowed'
                  : 'bg-white/90 border-2 border-gray-200 hover:border-[#002b5b] hover:bg-white'
            }`}
          >
            {isCompared ? (
              // Checked — white checkmark
              <svg viewBox="0 0 12 12" width="12" height="12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <div className={`w-3 h-3 rounded-sm ${compareDisabled ? 'bg-gray-200' : 'bg-transparent'}`} />
            )}
          </button>

          {/* "Comparing" label strip */}
          {isCompared && (
            <div className="absolute bottom-0 left-0 right-0 bg-[#002b5b]/90 text-white text-xs font-bold py-1 text-center tracking-wide pointer-events-none">
              ✓ Added to compare
            </div>
          )}
        </div>

        {/* Info — links to detail */}
        <Link href={`/cars/${car.slug}`} className="flex flex-col flex-1 p-4">
          <p className="text-xs text-gray-400 font-medium mb-0.5">{car.dealer}</p>
          <h3 className="font-bold text-gray-900 text-sm leading-snug group-hover:text-[#002b5b] transition-colors">
            {car.year} {car.make} {car.model}
          </h3>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {car.body_type && <Tag>{car.body_type.replace(' Cars', '')}</Tag>}
            {car.transmission && <Tag>{car.transmission}</Tag>}
            {car.engine && <Tag>{car.engine}</Tag>}
          </div>

          {/* Price */}
          <div className="mt-3 pt-3 border-t border-gray-50">
            {car.base_price_qar ? (
              <>
                <div className="text-lg font-black text-[#002b5b]">{formatQAR(car.base_price_qar)}</div>
                {financeMode && monthly > 0 && (
                  <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                    <CreditCard size={11} />
                    ~{formatQAR(Math.round(monthly))}/mo
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-gray-400 font-medium">Price on request</div>
            )}
          </div>
        </Link>

      </div>
    </motion.div>
  );
}

// ─── Filter group ─────────────────────────────────────────────────────────────
function FilterGroup({ label, items, selected, onToggle }: {
  label: string;
  items: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const show = expanded ? items : items.slice(0, 6);

  if (!items.length) return null;

  return (
    <div>
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{label}</h4>
      <div className="flex flex-wrap gap-1.5">
        {show.map(item => (
          <button
            key={item}
            onClick={() => onToggle(item)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              selected.includes(item)
                ? 'bg-[#002b5b] text-white border-[#002b5b]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-[#002b5b] hover:text-[#002b5b]'
            }`}
          >
            {item}
          </button>
        ))}
        {items.length > 6 && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-400 hover:text-[#002b5b] flex items-center gap-1"
          >
            {expanded ? <><ChevronUp size={12} /> Less</> : <><ChevronDown size={12} /> +{items.length - 6} more</>}
          </button>
        )}
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-md border border-gray-100">
      {children}
    </span>
  );
}
