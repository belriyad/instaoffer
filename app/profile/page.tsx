'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Lock,
  CheckCircle2,
  AlertCircle,
  Save,
  LogOut,
  ChevronRight,
  Shield,
  Tag,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import {
  getProfile,
  patchProfile,
  changePassword,
  UserProfile,
} from '@/lib/api';
import { QATAR_CITIES } from '@/lib/utils';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'العربية' },
];

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin:  { label: 'Admin',  color: 'bg-purple-100 text-purple-700' },
  dealer: { label: 'Dealer', color: 'bg-blue-100 text-[#002b5b]' },
  user:   { label: 'Seller', color: 'bg-green-100 text-green-700' },
  guest:  { label: 'Guest',  color: 'bg-gray-100 text-gray-600' },
};

export default function ProfilePage() {
  const { user, token, loading, signOut } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [lang, setLang] = useState('en');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdError, setPwdError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/profile');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!token || !user) return;
    getProfile(token)
      .then(p => {
        setProfile(p);
        setFullName(p.full_name || user.full_name || '');
        setCity(p.city || '');
        setLang(p.preferred_language || 'en');
      })
      .catch(() => {
        setFullName(user?.full_name || '');
      })
      .finally(() => setProfileLoading(false));
  }, [token, user]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setProfileSaving(true);
    setProfileError('');
    setProfileSuccess(false);
    try {
      const updated = await patchProfile(
        { full_name: fullName, city: city || null, preferred_language: lang },
        token
      );
      setProfile(updated);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (newPwd !== confirmPwd) { setPwdError('New passwords do not match'); return; }
    if (newPwd.length < 8)     { setPwdError('New password must be at least 8 characters'); return; }
    setPwdSaving(true);
    setPwdError('');
    setPwdSuccess(false);
    try {
      // Swagger: POST /auth/change-password returns new AuthTokens — persist them
      const newTokens = await changePassword({ current_password: currentPwd, new_password: newPwd }, token);
      localStorage.setItem('instaoffer_token',  newTokens.access_token);
      localStorage.setItem('instaoffer_refresh', newTokens.refresh_token);
      setPwdSuccess(true);
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      setTimeout(() => setPwdSuccess(false), 3000);
    } catch (err) {
      setPwdError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setPwdSaving(false);
    }
  }

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-[#002b5b] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const roleInfo = ROLE_LABELS[user.role] ?? ROLE_LABELS.user;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header card */}
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 flex items-center gap-5"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#002b5b] to-blue-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {(user.full_name || user.email || '?')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                {user.full_name || 'My Account'}
              </h1>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleInfo.color}`}>
                {roleInfo.label}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5 truncate">{user.email}</p>
            {user.phone && <p className="text-sm text-gray-400 mt-0.5">{user.phone}</p>}
          </div>
          <div className="hidden sm:flex flex-col gap-2">
            {user.role === 'dealer' || user.role === 'admin' ? (
              <button onClick={() => router.push('/dashboard')} className="text-sm text-[#002b5b] font-semibold flex items-center gap-1 hover:underline">
                Dashboard <ChevronRight size={14} />
              </button>
            ) : (
              <button onClick={() => router.push('/my-offers')} className="text-sm text-[#002b5b] font-semibold flex items-center gap-1 hover:underline">
                My Offers <ChevronRight size={14} />
              </button>
            )}
            <button onClick={() => signOut()} className="text-sm text-red-500 font-semibold flex items-center gap-1 hover:underline">
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </motion.div>

        {/* Profile info form */}
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6"
        >
          <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
            <User size={18} className="text-[#002b5b]" /> Profile Information
          </h2>
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002b5b]/20 focus:border-[#002b5b]" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" value={user.email || ''} readOnly
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
              </div>
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>
            {user.phone && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="tel" value={user.phone} readOnly
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select value={city} onChange={e => setCity(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002b5b]/20 focus:border-[#002b5b] appearance-none bg-white">
                  <option value="">Select city</option>
                  {QATAR_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Language</label>
              <div className="relative">
                <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select value={lang} onChange={e => setLang(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002b5b]/20 focus:border-[#002b5b] appearance-none bg-white">
                  {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
            </div>
            {profileError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">
                <AlertCircle size={15} /> {profileError}
              </div>
            )}
            {profileSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-4 py-2.5 rounded-xl">
                <CheckCircle2 size={15} /> Profile saved successfully
              </div>
            )}
            <button type="submit" disabled={profileSaving}
              className="w-full py-2.5 bg-[#002b5b] text-white text-sm font-semibold rounded-xl hover:bg-[#001a3d] transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {profileSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
              {profileSaving ? 'Saving…' : 'Save Profile'}
            </button>
          </form>
        </motion.div>

        {/* Password change */}
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6"
        >
          <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
            <Lock size={18} className="text-[#002b5b]" /> Change Password
          </h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
              <input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} required placeholder="Enter current password"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002b5b]/20 focus:border-[#002b5b]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
              <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} required minLength={8} placeholder="At least 8 characters"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002b5b]/20 focus:border-[#002b5b]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
              <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} required placeholder="Repeat new password"
                className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002b5b]/20 focus:border-[#002b5b] ${confirmPwd && confirmPwd !== newPwd ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} />
              {confirmPwd && confirmPwd !== newPwd && <p className="text-xs text-red-500 mt-1">Passwords don&apos;t match</p>}
            </div>
            {pwdError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">
                <AlertCircle size={15} /> {pwdError}
              </div>
            )}
            {pwdSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-4 py-2.5 rounded-xl">
                <CheckCircle2 size={15} /> Password changed successfully
              </div>
            )}
            <button type="submit" disabled={pwdSaving || (!!confirmPwd && confirmPwd !== newPwd)}
              className="w-full py-2.5 bg-gray-800 text-white text-sm font-semibold rounded-xl hover:bg-gray-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {pwdSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Lock size={16} />}
              {pwdSaving ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </motion.div>

        {/* Account actions */}
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        >
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Shield size={18} className="text-[#002b5b]" /> Account
          </h2>
          <div className="space-y-3">
            {(user.role === 'dealer' || user.role === 'admin') && (
              <button onClick={() => router.push('/dashboard')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                <span className="flex items-center gap-2"><Tag size={16} className="text-[#002b5b]" /> Dealer Dashboard</span>
                <ChevronRight size={16} className="text-gray-400" />
              </button>
            )}
            <button onClick={() => router.push('/my-offers')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
              <span className="flex items-center gap-2"><Tag size={16} className="text-[#002b5b]" /> My Offer Requests</span>
              <ChevronRight size={16} className="text-gray-400" />
            </button>
            <button onClick={() => { signOut(); router.push('/'); }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-red-100 hover:bg-red-50 transition-colors text-sm font-medium text-red-600">
              <span className="flex items-center gap-2"><LogOut size={16} /> Sign Out</span>
              <ChevronRight size={16} className="text-red-300" />
            </button>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
