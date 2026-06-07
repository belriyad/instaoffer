'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calculator, RefreshCw, Car, Clock, MapPin, Gauge, ChevronRight,
  Send, Package, Info, AlertCircle,
  CheckCircle2, Filter, Inbox,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import {
  getMLEstimate, getDealerTradeIns,
  TradeInRequest, MLEstimate,
} from '@/lib/api';
import { formatQAR, formatDate } from '@/lib/utils';
import { SearchableMakeSelect, SearchableModelSelect, KmBucketPicker, KM_BUCKETS, kmLabel } from '@/lib/form-controls';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 25 }, (_, i) => CURRENT_YEAR - i);
const CITIES = ['Doha', 'Al Rayyan', 'Al Wakrah', 'Al Khor', 'Lusail', 'Umm Salal', 'Al Daayen', 'Al Shamal'];

const REQUEST_STATUS_CONFIG: Record<string, { label: string; badgeClass: string; dot: string }> = {
  open:         { label: 'Open',           badgeClass: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-400' },
  under_review: { label: 'Under Review',   badgeClass: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  offer_made:   { label: 'Offer Sent',     badgeClass: 'bg-purple-100 text-purple-700', dot: 'bg-purple-400' },
  accepted:     { label: 'Accepted',       badgeClass: 'bg-green-100 text-green-700',   dot: 'bg-green-400' },
  rejected:     { label: 'Declined',       badgeClass: 'bg-red-100 text-red-700',       dot: 'bg-red-400' },
  expired:      { label: 'Expired',        badgeClass: 'bg-gray-100 text-gray-400',     dot: 'bg-gray-300' },
  cancelled:    { label: 'Cancelled',      badgeClass: 'bg-gray-100 text-gray-400',     dot: 'bg-gray-300' },
};

type Tab = 'requests' | 'estimator';

const STATUS_FILTERS = [
  { value: '',             label: 'All' },
  { value: 'open',         label: 'Open' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'offer_made',   label: 'Offer Sent' },
  { value: 'accepted',     label: 'Accepted' },
  { value: 'rejected',     label: 'Declined' },
];

// ─── Estimator Tab ────────────────────────────────────────────────────────────
function EstimatorTab() {
  const [make,       setMake]      = useState('');
  const [model,      setModel]     = useState('');
  const [year,       setYear]      = useState('');
  const [km,         setKm]        = useState<number | null>(null);
  const [city,       setCity]      = useState('Doha');
  const [condition,  setCond]      = useState('good');
  const [loading,    setLoading]   = useState(false);
  const [result,     setResult]    = useState<MLEstimate | null>(null);
  const [error,      setError]     = useState('');

  async function handleEstimate() {
    if (!make || !model || !year || !km) { setError('Fill in make, model, year and mileage.'); return; }
    setError(''); setLoading(true); setResult(null);
    try {
      const r = await getMLEstimate({
        make, class_name: model, manufacture_year: parseInt(year), km, city: city || undefined, condition: condition || undefined,
      });
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Estimate failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
          <Calculator size={17} className="text-[#003087]" /> Car Valuation Estimator
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Make *</label>
            <SearchableMakeSelect value={make} onChange={v => { setMake(v); setModel(''); }} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Model *</label>
            <SearchableModelSelect make={make} value={model} onChange={setModel} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Year *</label>
            <select value={year} onChange={e => setYear(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]">
              <option value="">Select year</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Mileage *</label>
            <KmBucketPicker value={km} onChange={setKm} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">City</label>
            <select value={city} onChange={e => setCity(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]">
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Condition</label>
            <select value={condition} onChange={e => setCond(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]">
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle size={12} /> {error}
          </p>
        )}

        <button onClick={handleEstimate} disabled={loading}
          className="mt-5 w-full flex items-center justify-center gap-2 bg-[#003087] hover:bg-[#002070] text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-60">
          {loading
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Calculating…</>
            : <><Calculator size={16} /> Get Estimate</>}
        </button>
      </div>

      {result && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={18} className="text-green-500" />
            <p className="font-bold text-gray-900">
              {year} {make} {model} {km != null ? `· ${kmLabel(km)}` : ''}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">Market Value</p>
              <p className="text-2xl font-black text-green-800">{formatQAR(result.estimated_price_qar)}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">Low</p>
              <p className="text-xl font-black text-blue-800">{formatQAR(result.confidence_range[0])}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">High</p>
              <p className="text-xl font-black text-blue-800">{formatQAR(result.confidence_range[1])}</p>
            </div>
          </div>

          {result.segment && (
            <p className="text-xs text-gray-500">
              Segment: <strong>{result.segment}</strong>
              {result.model_version && <> · Model: {result.model_version}</>}
            </p>
          )}
          {result.consensus_status === 'diverged' && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs text-orange-700 flex items-start gap-2">
              <Info size={13} className="shrink-0 mt-0.5" />
              <span>Models diverged — treat as a rough guide. Get a physical inspection for a firmer valuation.</span>
            </div>
          )}
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Info size={11} /> Estimates are indicative. Final value depends on physical inspection.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Request Card ─────────────────────────────────────────────────────────────
function RequestCard({
  req,
}: {
  req: TradeInRequest;
}) {
  const uid = req.trade_in_uid ?? req.uid ?? String(req.id ?? '');
  const st  = REQUEST_STATUS_CONFIG[req.status] ?? { label: req.status, badgeClass: 'bg-gray-100 text-gray-500', dot: 'bg-gray-300' };
  const tradeInRequired = req.notes?.includes('REQUIRED');
  const tradeInOptional = req.notes?.includes('Optional');
  const canAct = !['accepted', 'rejected', 'expired', 'cancelled', 'offer_made'].includes(req.status);

  let photoUrls: string[] = [];
  try { if (req.photo_urls_json) photoUrls = JSON.parse(req.photo_urls_json); } catch { /* ok */ }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Thumb strip */}
      {photoUrls.length > 0 && (
        <div className="flex gap-1 p-2 bg-gray-50 border-b border-gray-100">
          {photoUrls.slice(0, 5).map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={url} alt="" className="w-14 h-10 object-cover rounded-lg flex-shrink-0" />
          ))}
          {photoUrls.length > 5 && (
            <div className="w-14 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
              +{photoUrls.length - 5}
            </div>
          )}
        </div>
      )}

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-gray-900 text-lg leading-tight">
                {req.year} {req.make} {req.class_name}
              </h3>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${st.badgeClass}`}>{st.label}</span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
              {req.km != null && <span className="flex items-center gap-1"><Gauge size={12} />{req.km.toLocaleString()} km</span>}
              {req.city && <span className="flex items-center gap-1"><MapPin size={12} />{req.city}</span>}
              {req.condition && <span className="capitalize">{req.condition}</span>}
              {req.color && <span>{req.color}</span>}
            </div>
          </div>
          <p className="text-xs text-gray-400 shrink-0 flex items-center gap-1 mt-0.5">
            <Clock size={11} />{formatDate(req.created_at)}
          </p>
        </div>

        {/* Trade-in flag */}
        {(tradeInRequired || tradeInOptional) && (
          <div className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full mb-3 ${tradeInRequired ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {tradeInRequired ? '🚫 Must trade-in' : '✅ Trade-in optional'}
          </div>
        )}

        {/* Target car */}
        {req.target_car_name && (
          <div className="bg-[#003087]/5 rounded-xl px-4 py-3 mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-[#003087] font-bold uppercase tracking-wide mb-0.5">Target Vehicle</p>
              <p className="font-bold text-gray-900 text-sm">{req.target_car_name}</p>
            </div>
            {req.target_price_qar != null && (
              <p className="font-black text-[#003087] text-sm shrink-0">{formatQAR(req.target_price_qar)}</p>
            )}
          </div>
        )}

        {/* Market value */}
        {req.market_est_qar != null && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-xs text-green-700 font-bold uppercase tracking-wide mb-0.5">Est. Market Value</p>
              <p className="font-black text-green-800">{formatQAR(req.market_est_qar)}</p>
            </div>
            {req.target_price_qar != null && req.market_est_qar < req.target_price_qar && (
              <div className="bg-orange-50 rounded-xl p-3 text-center">
                <p className="text-xs text-orange-700 font-bold uppercase tracking-wide mb-0.5">Gap to Target</p>
                <p className="font-black text-orange-800">{formatQAR(req.target_price_qar - req.market_est_qar)}</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          <Link
            href={`/dashboard/trade-ins/${uid}`}
            className="flex items-center gap-1.5 text-sm font-bold text-[#003087] bg-[#e8f0fd] hover:bg-[#d0e0fb] px-4 py-2.5 rounded-xl transition-colors"
          >
            View Details <ChevronRight size={14} />
          </Link>
          {canAct && (
            <Link
              href={`/dashboard/trade-ins/${uid}#proposal`}
              className="flex items-center gap-1.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 px-4 py-2.5 rounded-xl transition-colors"
            >
              <Send size={14} /> Send Proposal
            </Link>
          )}
          {req.status === 'offer_made' && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 px-3 py-2 rounded-xl">
              <Package size={13} /> Proposal sent — awaiting buyer
            </span>
          )}
          {req.status === 'accepted' && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-3 py-2 rounded-xl">
              <CheckCircle2 size={13} /> Accepted — contact buyer to finalise
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Requests Tab ─────────────────────────────────────────────────────────────
function RequestsTab({ token }: { token: string }) {
  const [requests,    setRequests]    = useState<TradeInRequest[]>([]);
  const [fetching,    setFetching]    = useState(true);
  const [fetchError,  setFetchError]  = useState('');
  const [statusFilter,setStatusFilter]= useState('open');

  const load = useCallback(async (status: string) => {
    setFetching(true); setFetchError('');
    try {
      const res = await getDealerTradeIns({ status: status || undefined, limit: 100 }, token);
      setRequests(res.rows ?? []);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setFetching(false);
    }
  }, [token]);

  useEffect(() => { load(statusFilter); }, [load, statusFilter]);

  // Status counts for filter pills
  const counts = requests.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(f => (
          <button key={f.value} onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              statusFilter === f.value
                ? 'bg-[#003087] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-[#003087] hover:text-[#003087]'
            }`}>
            {f.label}
            {f.value && counts[f.value] ? ` (${counts[f.value]})` : ''}
          </button>
        ))}
        <button onClick={() => load(statusFilter)} className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 font-medium px-2">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>


      {fetching ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#003087]/20 border-t-[#003087] rounded-full animate-spin" />
        </div>
      ) : fetchError ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
          <AlertCircle size={28} className="text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-600">{fetchError}</p>
          <button onClick={() => load(statusFilter)} className="mt-3 text-xs text-red-600 underline">Retry</button>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Inbox size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="font-bold text-gray-500 mb-1">No requests</p>
          <p className="text-xs text-gray-400">
            {statusFilter ? `No ${REQUEST_STATUS_CONFIG[statusFilter]?.label ?? statusFilter} requests right now.` : 'No trade-in requests yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-gray-400 font-medium">{requests.length} request{requests.length !== 1 ? 's' : ''}</p>
          {requests.map(req => {
            const uid = req.trade_in_uid ?? req.uid ?? String(req.id ?? '');
            return (
              <RequestCard
                key={uid}
                req={req}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('requests');

  useEffect(() => {
    if (!loading && !user) router.push('/login/dealer');
  }, [user, loading, router]);

  if (loading || !user) {
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

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900">Dealer Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
          Welcome back{user.full_name ? `, ${user.full_name}` : ''}
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-2xl p-1 mb-6 shadow-sm">
          <button
            onClick={() => setTab('requests')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === 'requests'
                ? 'bg-[#003087] text-white shadow'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <RefreshCw size={15} /> Received Requests
          </button>
          <button
            onClick={() => setTab('estimator')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === 'estimator'
                ? 'bg-[#003087] text-white shadow'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Calculator size={15} /> Estimator
          </button>
        </div>

        {/* Tab content */}
        {tab === 'requests' && token && <RequestsTab token={token} />}
        {tab === 'estimator' && <EstimatorTab />}

      </main>
      <Footer />
    </div>
  );
}
