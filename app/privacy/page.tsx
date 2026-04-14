import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Privacy Policy — InstaOffer',
  description: 'How InstaOffer collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          <Link href="/" className="text-sm text-[#003087] hover:underline mb-6 inline-block">
            ← Back to home
          </Link>

          <h1 className="text-3xl font-black text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-400 mb-8">Last updated: April 2026</p>

          <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. Who we are</h2>
              <p>
                InstaOffer is a car-selling platform operated in Qatar that connects vehicle sellers with
                licensed car dealers. We are committed to protecting your personal data in compliance with
                applicable Qatar data protection principles.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. Information we collect</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Account data:</strong> name, email address, and optional phone number when you register.</li>
                <li><strong>Vehicle data:</strong> make, model, year, mileage, condition, photos, and documents you upload.</li>
                <li><strong>Usage data:</strong> pages visited, valuation queries, offer interactions, and device type.</li>
                <li><strong>Communication data:</strong> messages exchanged between you and dealers on our platform.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. How we use your information</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>To provide instant car valuations via our ML model.</li>
                <li>To connect sellers with interested dealers.</li>
                <li>To send notifications about offers and messages.</li>
                <li>To improve our platform and detect fraud.</li>
                <li>To comply with applicable laws and regulations.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. Phone number privacy</h2>
              <p>
                Your phone number is <strong>never shared with dealers automatically</strong>. A dealer must
                explicitly request access to your phone number, and you must approve the request before any
                sharing occurs. You can decline any such request. All approvals are logged.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">5. Data sharing</h2>
              <p>We do not sell your personal data. We may share data with:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Licensed dealers — only the information you have approved for sharing.</li>
                <li>Service providers — hosting, analytics, and infrastructure partners under strict data processing agreements.</li>
                <li>Authorities — if required by Qatari law or court order.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">6. Data retention</h2>
              <p>
                We retain your account and offer data for as long as your account is active or as needed to
                provide services. You may request deletion of your account and associated data at any time
                by contacting us.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">7. Security</h2>
              <p>
                All data is transmitted over HTTPS. Passwords are hashed and never stored in plain text.
                Access to personal data is restricted to authorised personnel only.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">8. Your rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Access the personal data we hold about you.</li>
                <li>Correct inaccurate information.</li>
                <li>Request deletion of your data.</li>
                <li>Withdraw consent for phone number sharing at any time.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">9. Contact us</h2>
              <p>
                For privacy questions or data requests, please contact:{' '}
                <a href="mailto:privacy@instaoffer.qa" className="text-[#003087] hover:underline">
                  privacy@instaoffer.qa
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
