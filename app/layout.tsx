import type { Metadata } from "next";
import { Sora, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { LocaleProvider } from "@/lib/locale-context";
import { Analytics } from "@vercel/analytics/next";
import AnalyticsInstrumentation from "@/components/AnalyticsInstrumentation";
import WhatsAppFAB from "@/components/WhatsAppFAB";

// KBB design-system typography
const sora = Sora({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--ff-display",
  display: "swap",
});
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--ff-body",
  display: "swap",
});
const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--ff-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "InstaOffer – Sell Your Car Fast in Qatar",
  description: "Get an instant car valuation and real dealer offers in minutes. No pressure. No obligation.",
  keywords: "sell car Qatar, car valuation Qatar, instant car offer, used cars Doha",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${sora.variable} ${dmSans.variable} ${dmMono.variable}`}>
      <body className="min-h-full flex flex-col bg-white text-gray-900 font-sans">
        <AuthProvider>
          <LocaleProvider>
            <AnalyticsInstrumentation />
            {children}
            <WhatsAppFAB />
          </LocaleProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
