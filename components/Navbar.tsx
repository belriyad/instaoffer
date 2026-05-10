'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, ChevronDown, User, LogOut, LayoutDashboard, Tag, Car, Info, Building2, FileText, Zap } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';

// ── nav link groups ─────────────────────────────────────────────────────────

const SELL_LINKS = [
  { href: '/valuation',    label: 'Get Instant Offer', icon: <Zap size={15} />,      desc: 'Free valuation in 60 seconds' },
  { href: '/how-it-works', label: 'How It Works',       icon: <Info size={15} />,     desc: 'Step-by-step seller guide' },
  { href: '/my-offers',    label: 'My Offers',          icon: <FileText size={15} />, desc: 'Track your active offers' },
];

const BUY_LINKS = [
  { href: '/cars',         label: 'New Cars',           icon: <Car size={15} />,      desc: 'Browse new car inventory' },
];

const DEALER_LINKS = [
  { href: '/for-dealers',  label: 'For Dealers',        icon: <Building2 size={15} />, desc: 'Grow your acquisition pipeline' },
  { href: '/dashboard',    label: 'Dealer Dashboard',   icon: <LayoutDashboard size={15} />, desc: 'Leads, bids & analytics' },
];

// ── helpers ──────────────────────────────────────────────────────────────────

function NavDropdown({
  label,
  links,
  pathname,
  onClose,
}: {
  label: string;
  links: { href: string; label: string; icon: React.ReactNode; desc: string }[];
  pathname: string;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(false);
  const isActive = links.some(l => pathname.startsWith(l.href));

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        className={`flex items-center gap-1 text-sm font-semibold py-1 transition-colors ${
          isActive ? 'text-[#003087]' : 'text-gray-600 hover:text-[#003087]'
        }`}
      >
        {label}
        <ChevronDown size={13} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        {isActive && <span className="w-1 h-1 rounded-full bg-[#ff6600] ml-0.5" />}
      </button>

      {open && (
        <div className="absolute left-0 top-full pt-2 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 py-2 min-w-[220px]">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={onClose}
                className={`flex items-start gap-3 px-4 py-2.5 hover:bg-[#003087]/5 transition-colors group ${
                  pathname.startsWith(l.href) ? 'bg-[#003087]/5' : ''
                }`}
              >
                <span className={`mt-0.5 flex-shrink-0 transition-colors ${pathname.startsWith(l.href) ? 'text-[#003087]' : 'text-gray-400 group-hover:text-[#003087]'}`}>
                  {l.icon}
                </span>
                <div>
                  <div className={`text-sm font-semibold leading-tight ${pathname.startsWith(l.href) ? 'text-[#003087]' : 'text-gray-800'}`}>
                    {l.label}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{l.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── main component ───────────────────────────────────────────────────────────

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isDealer = user?.role === 'dealer' || user?.role === 'admin';

  async function handleSignOut() {
    await signOut();
    setUserMenuOpen(false);
    router.push('/');
  }

  const closeMobile = () => setMobileOpen(false);

  // For desktop dropdowns — filter dealer dashboard link to only show for dealers
  const sellLinks = SELL_LINKS.filter(l => l.href !== '/my-offers' || !!user);
  const dealerLinks = isDealer
    ? DEALER_LINKS
    : DEALER_LINKS.filter(l => l.href !== '/dashboard');

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">

      {/* Top bar */}
      <div className="bg-[#003087] text-white text-xs py-1.5 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <span className="flex items-center gap-1.5">
            <Tag size={11} /> Qatar&apos;s Instant Car Offer Platform
          </span>
          <span className="flex items-center gap-4">
            <span>🇶🇦 Built for Qatar</span>
            {process.env.NEXT_PUBLIC_DEPLOY_TIME && (
              <span className="text-white/40 font-mono text-[10px]">
                v {process.env.NEXT_PUBLIC_DEPLOY_TIME}
              </span>
            )}
          </span>
        </div>
      </div>

      <nav className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-6">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <div className="bg-[#003087] text-white font-black text-xl px-3 py-1 rounded">
              Insta<span className="text-[#ff6600]">Offer</span>
            </div>
          </Link>

          {/* Desktop centre nav — grouped by intent */}
          <div className="hidden md:flex items-center gap-1 flex-1">

            {/* Sell group */}
            <NavDropdown label="Sell My Car" links={sellLinks} pathname={pathname} onClose={() => {}} />

            {/* Divider */}
            <span className="w-px h-4 bg-gray-200 mx-2" />

            {/* Buy group — single link, no dropdown needed */}
            <Link
              href="/cars"
              className={`text-sm font-semibold transition-colors px-2 py-1 rounded-lg ${
                pathname.startsWith('/cars')
                  ? 'text-[#003087] bg-[#003087]/5'
                  : 'text-gray-600 hover:text-[#003087] hover:bg-gray-50'
              }`}
            >
              New Cars
            </Link>

            {/* Divider */}
            <span className="w-px h-4 bg-gray-200 mx-2" />

            {/* Dealers group */}
            <NavDropdown label="For Dealers" links={dealerLinks} pathname={pathname} onClose={() => {}} />
          </div>

          {/* Desktop right — auth */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            {user ? (
              <>
                {/* Shortcut for dealers */}
                {isDealer && (
                  <Link
                    href="/dashboard"
                    className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl transition-colors ${
                      pathname.startsWith('/dashboard')
                        ? 'bg-[#003087]/10 text-[#003087]'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <LayoutDashboard size={15} /> Dashboard
                  </Link>
                )}

                {/* Avatar menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(v => !v)}
                    onBlur={() => setTimeout(() => setUserMenuOpen(false), 150)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 hover:border-[#003087] transition-colors text-sm font-medium"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#003087] text-white flex items-center justify-center text-xs font-black">
                      {(user.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                    </div>
                    <span className="max-w-[80px] truncate">{user.full_name?.split(' ')[0] || 'Account'}</span>
                    <ChevronDown size={13} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-50 mb-1">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{isDealer ? 'Dealer Account' : 'My Account'}</p>
                        <p className="text-sm font-semibold text-gray-800 truncate mt-0.5">{user.full_name || user.email}</p>
                      </div>
                      {isDealer && (
                        <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                          <LayoutDashboard size={14} className="text-[#003087]" /> Dashboard
                        </Link>
                      )}
                      <Link href="/my-offers" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                        <FileText size={14} className="text-[#003087]" /> My Offers
                      </Link>
                      <hr className="my-1.5 border-gray-100" />
                      <button onClick={handleSignOut} className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left rounded-b-2xl">
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold text-gray-600 hover:text-[#003087] px-2 py-2 transition-colors">
                  Sign In
                </Link>
                <Link
                  href="/valuation"
                  className="bg-[#ff6600] hover:bg-[#e05a00] text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Zap size={14} /> Sell My Car
                </Link>
              </>
            )}
          </div>

          {/* Mobile right — CTA + hamburger */}
          <div className="md:hidden flex items-center gap-2">
            {!user && (
              <Link href="/valuation" className="bg-[#ff6600] text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1">
                <Zap size={12} /> Sell
              </Link>
            )}
            <button
              className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => setMobileOpen(v => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        {mobileOpen && (
          <div className="md:hidden pb-5 border-t border-gray-100">

            {/* Sell section */}
            <div className="pt-4 pb-2">
              <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Sell Your Car</p>
              <Link href="/valuation" onClick={closeMobile}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl mx-2 transition-colors ${pathname === '/valuation' ? 'bg-[#003087]/10 text-[#003087]' : 'text-gray-700 hover:bg-gray-50'}`}>
                <Zap size={16} className="text-[#ff6600]" />
                <div>
                  <div className="text-sm font-semibold">Get Instant Offer</div>
                  <div className="text-xs text-gray-400">Free valuation in 60 seconds</div>
                </div>
              </Link>
              <Link href="/how-it-works" onClick={closeMobile}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl mx-2 transition-colors ${pathname === '/how-it-works' ? 'bg-[#003087]/10 text-[#003087]' : 'text-gray-700 hover:bg-gray-50'}`}>
                <Info size={16} className="text-gray-400" />
                <div>
                  <div className="text-sm font-semibold">How It Works</div>
                  <div className="text-xs text-gray-400">Step-by-step seller guide</div>
                </div>
              </Link>
            </div>

            {/* Browse section */}
            <div className="pt-2 pb-2">
              <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Browse</p>
              <Link href="/cars" onClick={closeMobile}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl mx-2 transition-colors ${pathname.startsWith('/cars') ? 'bg-[#003087]/10 text-[#003087]' : 'text-gray-700 hover:bg-gray-50'}`}>
                <Car size={16} className="text-gray-400" />
                <div>
                  <div className="text-sm font-semibold">New Cars</div>
                  <div className="text-xs text-gray-400">Browse new car inventory</div>
                </div>
              </Link>
            </div>

            {/* Dealers section */}
            <div className="pt-2 pb-2">
              <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Dealers</p>
              <Link href="/for-dealers" onClick={closeMobile}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl mx-2 transition-colors ${pathname === '/for-dealers' ? 'bg-[#003087]/10 text-[#003087]' : 'text-gray-700 hover:bg-gray-50'}`}>
                <Building2 size={16} className="text-gray-400" />
                <div>
                  <div className="text-sm font-semibold">For Dealers</div>
                  <div className="text-xs text-gray-400">Grow your acquisition pipeline</div>
                </div>
              </Link>
              {isDealer && (
                <Link href="/dashboard" onClick={closeMobile}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl mx-2 transition-colors ${pathname.startsWith('/dashboard') ? 'bg-[#003087]/10 text-[#003087]' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <LayoutDashboard size={16} className="text-[#003087]" />
                  <div>
                    <div className="text-sm font-semibold">Dealer Dashboard</div>
                    <div className="text-xs text-gray-400">Leads, bids & analytics</div>
                  </div>
                </Link>
              )}
            </div>

            {/* Account section */}
            <div className="border-t border-gray-100 pt-3 mt-2">
              <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Account</p>
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-2 mx-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-[#003087] text-white flex items-center justify-center text-sm font-black flex-shrink-0">
                      {(user.full_name?.[0] || 'U').toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{user.full_name || 'Account'}</p>
                      <p className="text-xs text-gray-400">{isDealer ? 'Dealer' : 'Seller'}</p>
                    </div>
                  </div>
                  <Link href="/my-offers" onClick={closeMobile}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl mx-2 text-gray-700 hover:bg-gray-50 transition-colors">
                    <FileText size={16} className="text-gray-400" />
                    <span className="text-sm font-semibold">My Offers</span>
                  </Link>
                  <button onClick={() => { closeMobile(); handleSignOut(); }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl mx-2 w-[calc(100%-16px)] text-left text-red-600 hover:bg-red-50 transition-colors">
                    <LogOut size={16} />
                    <span className="text-sm font-semibold">Sign Out</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 px-2">
                  <Link href="/login" onClick={closeMobile}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:border-[#003087] hover:text-[#003087] transition-colors">
                    <User size={15} /> Sign In
                  </Link>
                  <Link href="/valuation" onClick={closeMobile}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#ff6600] text-white font-bold text-sm hover:bg-[#e05a00] transition-colors">
                    <Zap size={15} /> Get Instant Offer — Free
                  </Link>
                </div>
              )}
            </div>

          </div>
        )}
      </nav>
    </header>
  );
}
