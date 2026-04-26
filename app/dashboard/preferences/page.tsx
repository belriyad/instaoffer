'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import { getDealerPreferences, setDealerPreferences } from '@/lib/api';
import { CAR_MAKES } from '@/lib/utils';

const QATAR_CITIES = ['Doha', 'Al Rayyan', 'Al Wakrah', 'Al Khor', 'Lusail', 'Mesaieed', 'Dukhan', 'Al Shamal'];

interface Prefs {
  makes: string[];
  cities: string[];
  min_year: number;
  max_year: number;
  max_km: number;
  notify_push: boolean;
  notify_whatsapp: boolean;
  active: boolean;
}

const DEFAULT_PREFS: Prefs = {
  makes: [],
  cities: [],
  min_year: 2010,
  max_year: new Date().getFullYear(),
  max_km: 200000,
  notify_push: true,
  notify_whatsapp: false,
  active: true,
};

export default function PreferencesPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/login/dealer');
  }, [user, loading, router]);

  useEffect(() => {
    if (!token) return;
    getDealerPreferences(token)
      .then((data: Partial<Prefs>) => {
        setPrefs(prev => ({ ...prev, ...data }));
      })
      .catch(() => {/* use defaults */})
      .finally(() => setFetching(false));
  }, [token]);

  function toggleItem<K extends 'makes' | 'cities'>(key: K, value: string) {
    setPrefs(prev => {
      const arr = prev[key] as string[];
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value],
      };
    });
  }

  async function handleSave() {
    if (!token) return;
    setSaving(true);
    setError('');
    try {
      await setDealerPreferences(prefs, token);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  }

  if (loading || fetching) {
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

      <div className="max-w-2xl mx-auto w-full px-4 py-8 flex-1">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Lead Preferences</h1>
            <p className="text-sm text-gray-500">Filter the leads you receive in your dashboard</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Active toggle */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-900">Receive Leads</div>
                <div className="text-sm text-gray-500 mt-0.5">Turn off to pause all incoming leads</div>
              </div>
              <button
                onClick={() => setPrefs(p => ({ ...p, active: !p.active }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${prefs.active ? 'bg-[#003087]' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${prefs.active ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          {/* Car Makes */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-1">Car Makes</h2>
            <p className="text-sm text-gray-500 mb-4">Leave empty to receive all makes</p>
            <div className="flex flex-wrap gap-2">
              {CAR_MAKES.slice(0, 30).map(make => (
                <button
                  key={make}
                  onClick={() => toggleItem('makes', make)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    prefs.makes.includes(make)
                      ? 'bg-[#003087] text-white border-[#003087]'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-[#003087]'
                  }`}
                >
                  {make}
                </button>
              ))}
            </div>
          </div>

          {/* Cities */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-1">Cities</h2>
            <p className="text-sm text-gray-500 mb-4">Leave empty to receive from all cities</p>
            <div className="flex flex-wrap gap-2">
              {QATAR_CITIES.map(city => (
                <button
                  key={city}
                  onClick={() => toggleItem('cities', city)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    prefs.cities.includes(city)
                      ? 'bg-[#003087] text-white border-[#003087]'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-[#003087]'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Year Range */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Year Range</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Min Year</label>
                <input
                  type="number"
                  min={1990}
                  max={prefs.max_year}
                  value={prefs.min_year}
                  onChange={e => setPrefs(p => ({ ...p, min_year: Number(e.target.value) }))}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#003087]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Max Year</label>
                <input
                  type="number"
                  min={prefs.min_year}
                  max={new Date().getFullYear() + 1}
                  value={prefs.max_year}
                  onChange={e => setPrefs(p => ({ ...p, max_year: Number(e.target.value) }))}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#003087]"
                />
              </div>
            </div>
          </div>

          {/* Max KM */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-1">Max Mileage</h2>
            <p className="text-sm text-gray-500 mb-4">
              Only show leads with mileage up to <span className="font-semibold text-gray-700">{prefs.max_km.toLocaleString()} km</span>
            </p>
            <input
              type="range"
              min={10000}
              max={400000}
              step={5000}
              value={prefs.max_km}
              onChange={e => setPrefs(p => ({ ...p, max_km: Number(e.target.value) }))}
              className="w-full accent-[#003087]"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>10,000 km</span>
              <span>400,000 km</span>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Notifications</h2>
            <div className="space-y-4">
              {[
                { key: 'notify_push' as const, label: 'Push Notifications', desc: 'Browser / app push alerts for new leads' },
                { key: 'notify_whatsapp' as const, label: 'WhatsApp Notifications', desc: 'Receive lead alerts via WhatsApp' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{label}</div>
                    <div className="text-xs text-gray-400">{desc}</div>
                  </div>
                  <button
                    onClick={() => setPrefs(p => ({ ...p, [key]: !p[key] }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${prefs[key] ? 'bg-[#003087]' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${prefs[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-[#003087] text-white font-bold py-3.5 rounded-xl text-base hover:bg-[#0057b8] transition-colors disabled:opacity-60"
          >
            {saving ? (
              <><Loader2 size={18} className="animate-spin" /> Saving…</>
            ) : saved ? (
              '✓ Saved!'
            ) : (
              <><Save size={18} /> Save Preferences</>
            )}
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
