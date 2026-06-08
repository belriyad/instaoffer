'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, Check, Filter, MessageSquare, Bell, Star, Users, TrendingUp, X, RefreshCw, ShoppingCart } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { waLink } from '@/lib/utils';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const FEATURES = [
  { icon: Users, title: 'Unlimited Seller Requests', desc: 'Access all active seller requests with no cap on how many you can view or respond to.' },
  { icon: MessageSquare, title: 'Direct Messaging', desc: 'Communicate directly with sellers through our secure in-platform messaging system.' },
  { icon: Filter, title: 'Smart Filters', desc: 'Save filters by make, year, mileage, city, and condition. See matching request counts in real-time.' },
  { icon: Bell, title: 'Lead Notifications', desc: 'Get notified via push or WhatsApp when a new listing matches your saved filter preferences.' },
  { icon: Star, title: 'Offer Pipeline', desc: 'Track all your bids, accepted deals, and ongoing negotiations in one place.' },
  { icon: TrendingUp, title: 'Market Insights', desc: 'See market comparables for each lead to help you make competitive, data-driven offers.' },
];

const PLANS = [
  {
    name: 'Free Trial',
    price: '0',
    period: '30 days',
    desc: 'Try everything free — no credit card needed.',
    cta: 'Start Free Trial',
    href: '/dealer-signup',
    highlight: false,
    features: [
      'Up to 10 leads/month',
      'Send 5 offers',
      'Direct messaging',
      'Basic filters',
      'Dashboard access',
    ],
    missing: ['WhatsApp notifications', 'Urgent seller alerts', 'Market insights', 'Admin-verified badge'],
  },
  {
    name: 'Pro',
    price: '499',
    period: 'per month',
    desc: 'For active dealers who want every edge.',
    cta: 'Start Free Trial →',
    href: '/dealer-signup',
    highlight: true,
    features: [
      'Unlimited seller requests',
      'Unlimited offers',
      'Direct messaging',
      'Advanced filters',
      'WhatsApp notifications',
      'Urgent seller alerts',
      'Market insights & margin view',
      'Admin-verified badge',
      'Offer pipeline dashboard',
    ],
    missing: [],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact us',
    desc: 'For dealer groups and large operations.',
    cta: 'Contact Us',
    href: waLink("Hi, I'm interested in InstaOffer Enterprise for dealers"),
    highlight: false,
    features: [
      'Everything in Pro',
      'Multi-user access',
      'Dedicated account manager',
      'Custom reporting',
      'API access',
      'Priority support',
    ],
    missing: [],
  },
];

const COMPARISON = [
  { feature: 'Qualified seller leads', instaOffer: true, mzad: false, olx: false, cold: false },
  { feature: 'Trade-in acquisition leads', instaOffer: true, mzad: false, olx: false, cold: false },
  { feature: 'Buyer request (demand signals)', instaOffer: true, mzad: false, olx: false, cold: false },
  { feature: 'Real-time WhatsApp alerts', instaOffer: true, mzad: false, olx: false, cold: false },
  { feature: 'Margin visibility per lead', instaOffer: true, mzad: false, olx: false, cold: false },
  { feature: 'Seller contact (on approval)', instaOffer: true, mzad: true, olx: true, cold: true },
  { feature: 'Motivated / urgent sellers', instaOffer: true, mzad: false, olx: false, cold: false },
  { feature: 'No cold calling needed', instaOffer: true, mzad: false, olx: false, cold: false },
  { feature: 'Fixed monthly cost', instaOffer: true, mzad: false, olx: false, cold: false },
];

