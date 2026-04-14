'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, ChevronDown, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      {/* Top blue bar */}
      <div className="bg-[#003087] text-white text-xs py-1 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <span>Qatar&apos;s #1 Car Instant Offer Platform</span>
          <span>🇶🇦 Designed for Qatar</span>
        </div>
      </div>

      <nav className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-[#003087] text-white font-black text-xl px-3 py-1 rounded">
              Insta<span className="text-[#ff6600]">Offer</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/valuation" className="text-sm font-semibold text-gray-700 hover:text-[#003087] transition-colors">
              Get Valuation
            </Link>
            <Link href="/how-it-works" className="text-sm font-semibold text-gray-700 hover:text-[#003087] transition-colors">
              How It Works
            </Link>
            <Link href="/for-dealers" className="text-sm font-semibold text-gray-700 hover:text-[#003087] transition-colors">
              For Dealers
            </Link>
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 hover:border-[#003087] transition-colors text-sm font-medium"
                >
                  <User size={16} />
                  <span>{user.full_name?.split(' ')[0] || 'Account'}</span>
                  <ChevronDown size={14} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50">
                    {(user.role === 'dealer' || user.role === 'admin') && (
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <LayoutDashboard size={14} />
                        Dashboard
                      </Link>
                    )}
                    <Link
                      href="/my-offers"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User size={14} />
                      My Offers
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold text-gray-700 hover:text-[#003087]">
                  Sign In
                </Link>
                <Link
                  href="/valuation"
                  className="bg-[#ff6600] text-white text-sm font-bold px-5 py-2.5 rounded hover:bg-[#e05a00] transition-colors"
                >
                  Get My Offer
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 space-y-1">
            <Link href="/valuation" className="block px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileOpen(false)}>
              Get Valuation
            </Link>
            <Link href="/how-it-works" className="block px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileOpen(false)}>
              How It Works
            </Link>
            <Link href="/for-dealers" className="block px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileOpen(false)}>
              For Dealers
            </Link>
            <hr className="border-gray-100 my-2" />
            {user ? (
              <>
                <Link href="/my-offers" className="block px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileOpen(false)}>
                  My Offers
                </Link>
                <button onClick={handleSignOut} className="block w-full text-left px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileOpen(false)}>
                  Sign In
                </Link>
                <Link href="/valuation" className="block mx-4 mt-2 bg-[#ff6600] text-white text-center font-bold py-3 rounded-lg" onClick={() => setMobileOpen(false)}>
                  Get My Offer Free
                </Link>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
