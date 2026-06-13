'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Clock, TrendingUp, ChevronRight, CheckCircle2, Phone, Lock, DollarSign, Zap } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLocale } from '@/lib/locale-context';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

// Start reveal animations ~200px before a section scrolls into view so content
// is already settled by the time the user reaches it — avoids blank gaps and
// half-rendered sections during fast scrolling.
const VIEWPORT = { once: true, margin: '0px 0px 200px 0px' };

const STEPS = [
  { num: '1', title: 'Enter Car Details', desc: 'Make, model, year, mileage — takes 2 minutes.', icon: '🚗' },
  { num: '2', title: 'Get 3 Valuations', desc: 'Private sale estimate, trade-in value, and instant offer — all in one result.', icon: '💡' },
  { num: '3', title: 'Request Dealer Offers', desc: 'Create a free account and let verified dealers compete for your car.', icon: '📨' },
  { num: '4', title: 'Compare Offers', desc: 'Side-by-side view. No pressure. No obligation.', icon: '⚖️' },
  { num: '5', title: 'Choose & Close', desc: "Accept the offer that works for you. That's it.", icon: '✅' },
];

const MAKES = ['Toyota', 'Nissan', 'Lexus', 'BMW', 'Mercedes', 'Honda', 'Hyundai', 'Kia', 'Ford', 'Chevrolet', 'Land Rover', 'Mitsubishi'];

