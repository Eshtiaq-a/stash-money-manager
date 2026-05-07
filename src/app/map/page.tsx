"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Dynamically import the map component to avoid SSR window errors
const MapComponent = dynamic(() => import("./MapComponent"), { 
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium">Loading Tactical Map...</div>
});

export default function MapPage() {
  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col font-sans">
      <nav className="w-full px-6 py-4 border-b border-gray-800 bg-[#161b22] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center font-bold text-white text-xl">
              S
            </div>
            <span className="font-bold text-xl tracking-wide text-white">
              Tactical Map
            </span>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="w-full max-w-6xl h-[70vh] bg-[#161b22] border-2 border-red-500/30 rounded-3xl overflow-hidden shadow-2xl relative">
           <MapComponent />
        </div>
        <p className="text-gray-400 mt-6 text-sm text-center max-w-2xl">
          This map shows your live GPS location (blue marker) and saved High Expense Zones (red circles). 
          If you approach a red zone while low on funds, Stash will automatically warn you.
        </p>
      </main>
    </div>
  );
}
