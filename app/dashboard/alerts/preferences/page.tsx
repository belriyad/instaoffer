'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bell, BellOff, Plus, Trash2, CheckCircle2, AlertCircle, Zap, Save, ArrowLeft,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import { getDealerPreferences, setDealerPreferences } from '@/lib/api';
import { SearchableMakeSelect, SearchableModelSelect } from '@/lib/form-controls';

// ── Types ──────────────────────────────────────────────────────────────────────

interface AlertPreference {
  id: string;
  make: string;
  model: string;
  year_min: string;
  year_max: string;
  price_max: string;
  min_score: string;
  urgent_only: boolean;
  enabled: boolean;
}

const SCORE_OPTIONS = [
  { value: '0',  label: 'All deals' },
  { value: '50', label: '50+ Good' },
  { value: '70', label: '70+ Strong' },
  { value: '85', label: '85+ Hot only' },
];

const QUICK_MAKES = ['Toyota', 'Lexus', 'BMW', 'Mercedes-Benz', 'Land Rover'];

function uid() { return Math.random().toString(36).slice(2); }

function blankPref(make = ''): AlertPreference {
  return {
    id: uid(), make, model: '', year_min: '', year_max: '',
    price_max: '', min_score: '50', urgent_only: false, enabled: true,
  };
}

const STORAGE_KEY = 'instaoffer_alert_prefs';

// ── Preference card ─────────────────────────────────────────────────────────────

