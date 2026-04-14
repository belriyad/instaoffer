'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Clock, TrendingUp, ChevronRight, Star, CheckCircle2, Phone, Lock, DollarSign } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

const STEPS = [
  { num: '1', title: 'Enter Car Details', desc: 'Make, model, year, mileage — takes 2 minutes.', icon: '🚗' },
  { num: '2', title: 'See Instant Estimate', desc: 'AI-powered valuation based on real Qatar market data.', icon: '💡' },
  { num: '3', title: 'Request Dealer Offers', desc: 'Verified dealers compete to give you the best price.', icon: '📨' },
  { num: '4', title: 'Compare Offers', desc: 'Side-by-side view. No pressure. No obligation.', icon: '⚖️' },
  { num: '5', title: 'Choose & Close', desc: "Accept the offer that works for you. That's it.", icon: '✅' },
];

const TRUST = [
  { icon: Lock, title: 'Your Number Stays Private', desc: 'Dealers cannot see your phone number unless you personally approve it.' },
  { icon: Shield, title: 'Non-Binding Offers', desc: 'All offers are non-binding. Final deal subject to inspection. Zero pressure.' },
  { icon: Phone, title: "You're in Control", desc: 'Decide who contacts you, when, and how. Reject any offer instantly.' },
  { icon: DollarSign, title: 'Real Market Prices', desc: 'Estimates powered by live Qatar car market data and ML model.' },
];

const MAKES = ['Toyota', 'Nissan', 'Lexus', 'BMW', 'Mercedes', 'Honda', 'Hyundai', 'Kia', 'Ford', 'Chevrolet', 'Land Rover', 'Mitsubishi'];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* ── HERO ── */}
      <section className="bg-gradient-to-br from-[#003087] via-[#00308f] to-[#001a52] text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <motion.div variants={fadeUp}>
                <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                  🇶🇦 Designed for Qatar&apos;s car market
                </span>
              </motion.div>
              <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-black leading-tight mb-5">
                Sell your car<br /><span className="text-[#ff6600]">fast in Qatar</span>
              </motion.h1>
              <motion.p variants={fadeUp} className="text-lg md:text-xl text-blue-100 leading-relaxed mb-8 max-w-xl">
                Get an instant estimate and real dealer offers in minutes. No pressure. No obligation. Your number stays private.
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link href="/valuation" className="flex items-center justify-center gap-2 bg-[#ff6600] hover:bg-[#e05a00] text-white font-bold px-8 py-4 rounded-lg text-lg transition-all transform hover:scale-105 shadow-lg shadow-orange-900/30">
                  Start Free Valuation <ChevronRight size={20} />
                </Link>
                <Link href="/how-it-works" className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all">
                  How It Works
                </Link>
              </motion.div>
              <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
                {['No sign-up to get estimate', 'Phone number stays private', 'Non-binding offers', 'Free to use'].map((t) => (
                  <div key={t} className="flex items-center gap-1.5 text-sm text-blue-200">
                    <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />
                    {t}
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
        <div className="w-full overflow-hidden leading-none">
          <svg viewBox="0 0 1440 48" className="block w-full" preserveAspectRatio="none">
            <path d="M0,48 L0,20 C360,50 1080,-10 1440,20 L1440,48 Z" fill="#f5f7fa" />
          </svg>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="bg-[#f5f7fa] py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {[
              { value: '500+', label: 'Cars Sold' },
              { value: '30+', label: 'Verified Dealers' },
              { value: '< 5 min', label: 'To Get Estimate' },
              { value: '100%', label: 'Free for Sellers' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-black text-[#003087]">{s.value}</div>
                <div className="text-sm text-gray-500 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-12">
            <motion.div variants={fadeUp}>
              <span className="text-[#003087] font-bold text-sm uppercase tracking-widest">Simple Process</span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-black text-gray-900 mt-2">How InstaOffer Works</motion.h2>
            <motion.p variants={fadeUp} className="text-gray-500 mt-3 text-lg max-w-xl mx-auto">From your couch to a sold car — in 5 steps.</motion.p>
          </motion.div>
          <div className="relative">
            <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-0.5 bg-gray-200 z-0" />
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 md:grid-cols-5 gap-6 relative z-10">
              {STEPS.map((step) => (
                <motion.div key={step.num} variants={fadeUp} className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-[#003087] text-white rounded-full flex items-center justify-center text-2xl mb-4 font-black shadow-md">
                    {step.icon}
                  </div>
                  <span className="text-xs font-bold text-[#ff6600] uppercase tracking-wide mb-1">Step {step.num}</span>
                  <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
          <div className="text-center mt-10">
            <Link href="/valuation" className="inline-flex items-center gap-2 bg-[#003087] hover:bg-[#0057b8] text-white font-bold px-8 py-4 rounded-lg text-lg transition-colors">
              Start Now — It&apos;s Free <ChevronRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── TRUST ── */}
      <section className="py-16 md:py-20 bg-[#f5f7fa]">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="text-center mb-12">
              <span className="text-[#003087] font-bold text-sm uppercase tracking-widest">Your Privacy Matters</span>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-2">Built with Trust at the Core</h2>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {TRUST.map((t) => (
                <motion.div key={t.title} variants={fadeUp} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-[#e8f0fd] rounded-xl flex items-center justify-center mb-4">
                    <t.icon size={24} className="text-[#003087]" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{t.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{t.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── POPULAR MAKES ── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">Value Any Car Make</h2>
            <p className="text-gray-500 mt-2">We support all popular makes sold in Qatar</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {MAKES.map((make) => (
              <Link key={make} href={`/valuation?make=${make}`} className="px-5 py-2.5 border border-gray-200 rounded-full text-sm font-semibold text-gray-700 hover:border-[#003087] hover:text-[#003087] hover:bg-[#e8f0fd] transition-all">
                {make}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR DEALERS ── */}
      <section className="py-16 bg-[#003087] text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp}><Star size={32} className="text-[#ff6600] mx-auto mb-4" /></motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-black mb-4">Are You a Car Dealer?</motion.h2>
            <motion.p variants={fadeUp} className="text-blue-200 text-lg mb-8 max-w-xl mx-auto">
              Access unlimited leads, send offers to motivated sellers, and grow your business. Only <strong className="text-white">1,000 QAR / month</strong>.
            </motion.p>
            <motion.div variants={fadeUp}>
              <Link href="/for-dealers" className="inline-flex items-center gap-2 bg-[#ff6600] hover:bg-[#e05a00] text-white font-bold px-8 py-4 rounded-lg text-lg transition-all">
                Learn More for Dealers <ChevronRight size={20} />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-16 bg-white">
        <div className="max-w-xl mx-auto px-4 text-center">
          <Clock size={40} className="text-[#003087] mx-auto mb-4" />
          <h2 className="text-3xl font-black text-gray-900 mb-3">Ready to sell your car?</h2>
          <p className="text-gray-500 mb-8">It takes less than 5 minutes. No sign-up required to get your estimate.</p>
          <Link href="/valuation" className="inline-flex items-center gap-2 bg-[#ff6600] hover:bg-[#e05a00] text-white font-bold px-10 py-4 rounded-lg text-lg transition-all shadow-lg shadow-orange-100">
            Get My Free Valuation <ChevronRight size={20} />
          </Link>
          <div className="mt-4 flex justify-center gap-6">
            {['No sign-up needed', 'Free forever for sellers'].map((t) => (
              <div key={t} className="flex items-center gap-1.5 text-sm text-gray-400">
                <TrendingUp size={14} className="text-green-500" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}