export default function ForDealersPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#002b5b] to-[#001a3d] text-white py-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.span variants={fadeUp} className="inline-block bg-[#005ca9] text-white text-xs font-bold px-3 py-1.5 rounded-full mb-6">
              For Car Dealers in Qatar
            </motion.span>
            <motion.h1 variants={fadeUp} className="text-4xl md:text-5xl font-black mb-4 leading-tight">
              Access Motivated Sellers.<br />Grow Your Business.
            </motion.h1>
            <motion.p variants={fadeUp} className="text-blue-200 text-lg max-w-xl mx-auto mb-8">
              Connect with people actively trying to sell their cars. Unlimited seller requests, direct messaging, and smart tools — start free for 30 days.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/dealer-signup" className="inline-flex items-center gap-2 bg-[#005ca9] hover:bg-[#004a87] text-white font-bold px-8 py-4 rounded-xl text-lg transition-all">
                Start Free 30-Day Trial <ChevronRight size={20} />
              </Link>
              <a href={waLink("Hi, I'm interested in becoming an InstaOffer dealer")} target="_blank" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-6 py-4 rounded-xl text-base transition-all">
                💬 Chat on WhatsApp
              </a>
            </motion.div>
            <motion.p variants={fadeUp} className="text-blue-300 text-sm mt-4">No credit card required · Approval within 24 hours</motion.p>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-12">
            <motion.h2 variants={fadeUp} className="text-3xl font-black text-gray-900 mb-3">Simple, Transparent Pricing</motion.h2>
            <motion.p variants={fadeUp} className="text-gray-500 text-lg">Start free — upgrade when you&apos;re ready.</motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map(plan => (
              <motion.div
                key={plan.name}
                variants={fadeUp}
                className={`rounded-2xl border-2 p-7 flex flex-col relative ${plan.highlight ? 'border-[#002b5b] shadow-xl' : 'border-gray-200'}`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#002b5b] text-white text-xs font-bold px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <div className="mb-5">
                  <h3 className="font-black text-lg text-gray-900 mb-1">{plan.name}</h3>
                  <div className="flex items-end gap-1 mb-1">
                    {plan.price === 'Custom' ? (
                      <span className="text-3xl font-black text-[#002b5b]">Custom</span>
                    ) : (
                      <>
                        <span className="text-3xl font-black text-[#002b5b]">{plan.price}</span>
                        <span className="text-gray-500 text-sm pb-1">QAR / {plan.period}</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{plan.desc}</p>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check size={15} className="text-green-500 flex-shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                  {plan.missing.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-400">
                      <X size={15} className="text-gray-300 flex-shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  target={plan.href.startsWith('http') ? '_blank' : undefined}
                  className={`flex items-center justify-center gap-2 w-full font-bold py-3.5 rounded-xl text-sm transition-all ${
                    plan.highlight
                      ? 'bg-[#002b5b] hover:bg-[#1a7fd4] text-white'
                      : 'border border-gray-200 hover:border-[#002b5b] text-gray-700 hover:text-[#002b5b]'
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-16 bg-[#f8fafc]">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-3xl font-black text-gray-900 text-center mb-10">
              Why InstaOffer Beats the Alternatives
            </motion.h2>
            <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#002b5b] text-white">
                    <th className="text-left px-5 py-4 font-semibold w-1/2">Feature</th>
                    <th className="px-4 py-4 font-bold">InstaOffer</th>
                    <th className="px-4 py-4 font-semibold text-blue-200">Mzad Qatar</th>
                    <th className="px-4 py-4 font-semibold text-blue-200">OLX</th>
                    <th className="px-4 py-4 font-semibold text-blue-200">Cold Calling</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, i) => (
                    <tr key={row.feature} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-5 py-3.5 text-gray-700 font-medium">{row.feature}</td>
                      {[row.instaOffer, row.mzad, row.olx, row.cold].map((val, j) => (
                        <td key={j} className="px-4 py-3.5 text-center">
                          {val
                            ? <Check size={16} className="inline text-green-500" />
                            : <X size={16} className="inline text-gray-300" />}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
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
              <motion.div key={f.title} variants={fadeUp} className="bg-[#f8fafc] rounded-2xl p-6 border border-gray-100">
                <div className="w-11 h-11 bg-[#002b5b] rounded-xl flex items-center justify-center mb-4">
                  <f.icon size={20} className="text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Lead Types */}
      <section className="py-16 bg-[#f8fafc]">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="text-center mb-12">
              <h2 className="text-3xl font-black text-gray-900 mb-3">5 Lead Types — All in One Platform</h2>
              <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                Every lead is routed into a typed queue so you always know who you&apos;re dealing with.
              </p>
            </motion.div>
            <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  icon: '⚡',
                  title: 'Urgent Sellers',
                  desc: 'Motivated sellers who need to close in 24–72 hours. Include evidence packages: photos, VIN, inspection reports, and accident history.',
                  badge: 'High conversion',
                  badgeColor: 'bg-orange-100 text-orange-700',
                },
                {
                  icon: '🔄',
                  title: 'Trade-In Leads',
                  desc: 'Buyers who want to upgrade and sell their current car as part of the same transaction. Separate queue — never mixed with normal sellers.',
                  badge: 'Exclusive queue',
                  badgeColor: 'bg-blue-100 text-blue-700',
                },
                {
                  icon: '🔍',
                  title: 'Buyer Requests',
                  desc: 'Inbound demand signals — buyers who specified exactly the car they want (make, model, budget, timeline). Be first to match their request.',
                  badge: 'New lead type',
                  badgeColor: 'bg-purple-100 text-purple-700',
                },
                {
                  icon: '📋',
                  title: 'Seller Leads',
                  desc: 'Standard private sellers who want dealer offers on their car. Valuation-backed, with market comps and ML price estimates attached.',
                  badge: 'Highest volume',
                  badgeColor: 'bg-green-100 text-green-700',
                },
                {
                  icon: '💬',
                  title: 'Direct Inquiries',
                  desc: 'Buyers browsing your listed inventory who hit "Contact dealer." Hot intent — they came to you.',
                  badge: 'Warm inbound',
                  badgeColor: 'bg-yellow-100 text-yellow-700',
                },
              ].map(lt => (
                <motion.div key={lt.title} variants={fadeUp} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="text-3xl mb-3">{lt.icon}</div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-gray-900">{lt.title}</h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${lt.badgeColor}`}>{lt.badge}</span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{lt.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How it works for dealers */}
      <section className="py-16 bg-[#f8fafc]">
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
              <div className="w-10 h-10 bg-[#005ca9] text-white rounded-full flex items-center justify-center font-black flex-shrink-0">
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
      <section className="py-16 bg-[#002b5b] text-white text-center">
        <h2 className="text-3xl font-black mb-4">Start acquiring smarter today</h2>
        <p className="text-blue-200 mb-8 max-w-md mx-auto">Join 30+ verified Qatar dealers already using InstaOffer. First 30 days free.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/dealer-signup" className="inline-flex items-center gap-2 bg-[#005ca9] hover:bg-[#004a87] text-white font-bold px-8 py-4 rounded-xl text-lg transition-all">
            Start Free 30-Day Trial <ChevronRight size={20} />
          </Link>
          <a href={waLink("Hi, I'm interested in becoming an InstaOffer dealer")} target="_blank" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-6 py-4 rounded-xl transition-all">
            💬 Chat on WhatsApp first
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
