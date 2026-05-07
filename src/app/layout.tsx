import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });

import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    template: "%s | Stash",
    default: "Stash | Smart Student Budgeting",
  },
  description: "Tactical financial awareness for students.",
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
