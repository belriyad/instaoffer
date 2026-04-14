'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, Check, Filter, MessageSquare, Bell, Star, Users, TrendingUp } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const FEATURES = [
  { icon: Users, title: 'Unlimited Leads', desc: 'Access all seller requests with no cap on how many you can view or respond to.' },
  { icon: MessageSquare, title: 'Direct Messaging', desc: 'Communicate directly with sellers through our secure in-platform messaging system.' },
  { icon: Filter, title: 'Smart Filters', desc: 'Save filters by make, year, mileage, city, and condition. See matching lead counts in real-time.' },
  { icon: Bell, title: 'Lead Notifications', desc: 'Get notified via push or WhatsApp when a new listing matches your saved filter preferences.' },
  { icon: Star, title: 'Offer Pipeline', desc: 'Track all your bids, accepted deals, and ongoing negotiations in one place.' },
  { icon: TrendingUp, title: 'Market Insights', desc: 'See market comparables for each lead to help you make competitive, data-driven offers.' },
];

export default function ForDealersPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#003087] to-[#001a52] text-white py-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.span variants={fadeUp} className="inline-block bg-[#ff6600] text-white text-xs font-bold px-3 py-1.5 rounded-full mb-6">
              For Car Dealers in Qatar
            </motion.span>
            <motion.h1 variants={fadeUp} className="text-4xl md:text-5xl font-black mb-4 leading-tight">
              Access Motivated Sellers.<br />Grow Your Business.
            </motion.h1>
            <motion.p variants={fadeUp} className="text-blue-200 text-lg max-w-xl mx-auto mb-8">
              Connect with people actively trying to sell their cars. Unlimited leads, direct messaging, and smart tools — all for 1,000 QAR/month.
            </motion.p>
            <motion.div variants={fadeUp}>
              <Link href="/login?role=dealer" className="inline-flex items-center gap-2 bg-[#ff6600] hover:bg-[#e05a00] text-white font-bold px-8 py-4 rounded-xl text-lg transition-all">
                Apply as a Dealer <ChevronRight size={20} />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-[#f5f7fa]">
        <div className="max-w-xl mx-auto px-4 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-3xl font-black text-gray-900 mb-4">Simple Pricing</motion.h2>
            <motion.div variants={fadeUp} className="bg-white rounded-2xl border-2 border-[#003087] p-8 shadow-lg">
              <div className="text-5xl font-black text-[#003087] mb-1">1,000 QAR</div>
              <div className="text-gray-500 mb-6">per month · cancel anytime</div>
              <ul className="space-y-3 text-left mb-8">
                {[
                  'Unlimited access to all seller leads',
                  'Send unlimited offers',
                  'Direct messaging with sellers',
                  'Request phone number access',
                  'Save custom filters',
                  'Push & WhatsApp notifications',
                  'Offer pipeline dashboard',
                  'Admin-verified badge',
                ].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <Check size={16} className="text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/login?role=dealer" className="flex items-center justify-center gap-2 w-full bg-[#003087] hover:bg-[#0057b8] text-white font-bold py-4 rounded-xl text-lg transition-all">
                Get Started Today <ChevronRight size={20} />
              </Link>
              <p className="text-xs text-gray-400 mt-3">Requires admin approval. Verification takes up to 24 hours.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900">Everything Dealers Need</h2>
          </div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <motion.div key={f.title} variants={fadeUp} className="bg-[#f5f7fa] rounded-2xl p-6 border border-gray-100">
                <div className="w-11 h-11 bg-[#003087] rounded-xl flex items-center justify-center mb-4">
                  <f.icon size={20} className="text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works for dealers */}
      <section className="py-16 bg-[#f5f7fa]">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900">How the Dealer Flow Works</h2>
          </div>
          {[
            { num: '1', title: 'Apply & Get Verified', desc: 'Submit your dealer application with business details. Admin reviews and approves within 24 hours.' },
            { num: '2', title: 'Set Your Preferences', desc: 'Tell us what makes, years, mileage ranges, and cities you deal in. We\'ll notify you when matching leads arrive.' },
            { num: '3', title: 'Browse Leads & Send Offers', desc: 'View all open seller requests and send competitive offers directly. Add a personal message to stand out.' },
            { num: '4', title: 'Chat & Close the Deal', desc: 'Message sellers, request phone access if needed (seller approves), and arrange inspection to finalize the deal.' },
          ].map(step => (
            <div key={step.num} className="flex gap-4 mb-8">
              <div className="w-10 h-10 bg-[#ff6600] text-white rounded-full flex items-center justify-center font-black flex-shrink-0">
                {step.num}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">{step.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#003087] text-white text-center">
        <h2 className="text-3xl font-black mb-4">Ready to access Qatar&apos;s best car leads?</h2>
        <p className="text-blue-200 mb-8 max-w-md mx-auto">Join verified dealers on InstaOffer and start receiving high-quality seller leads today.</p>
        <Link href="/login?role=dealer" className="inline-flex items-center gap-2 bg-[#ff6600] hover:bg-[#e05a00] text-white font-bold px-8 py-4 rounded-xl text-lg transition-all">
          Apply as a Dealer <ChevronRight size={20} />
        </Link>
      </section>

      <Footer />
    </div>
  );
}
