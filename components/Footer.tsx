import Link from 'next/link';
import { Shield, Phone, Star } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#1a1a1a] text-white mt-auto">
      {/* Trust strip */}
      <div className="bg-[#003087] py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-[#ff6600]" />
            <span>Your phone stays private</span>
          </div>
          <div className="flex items-center gap-2">
            <Star size={16} className="text-[#ff6600]" />
            <span>Non-binding offers</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={16} className="text-[#ff6600]" />
            <span>Trusted by Qatar dealers</span>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="text-2xl font-black mb-3">
              Insta<span className="text-[#ff6600]">Offer</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Qatar&apos;s fastest car selling platform. Get real dealer offers in minutes.
            </p>
          </div>

          {/* Sellers */}
          <div>
            <h4 className="font-bold text-sm mb-4 text-gray-200">For Sellers</h4>
            <ul className="space-y-2">
              <li><Link href="/valuation" className="text-gray-400 text-sm hover:text-white transition-colors">Get Free Valuation</Link></li>
              <li><Link href="/how-it-works" className="text-gray-400 text-sm hover:text-white transition-colors">How It Works</Link></li>
              <li><Link href="/my-offers" className="text-gray-400 text-sm hover:text-white transition-colors">My Offers</Link></li>
            </ul>
          </div>

          {/* Dealers */}
          <div>
            <h4 className="font-bold text-sm mb-4 text-gray-200">For Dealers</h4>
            <ul className="space-y-2">
              <li><Link href="/for-dealers" className="text-gray-400 text-sm hover:text-white transition-colors">Dealer Plans</Link></li>
              <li><Link href="/dashboard" className="text-gray-400 text-sm hover:text-white transition-colors">Dealer Dashboard</Link></li>
              <li><Link href="/login?role=dealer" className="text-gray-400 text-sm hover:text-white transition-colors">Dealer Login</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-sm mb-4 text-gray-200">Company</h4>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-gray-400 text-sm hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-gray-400 text-sm hover:text-white transition-colors">Terms of Use</Link></li>
              <li><Link href="/how-it-works" className="text-gray-400 text-sm hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>

        <hr className="border-gray-700 my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-sm">
          <p>© 2026 InstaOffer Qatar. All rights reserved.</p>
          <p>🇶🇦 Built for Qatar</p>
        </div>
      </div>
    </footer>
  );
}
