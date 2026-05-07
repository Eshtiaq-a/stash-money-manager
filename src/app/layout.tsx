import type { Metadata } from "next";
import type { Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });

import Footer from "@/components/Footer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stash-saver.vercel.app";
const appName = "Stash";
const appDescription = "Tactical financial awareness for students.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: appName,
  title: {
    template: "%s | Stash",
    default: "Stash | Smart Student Budgeting",
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
    title: "Stash | Smart Student Budgeting",
    description: appDescription,
    url: siteUrl,
    images: [
      {
        url: "/stash-icon.svg",
        width: 512,
        height: 512,
        alt: "Stash app icon",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Stash | Smart Student Budgeting",
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
  themeColor: "#16a34a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col font-sans bg-[#0d1117] text-[#e0e0f8]">
        {children}
        <Footer />
      </body>
    </html>
  );
}
