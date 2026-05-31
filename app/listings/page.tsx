'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, SlidersHorizontal, Car, X,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight as ChevronRightIcon,
  AlertCircle, Fuel, Settings2, MapPin, Bike, Ship,
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  getWakalatCars, getWakalatFilters,
  WakalatCarSummary, WakalatFilters, WakalatFilterOptions,
  wakalatImgUrl,
} from '@/lib/api';
import { formatQAR } from '@/lib/utils';

type TabId = 'cars' | 'motorcycles' | 'watercrafts';

const VEHICLE_TABS: { id: TabId; label: string; icon: React.ElementType; keywords: string[]; emptyLabel: string }[] = [
  {
    id: 'cars',
    label: 'Cars',
    icon: Car,
    keywords: ['car', 'suv', 'sedan', 'coupe', 'pickup', 'van', 'truck', 'hatchback', 'crossover', 'wagon', 'convertible', 'sport', 'luxury'],
    emptyLabel: 'No cars found',
  },
  {
    id: 'motorcycles',
    label: 'Motorcycles',
    icon: Bike,
    keywords: ['motorcycle', 'bike', 'scooter', 'moped', 'motorbike', 'quad', 'atv'],
    emptyLabel: 'No motorcycles found',
  },
  {
    id: 'watercrafts',
    label: 'Watercrafts',
    icon: Ship,
    keywords: ['boat', 'watercraft', 'jet ski', 'yacht', 'marine', 'vessel', 'speedboat', 'dinghy', 'pontoon'],
    emptyLabel: 'No watercrafts found',
  },
];

/** Returns body_type values from the filter list that match the given tab */
function bodyTypesForTab(allBodyTypes: string[], tab: TabId): string[] {
  if (!allBodyTypes.length) return [];
  const t = VEHICLE_TABS.find(v => v.id === tab)!;
  if (tab === 'cars') {
    const otherKeywords = VEHICLE_TABS
      .filter(v => v.id !== 'cars')
      .flatMap(v => v.keywords);
    return allBodyTypes.filter(bt => {
      const lower = bt.toLowerCase();
      return !otherKeywords.some(k => lower.includes(k));
    });
  }
  return allBodyTypes.filter(bt => t.keywords.some(k => bt.toLowerCase().includes(k)));
}

/** Client-side guard: does this car belong to the given tab? */
function carMatchesTab(bodyType: string | undefined | null, tab: TabId): boolean {
  if (!bodyType) return tab === 'cars'; // items with no body_type fall under Cars
  const lower = bodyType.toLowerCase();
  const motoKeywords = VEHICLE_TABS.find(t => t.id === 'motorcycles')!.keywords;
  const waterKeywords = VEHICLE_TABS.find(t => t.id === 'watercrafts')!.keywords;
  const isMoto  = motoKeywords.some(k => lower.includes(k));
  const isWater = waterKeywords.some(k => lower.includes(k));
  if (tab === 'motorcycles') return isMoto;
  if (tab === 'watercrafts') return isWater;
  return !isMoto && !isWater; // cars tab = everything else
}

const SORT_OPTIONS = [
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'year_desc',  label: 'Newest First' },
  { value: 'year_asc',   label: 'Oldest First' },
  { value: 'make_asc',   label: 'Make A → Z' },
];