export default function Home() {
  const { t, isRTL, locale } = useLocale();

  // Keep the "as of <month year>" stamp current instead of a hard-coded date.
  const asOfDate = new Date().toLocaleDateString(locale === 'ar' ? 'ar' : 'en-US', {
    month: 'long',
    year: 'numeric',
  });

  const INTENT_CARDS_T = [
    { icon: '💡', key: 'value',  href: '/valuation',   accent: 'border-blue-200 hover:border-[#002b5b]',                                textAccent: 'text-[#002b5b]' },
    { icon: '⚡', key: 'urgent', href: '/urgent-sale',  accent: 'border-orange-300 hover:border-[#005ca9] bg-gradient-to-br from-orange-50 to-white', textAccent: 'text-[#005ca9]', highlight: true },
    { icon: '🔄', key: 'trade',  href: '/trade-in',    accent: 'border-green-200 hover:border-green-500',                               textAccent: 'text-green-700' },
    { icon: '🔍', key: 'buy',    href: '/buy-request', accent: 'border-purple-200 hover:border-purple-500',                             textAccent: 'text-purple-700' },
  ] as const;

  const TRUST_ICONS = [Lock, Shield, Phone, DollarSign];

  return (
    <div className={`flex flex-col min-h-screen${isRTL ? ' font-[system-ui]' : ''}`}>
      <Navbar />

      {/* ── HERO ── */}
      <section className="bg-gradient-to-br from-[#002b5b] via-[#00308f] to-[#001a3d] text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <motion.div initial={false} animate="visible" variants={stagger} className="text-center mb-12">
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                {t.hero.badge}
              </span>
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-4xl md:text-5xl font-black leading-tight mb-4">
              {t.hero.h1.split('\n').map((line, i) => (
                <span key={i}>{line}{i === 0 && <br className="hidden sm:block" />}</span>
              ))}
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg text-blue-200 max-w-xl mx-auto mb-8">
              {t.hero.sub}
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
              <Link
                href="/urgent-sale"
                className="inline-flex items-center gap-2 bg-[#005ca9] hover:bg-[#004a87] text-white font-black px-8 py-4 rounded-xl text-lg shadow-lg transition-all hover:scale-105"
              >
                <Zap size={20} /> {t.hero.ctaSell}
              </Link>
              <Link
                href="/valuation"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-6 py-4 rounded-xl text-base transition-all"
              >
                {t.hero.ctaValuation}
              </Link>
            </motion.div>
          </motion.div>

          {/* Other options */}
          <p className="text-center text-blue-300 text-sm mb-4 font-medium">{t.hero.orChoose}</p>
          <motion.div
            initial={false}
            animate="visible"
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto"
          >
            {INTENT_CARDS_T.map((card) => {
              const item = t.intent[card.key];
              return (
                <motion.div key={card.href} variants={fadeUp}>
                  <Link
                    href={card.href}
                    className={`flex flex-col h-full bg-white rounded-2xl border-2 p-6 shadow-sm hover:shadow-lg transition-all group ${card.accent} ${'highlight' in card && card.highlight ? 'ring-2 ring-[#005ca9]/40' : ''}`}
                  >
                    <span className="text-4xl mb-3">{card.icon}</span>
                    <h2 className={`font-black text-lg mb-2 transition-colors ${'highlight' in card && card.highlight ? card.textAccent : 'text-gray-900'}`}>
                      {item.label}
                      {'badge' in item && item.badge && (
                        <span className="ms-2 text-xs font-bold bg-[#005ca9] text-white px-2 py-0.5 rounded-full align-middle">{item.badge}</span>
                      )}
                    </h2>
                    <p className="text-sm text-gray-500 flex-1 leading-relaxed">{item.desc}</p>
                    <div className={`mt-4 flex items-center gap-1 text-sm font-semibold ${card.textAccent}`}>
                      {t.hero.getStarted} <ChevronRight size={16} />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div initial={false} animate="visible" variants={fadeUp} className="flex flex-wrap justify-center gap-4 mt-10">
            {[t.trust.noSignup, t.trust.phonePrivate, t.trust.nonBinding, t.trust.free].map((label) => (
              <div key={label} className="flex items-center gap-1.5 text-sm text-blue-200">
                <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />
                {label}
              </div>
            ))}
          </motion.div>
        </div>
        <div className="w-full overflow-hidden leading-none">
          <svg viewBox="0 0 1440 48" className="block w-full" preserveAspectRatio="none">
            <path d="M0,48 L0,20 C360,50 1080,-10 1440,20 L1440,48 Z" fill="#f8fafc" />
          </svg>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="bg-[#f8fafc] py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {[
              { value: '500+', label: t.proof.carsSold },
              { value: '30+',  label: t.proof.dealers },
              { value: '< 5 min', label: t.proof.speed },
              { value: '100%', label: t.proof.free },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-black text-[#002b5b]">{s.value}</div>
                <div className="text-sm text-gray-500 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">{t.proof.asOf} {asOfDate}</p>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div initial={false} whileInView="visible" viewport={VIEWPORT} variants={stagger} className="text-center mb-12">
            <motion.div variants={fadeUp}>
              <span className="text-[#002b5b] font-bold text-sm uppercase tracking-widest">{t.how.eyebrow}</span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-black text-gray-900 mt-2">{t.how.h2}</motion.h2>
            <motion.p variants={fadeUp} className="text-gray-500 mt-3 text-lg max-w-xl mx-auto">{t.how.sub}</motion.p>
          </motion.div>
          <div className="relative">
            <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-0.5 bg-gray-200 z-0" />
            <motion.div initial={false} whileInView="visible" viewport={VIEWPORT} variants={stagger} className="grid grid-cols-1 md:grid-cols-5 gap-6 relative z-10">
              {STEPS.map((step, i) => (
                <motion.div key={step.num} variants={fadeUp} className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-[#002b5b] text-white rounded-full flex items-center justify-center text-2xl mb-4 font-black shadow-md">
                    {step.icon}
                  </div>
                  <span className="text-xs font-bold text-[#005ca9] uppercase tracking-wide mb-1">{t.how.step} {step.num}</span>
                  <h3 className="font-bold text-gray-900 mb-2">{t.how.steps[i].title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{t.how.steps[i].desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
          <div className="text-center mt-10">
            <Link href="/valuation" className="inline-flex items-center gap-2 bg-[#002b5b] hover:bg-[#1a7fd4] text-white font-bold px-8 py-4 rounded-lg text-lg transition-colors">
              Start Now — It&apos;s Free <ChevronRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── TRUST ── */}
      <section className="py-16 md:py-20 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div initial={false} whileInView="visible" viewport={VIEWPORT} variants={stagger}>
            <motion.div variants={fadeUp} className="text-center mb-12">
              <span className="text-[#002b5b] font-bold text-sm uppercase tracking-widest">{t.trustSection.eyebrow}</span>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-2">{t.trustSection.h2}</h2>
              <p className="text-gray-500 mt-3 text-lg max-w-xl mx-auto">{t.trustSection.sub}</p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {t.trustSection.items.map((item, i) => {
                const Icon = TRUST_ICONS[i];
                return (
                  <motion.div key={item.title} variants={fadeUp} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-[#ebf5ff] rounded-xl flex items-center justify-center mb-4">
                      <Icon size={24} className="text-[#002b5b]" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                  </motion.div>
                );
              })}
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
              <Link key={make} href={`/valuation?make=${make}`} className="px-5 py-2.5 border border-gray-200 rounded-full text-sm font-semibold text-gray-700 hover:border-[#002b5b] hover:text-[#002b5b] hover:bg-[#ebf5ff] transition-all">
                {make}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-16 bg-white">
        <div className="max-w-xl mx-auto px-4 text-center">
          <Clock size={40} className="text-[#002b5b] mx-auto mb-4" />
          <h2 className="text-3xl font-black text-gray-900 mb-3">{t.hero.finalCtaH2}</h2>
          <p className="text-gray-500 mb-8">{t.hero.finalCtaSub}</p>
          <Link href="/valuation" className="inline-flex items-center gap-2 bg-[#005ca9] hover:bg-[#004a87] text-white font-bold px-10 py-4 rounded-lg text-lg transition-all shadow-lg shadow-orange-100">
            {t.hero.finalCtaBtn} <ChevronRight size={20} />
          </Link>
          <div className="mt-4 flex justify-center gap-6">
            {[t.trust.noSignup, t.trust.free].map((label) => (
              <div key={label} className="flex items-center gap-1.5 text-sm text-gray-400">
                <TrendingUp size={14} className="text-green-500" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}