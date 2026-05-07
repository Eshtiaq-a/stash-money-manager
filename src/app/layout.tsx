import type { Metadata } from "next";
import type { Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });

import Footer from "@/components/Footer";
import { Analytics } from '@vercel/analytics/next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stash-saver.vercel.app";
const appName = "Stash Saver";
const appDescription = "Your Gen-Z personal finance companion. Save smarter, spend wiser, and turn small savings into big wins.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: appName,
  title: {
    template: "%s | Stash Saver",
    default: "Stash Saver — Save Smarter. Spend Wiser.",
  },
  description: appDescription,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: appName,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: appName,
    title: "Stash Saver — Your Money Deserves Better Habits",
    description: appDescription,
    url: siteUrl,
    images: [
      {
        url: "/stash-icon.svg",
        width: 512,
        height: 512,
        alt: "Stash Saver app icon",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Stash Saver — Save Smarter. Spend Wiser.",
    description: appDescription,
    images: ["/stash-icon.svg"],
  },
  icons: {
    icon: "/stash-icon.svg",
    apple: "/stash-icon.svg",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0e17",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col font-sans bg-[#0a0e17] text-[#f1f5f9]">
        {children}
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