function CarCard({ car }: { car: WakalatCarSummary }) {
  const [imgErr, setImgErr] = useState(false);
  const thumb = car.thumbnail && !imgErr ? wakalatImgUrl(car.thumbnail) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
    >
      <div className="aspect-[16/10] bg-gray-100 relative overflow-hidden">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={`${car.make} ${car.model}`} onError={() => setImgErr(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            <Car size={36} className="text-gray-300" />
            <span className="text-xs text-gray-300">No image</span>
          </div>
        )}
        {car.year && (
          <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {car.year}
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs font-semibold text-[#003087] uppercase tracking-wide mb-0.5">{car.make}</p>
        <h3 className="font-bold text-gray-900 text-sm leading-snug">{car.model}</h3>
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {car.body_type && (
            <span className="flex items-center gap-1 text-[11px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
              <Car size={10} /> {car.body_type.replace(' Cars', '')}
            </span>
          )}
          {car.fuel_type && (
            <span className="flex items-center gap-1 text-[11px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
              <Fuel size={10} /> {car.fuel_type}
            </span>
          )}
          {car.transmission && (
            <span className="flex items-center gap-1 text-[11px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
              <Settings2 size={10} /> {car.transmission}
            </span>
          )}
        </div>
        {car.dealer && (
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1 truncate">
            <MapPin size={11} /> {car.dealer}
          </p>
        )}
        <div className="flex items-center justify-between mt-3">
          {car.base_price_qar
            ? <span className="text-[#003087] font-black text-base">{formatQAR(car.base_price_qar)}</span>
            : <span className="text-gray-400 text-sm italic">Price on request</span>}
          <Link href={`/cars/${car.slug}`}
            className="text-xs font-bold text-white bg-[#003087] hover:bg-[#002570] px-3 py-1.5 rounded-lg transition-colors">
            Details
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function BrowseCarsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#003087] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <BrowseCarsInner />
    </Suspense>
  );
}

function BrowseCarsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabId>((searchParams.get('tab') as TabId) || 'cars');

  const [q,            setQ]            = useState(searchParams.get('q') || '');
  const [make,         setMake]         = useState(searchParams.get('make') || '');
  const [bodyType,     setBodyType]     = useState(searchParams.get('body_type') || '');
  const [fuelType,     setFuelType]     = useState(searchParams.get('fuel_type') || '');
  const [transmission, setTransmission] = useState(searchParams.get('transmission') || '');
  const [dealer,       setDealer]       = useState(searchParams.get('dealer') || '');
  const [minPrice,     setMinPrice]     = useState(searchParams.get('price_min') || '');
  const [maxPrice,     setMaxPrice]     = useState(searchParams.get('price_max') || '');
  const [minYear,      setMinYear]      = useState(searchParams.get('year_min') || '');
  const [maxYear,      setMaxYear]      = useState(searchParams.get('year_max') || '');
  const [sort, setSort] = useState<WakalatFilters['sort']>((searchParams.get('sort') as WakalatFilters['sort']) || 'price_asc');
  const [page, setPage] = useState(1);

  const [cars,       setCars]       = useState<WakalatCarSummary[]>([]);
  const [total,      setTotal]      = useState(0);
  const [pages,      setPages]      = useState(1);
  const [filterOpts, setFilterOpts] = useState<WakalatFilterOptions | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const PER_PAGE = 24;
  const activeFilterCount = [make, bodyType, fuelType, transmission, dealer, minPrice, maxPrice, minYear, maxYear].filter(Boolean).length;

  // Body types filtered to current tab
  const tabBodyTypes = filterOpts?.body_types ? bodyTypesForTab(filterOpts.body_types, activeTab) : [];

  // Tab-level body_type constraint (comma-separated) sent to API when no specific body_type chosen
  const tabBodyTypeConstraint = tabBodyTypes.length ? tabBodyTypes.join(',') : undefined;

  useEffect(() => { getWakalatFilters().then(setFilterOpts).catch(() => {}); }, []);

  const fetchCars = useCallback(async (p = 1) => {
    setLoading(true); setError('');
    try {
      const effectiveBodyType = bodyType || tabBodyTypeConstraint;
      const res = await getWakalatCars({
        q:            q            || undefined,
        make:         make         || undefined,
        body_type:    effectiveBodyType,
        fuel_type:    fuelType     || undefined,
        transmission: transmission || undefined,
        dealer:       dealer       || undefined,
        price_min:    minPrice  ? Number(minPrice) : undefined,
        price_max:    maxPrice  ? Number(maxPrice) : undefined,
        year_min:     minYear   ? Number(minYear)  : undefined,
        year_max:     maxYear   ? Number(maxYear)  : undefined,
        sort, page: p, per_page: PER_PAGE,
      });
      setCars((res.cars || []).filter(c => carMatchesTab(c.body_type, activeTab)));
      setTotal(res.total || 0);
      setPages(res.pages || 1);
      setPage(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [q, make, bodyType, tabBodyTypeConstraint, fuelType, transmission, dealer, minPrice, maxPrice, minYear, maxYear, sort]);

  useEffect(() => { fetchCars(1); }, [fetchCars]);

  function switchTab(tab: TabId) {
    setActiveTab(tab);
    clearFilters();
    setPage(1);
    router.replace(`/listings?tab=${tab}`, { scroll: false });
  }

  function clearFilters() {
    setMake(''); setBodyType(''); setFuelType(''); setTransmission('');
    setDealer(''); setMinPrice(''); setMaxPrice(''); setMinYear(''); setMaxYear('');
  }

  const currentTab = VEHICLE_TABS.find(t => t.id === activeTab)!;
  const TabIcon = currentTab.icon;

  const selectCls = 'w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]/20 focus:border-[#003087] appearance-none bg-white';
  const inputCls  = 'w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]/20 focus:border-[#003087]';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="bg-[#003087] text-white pt-8 pb-0">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-black mb-0.5">New Vehicle Inventory</h1>
          <p className="text-blue-200 text-sm">Brand-new dealer inventory across Qatar</p>
          <div className="mt-5 flex gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={q} onChange={e => setQ(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchCars(1)}
                placeholder="Search make, model, dealer…"
                className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ff6600]" />
            </div>
            <button onClick={() => fetchCars(1)}
              className="bg-[#ff6600] hover:bg-[#e05a00] text-white text-sm font-bold px-5 rounded-xl transition-colors">
              Search
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6">
            {VEHICLE_TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => switchTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-bold rounded-t-xl transition-colors border-b-2 ${
                    active
                      ? 'bg-white text-[#003087] border-b-white'
                      : 'text-blue-200 hover:text-white border-b-transparent hover:border-b-blue-300'
                  }`}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">

        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <select value={sort} onChange={e => setSort(e.target.value as WakalatFilters['sort'])}
              className="pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-[#003087]/20">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={make} onChange={e => setMake(e.target.value)}
              className="pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-[#003087]/20">
              <option value="">All Makes</option>
              {(filterOpts?.makes || []).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <button onClick={() => setFiltersOpen(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition-colors relative ${
                filtersOpen ? 'bg-[#003087] text-white border-[#003087]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#003087]'
              }`}>
              <SlidersHorizontal size={13} /> Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#ff6600] text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
              {filtersOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
                <X size={12} /> Clear
              </button>
            )}
          </div>
          <span className="text-sm text-gray-400">
            {loading ? 'Loading…' : `${total.toLocaleString()} result${total !== 1 ? 's' : ''}`}
          </span>
        </div>

        <AnimatePresence>
          {filtersOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {tabBodyTypes.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Body Type</label>
                    <select value={bodyType} onChange={e => setBodyType(e.target.value)} className={selectCls}>
                      <option value="">Any</option>
                      {tabBodyTypes.map(b => <option key={b} value={b}>{b.replace(' Cars', '')}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Fuel Type</label>
                  <select value={fuelType} onChange={e => setFuelType(e.target.value)} className={selectCls}>
                    <option value="">Any</option>
                    {(filterOpts?.fuel_types || ['Petrol','Diesel','Hybrid','Electric']).map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Transmission</label>
                  <select value={transmission} onChange={e => setTransmission(e.target.value)} className={selectCls}>
                    <option value="">Any</option>
                    {(filterOpts?.transmissions || ['Automatic','Manual']).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Dealer</label>
                  <select value={dealer} onChange={e => setDealer(e.target.value)} className={selectCls}>
                    <option value="">All Dealers</option>
                    {(filterOpts?.dealers || []).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Min Year</label>
                  <input type="number" value={minYear} onChange={e => setMinYear(e.target.value)} placeholder="2024" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Max Year</label>
                  <input type="number" value={maxYear} onChange={e => setMaxYear(e.target.value)} placeholder="2026" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Min Price (QAR)</label>
                  <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="0" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Max Price (QAR)</label>
                  <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Any" className={inputCls} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl mb-4 border border-red-100">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="aspect-[16/10] bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-5 bg-gray-200 rounded w-1/3 mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : cars.length === 0 ? (
          <div className="text-center py-24">
            <TabIcon size={48} className="text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-400">{currentTab.emptyLabel}</h3>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or search term.</p>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="mt-4 px-5 py-2 bg-[#003087] text-white text-sm font-semibold rounded-xl hover:bg-[#002570] transition-colors">
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {cars.map(car => <CarCard key={car.id} car={car} />)}
              </AnimatePresence>
            </motion.div>

            {pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button onClick={() => fetchCars(page - 1)} disabled={page <= 1}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:border-[#003087] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm text-gray-600 px-3">
                  Page <strong>{page}</strong> of <strong>{pages}</strong>
                </span>
                <button onClick={() => fetchCars(page + 1)} disabled={page >= pages}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:border-[#003087] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronRightIcon size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
