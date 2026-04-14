import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

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
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