function PreferenceCard({
  pref, onChange, onDelete,
}: {
  pref: AlertPreference;
  onChange: (p: AlertPreference) => void;
  onDelete: () => void;
}) {
  function set<K extends keyof AlertPreference>(k: K, v: AlertPreference[K]) {
    onChange({ ...pref, [k]: v });
  }

  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${pref.enabled ? 'border-gray-100' : 'border-gray-200 opacity-55'}`}>
      {/* Toggle + delete row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => set('enabled', !pref.enabled)}
            className={`w-10 h-6 rounded-full transition-colors relative ${pref.enabled ? 'bg-[#003087]' : 'bg-gray-200'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${pref.enabled ? 'left-5' : 'left-1'}`} />
          </button>
          <span className="text-xs font-semibold text-gray-400">{pref.enabled ? 'Active' : 'Paused'}</span>
        </div>
        <button type="button" onClick={onDelete} className="text-gray-300 hover:text-red-400 transition-colors p-1">
          <Trash2 size={15} />
        </button>
      </div>

      {/* Make / Model */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Make *</label>
          <SearchableMakeSelect value={pref.make} onChange={v => { set('make', v); set('model', ''); }} />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Model</label>
          {pref.make
            ? <SearchableModelSelect make={pref.make} value={pref.model} onChange={v => set('model', v)} />
            : <div className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-300 bg-gray-50 select-none">Any model</div>
          }
        </div>
      </div>

      {/* Year range */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Year From</label>
          <input type="number" min="2000" max={new Date().getFullYear()} value={pref.year_min}
            onChange={e => set('year_min', e.target.value)} placeholder="e.g. 2019"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Year To</label>
          <input type="number" min="2000" max={new Date().getFullYear()} value={pref.year_max}
            onChange={e => set('year_max', e.target.value)} placeholder={String(new Date().getFullYear())}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]" />
        </div>
      </div>

      {/* Max price */}
      <div className="mb-3">
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Max Asking Price (QAR)</label>
        <input type="number" value={pref.price_max} min="0" step="5000"
          onChange={e => set('price_max', e.target.value)} placeholder="e.g. 300000"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]" />
      </div>

      {/* Score threshold */}
      <div className="mb-3">
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Alert Threshold</label>
        <div className="grid grid-cols-4 gap-2">
          {SCORE_OPTIONS.map(opt => (
            <button key={opt.value} type="button" onClick={() => set('min_score', opt.value)}
              className={`text-xs font-semibold py-2 rounded-lg border-2 transition-all leading-tight ${
                pref.min_score === opt.value
                  ? 'border-[#003087] bg-[#003087] text-white'
                  : 'border-gray-200 text-gray-500 hover:border-[#003087]/40'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 mt-1">Only alert when opportunity score meets this threshold</p>
      </div>

      {/* Urgent only */}
      <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
        <button type="button" onClick={() => set('urgent_only', !pref.urgent_only)}
          className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${pref.urgent_only ? 'bg-[#ff6600]' : 'bg-gray-200'}`}>
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${pref.urgent_only ? 'left-4' : 'left-0.5'}`} />
        </button>
        <div>
          <p className="text-xs font-semibold text-gray-700 flex items-center gap-1">
            <Zap size={11} className="text-[#ff6600]" /> Urgent sellers only
          </p>
          <p className="text-[10px] text-gray-400">Only alert when seller has flagged urgency</p>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

// Reconstruct editable rules from the backend's single aggregate preference
// object (one rule per saved make). Used when no richer local copy exists.
function rulesFromBackend(p: {
  makes_json?: string; min_year?: number; max_year?: number;
  min_score_for_alert?: number; active?: number | boolean;
}): AlertPreference[] {
  let makes: string[] = [];
  try { makes = p.makes_json ? JSON.parse(p.makes_json) : []; } catch { makes = []; }
  if (makes.length === 0) return [];
  const enabled = p.active === undefined ? true : Boolean(p.active);
  return makes.map(make => ({
    ...blankPref(make),
    year_min: p.min_year ? String(p.min_year) : '',
    year_max: p.max_year ? String(p.max_year) : '',
    min_score: p.min_score_for_alert != null ? String(p.min_score_for_alert) : '50',
    enabled,
  }));
}

// Collapse the editable rule list into the backend's single aggregate object.
function rulesToBackend(prefs: AlertPreference[]) {
  const enabled = prefs.filter(p => p.enabled && p.make);
  const makes = Array.from(new Set(enabled.map(p => p.make)));
  const years = enabled.map(p => parseInt(p.year_min, 10)).filter(n => !isNaN(n));
  const yearsMax = enabled.map(p => parseInt(p.year_max, 10)).filter(n => !isNaN(n));
  const scores = enabled.map(p => parseInt(p.min_score, 10)).filter(n => !isNaN(n));
  return {
    makes,
    min_year: years.length ? Math.min(...years) : undefined,
    max_year: yearsMax.length ? Math.max(...yearsMax) : undefined,
    // Lowest threshold across rules = most inclusive, so any rule can fire.
    min_score_for_alert: scores.length ? Math.min(...scores) : undefined,
    notify_whatsapp: true,
    active: makes.length > 0,
  };
}

export default function AlertPreferencesPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [prefs, setPrefs] = useState<AlertPreference[]>([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/login/dealer');
  }, [user, loading, router]);

  // Load order: local copy (full fidelity) wins; otherwise hydrate from backend.
  useEffect(() => {
    let cancelled = false;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPrefs(parsed);
          return;
        }
      }
    } catch { /* ignore */ }

    if (!token) return;
    getDealerPreferences(token)
      .then(res => {
        if (cancelled || !res?.preferences) return;
        setPrefs(rulesFromBackend(res.preferences));
      })
      .catch(() => { /* leave empty state */ });
    return () => { cancelled = true; };
  }, [token]);

  function addPref(make = '') { setPrefs(prev => [...prev, blankPref(make)]); }
  function updatePref(id: string, updated: AlertPreference) {
    setPrefs(prev => prev.map(p => p.id === id ? updated : p));
  }
  function deletePref(id: string) {
    setPrefs(prev => prev.filter(p => p.id !== id));
  }

  async function save() {
    const incomplete = prefs.filter(p => p.enabled && !p.make);
    if (incomplete.length > 0) {
      setError('Each active alert rule needs at least a Make selected.');
      return;
    }
    if (!token) { setError('You need to be signed in to save preferences.'); return; }
    setSaving(true);
    setError('');
    try {
      // Persist server-side so alerts actually fire, and keep a full-fidelity
      // local copy (the backend stores only one aggregate rule set).
      await setDealerPreferences(rulesToBackend(prefs), token);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save preferences.');
    } finally {
      setSaving(false);
    }
  }

  const activeCount = prefs.filter(p => p.enabled).length;

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">

        {/* Back link */}
        <Link href="/dashboard/alerts" className="inline-flex items-center gap-1.5 text-sm text-[#003087] font-semibold mb-6 hover:underline">
          <ArrowLeft size={15} /> Back to Alerts
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <Bell className="text-[#003087]" size={22} /> Alert Preferences
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Get notified when matching opportunities appear
            </p>
          </div>
          {activeCount > 0 && (
            <span className="bg-[#003087] text-white text-xs font-bold px-2.5 py-1.5 rounded-full shrink-0">
              {activeCount} active
            </span>
          )}
        </div>

        {/* How it works banner */}
        <div className="bg-[#003087]/5 border border-[#003087]/10 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <Zap size={18} className="text-[#ff6600] mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-[#003087] mb-1">How WhatsApp alerts work</p>
            <ul className="text-xs text-[#003087]/75 space-y-0.5">
              <li>• A seller submits a car matching your make/model/year/price criteria</li>
              <li>• The opportunity score meets your threshold</li>
              <li>• You receive an instant WhatsApp with valuation, margin estimate, and photos</li>
              <li>• One-tap to place a bid directly from WhatsApp</li>
            </ul>
          </div>
        </div>

        {/* Feedback */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">
            <AlertCircle size={15} /> {error}
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 mb-4 text-sm">
            <CheckCircle2 size={15} /> Preferences saved — you&apos;ll be alerted when matching cars appear.
          </div>
        )}

        {/* Empty state */}
        {prefs.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center mb-6">
            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <BellOff size={24} className="text-gray-300" />
            </div>
            <p className="font-bold text-gray-900 mb-1">No alert rules yet</p>
            <p className="text-sm text-gray-400 mb-5">Add rules to receive WhatsApp alerts when matching cars appear.</p>
            <button type="button" onClick={() => addPref()}
              className="inline-flex items-center gap-2 bg-[#003087] text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-[#002070] transition-colors">
              <Plus size={16} /> Add Alert Rule
            </button>

            {/* Quick-add makes */}
            <div className="mt-6">
              <p className="text-xs text-gray-400 mb-3">Or start with a popular make</p>
              <div className="flex flex-wrap justify-center gap-2">
                {QUICK_MAKES.map(make => (
                  <button key={make} type="button" onClick={() => addPref(make)}
                    className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:border-[#003087] hover:text-[#003087] transition-colors">
                    {make}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Preference cards */}
        {prefs.length > 0 && (
          <div className="space-y-4 mb-6">
            {prefs.map(pref => (
              <PreferenceCard
                key={pref.id}
                pref={pref}
                onChange={updated => updatePref(pref.id, updated)}
                onDelete={() => deletePref(pref.id)}
              />
            ))}
          </div>
        )}

        {/* Action bar */}
        {prefs.length > 0 && (
          <div className="flex gap-3">
            <button type="button" onClick={() => addPref()}
              className="flex items-center gap-2 border-2 border-dashed border-gray-300 text-gray-500 font-semibold px-4 py-3 rounded-xl text-sm hover:border-[#003087] hover:text-[#003087] transition-colors">
              <Plus size={15} /> Add rule
            </button>
            <button type="button" onClick={save} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-[#003087] hover:bg-[#002070] text-white font-bold py-3 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {saving
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <Save size={15} />}
              {saving ? 'Saving…' : 'Save Preferences'}
            </button>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}
