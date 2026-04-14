'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, Shield, Lock, DollarSign, Clock, Star, Check } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="bg-[#003087] text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.h1 variants={fadeUp} className="text-4xl md:text-5xl font-black mb-4">How InstaOffer Works</motion.h1>
            <motion.p variants={fadeUp} className="text-blue-200 text-lg">Simple, transparent, and designed around your privacy.</motion.p>
          </motion.div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          {[
            {
              num: '01', icon: '🚗', title: 'Enter Your Car Details',
              desc: 'No sign-up required. Select your make, model, year, and mileage. Add optional details like trim and fuel type to improve accuracy. Takes about 2 minutes.',
              note: 'Guest mode — no account needed',
            },
            {
              num: '02', icon: '💡', title: 'Get an Instant AI Estimate',
              desc: 'Our LightGBM ML model, trained on thousands of real Qatar car sales, gives you a realistic price range based on current market conditions.',
              note: 'Powered by real Qatar market data',
            },
            {
              num: '03', icon: '🔐', title: 'Sign Up & Request Offers',
              desc: 'When you\'re ready to sell, create a free account and submit your request to the dealer network. Your phone number is hidden by default.',
              note: 'Your number is never shown automatically',
            },
            {
              num: '04', icon: '📨', title: 'Dealers Send You Offers',
              desc: 'Verified subscribed dealers review your listing and send competitive offers. You compare them all in one place, with no pressure to accept anything.',
              note: 'All offers are non-binding',
            },
            {
              num: '05', icon: '✅', title: 'Accept the Best Offer',
              desc: 'Choose the offer that works for you. Accept, message the dealer, or reject — it\'s your call. The dealer then arranges inspection and finalizes the deal.',
              note: 'You stay in full control',
            },
          ].map((step, i) => (
            <motion.div
              key={step.num}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className={`flex gap-6 mb-12 ${i % 2 === 0 ? '' : ''}`}
            >
              <div className="flex-shrink-0 w-16 h-16 bg-[#003087] text-white rounded-2xl flex items-center justify-center text-3xl shadow-md">
                {step.icon}
              </div>
              <div>
                <span className="text-xs font-bold text-[#ff6600] uppercase tracking-widest">Step {step.num}</span>
                <h3 className="text-xl font-black text-gray-900 mt-1 mb-2">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed mb-3">{step.desc}</p>
                <div className="flex items-center gap-1.5 text-sm text-[#003087] font-semibold bg-[#e8f0fd] px-3 py-1.5 rounded-full w-fit">
                  <Check size={14} /> {step.note}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Privacy deep dive */}
      <section className="py-16 bg-[#f5f7fa]">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-10">
            <Lock size={36} className="text-[#003087] mx-auto mb-4" />
            <h2 className="text-3xl font-black text-gray-900">Your Privacy, Explained</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: 'Can dealers see my phone number?', a: 'No. Your phone number is hidden by default. A dealer must click "Request Phone Number" and you must approve it before they can see it. You can reject any request.' },
              { q: 'Are the offers legally binding?', a: 'No. All offers from dealers are non-binding and subject to physical inspection. You are not obligated to sell even after accepting an offer.' },
              { q: 'Do I need to sign up to get a valuation?', a: 'No. You can get an instant AI-powered estimate with no account. You only need to sign up when you\'re ready to receive real dealer offers.' },
              { q: 'How do I know the dealers are legitimate?', a: 'All dealers on InstaOffer are manually verified and must hold an active subscription (1,000 QAR/month) to place offers. Admin reviews all dealer applications.' },
              { q: 'Can I cancel my request?', a: 'Yes. You can cancel your offer request at any time from your dashboard before accepting an offer.' },
            ].map(({ q, a }) => (
              <div key={q} className="bg-white rounded-2xl border border-gray-100 p-5">
                <h4 className="font-bold text-gray-900 mb-2">{q}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white text-center">
        <Clock size={36} className="text-[#003087] mx-auto mb-4" />
        <h2 className="text-2xl font-black text-gray-900 mb-2">Ready to get started?</h2>
        <p className="text-gray-500 mb-6">No sign-up needed for your first estimate.</p>
        <Link href="/valuation" className="inline-flex items-center gap-2 bg-[#ff6600] hover:bg-[#e05a00] text-white font-bold px-8 py-4 rounded-xl text-lg transition-all">
          Start Free Valuation <ChevronRight size={20} />
        </Link>
      </section>

      <Footer />
    </div>
  );
}
