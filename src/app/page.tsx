"use client";

import { motion } from "framer-motion";
import { Wallet, Shield, PieChart, Target, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 font-sans selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="w-full px-6 py-4 border-b border-gray-800 bg-[#0d1117]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-white text-xl">
              S
            </div>
            <span className="font-bold text-xl tracking-wide text-white">
              Stash
            </span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link href="/auth/signin">
              <button className="px-5 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
                Log In
              </button>
            </Link>
            <Link href="/auth/signup">
              <button className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium border border-blue-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Smart budgeting for students
            </div>
            
            <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight">
              Master your <span className="text-blue-500">finances</span> without the stress.
            </h1>
            
            <p className="text-lg text-gray-400 max-w-xl leading-relaxed">
              Stash makes money management simple. Track daily expenses, stay within your budgets, and earn Stash Points for every smart financial decision you make.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/dashboard">
                <button className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                  Open My Dashboard <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Cards Display */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative h-[500px] hidden lg:block"
          >
            {/* Background elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-600/10 blur-[100px] rounded-full"></div>
            
            {/* Card 1 */}
            <motion.div 
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-10 right-10 w-64 p-5 rounded-xl bg-[#161b22] border border-gray-800 shadow-xl z-20"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-500/10 text-green-500 rounded-lg">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Daily Budget</h3>
                  <p className="text-xs text-gray-400">On Track</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Spent</span>
                  <span className="text-white font-medium">৳450</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-[45%] rounded-full"></div>
                </div>
              </div>
            </motion.div>

            {/* Card 2 */}
            <motion.div 
              animate={{ y: [10, -10, 10] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-20 left-0 w-72 p-5 rounded-xl bg-[#161b22] border border-gray-800 shadow-xl z-30"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
                  <PieChart className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-white">Latest Logs</h3>
              </div>
              <div className="space-y-3 mt-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">Lunch</span>
                  <span className="text-red-400 font-medium">-৳120</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">Bus Fare</span>
                  <span className="text-red-400 font-medium">-৳40</span>
                </div>
              </div>
            </motion.div>

            {/* Card 3 */}
            <motion.div 
              animate={{ y: [-5, 5, -5] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute top-1/2 -right-4 w-48 p-4 rounded-xl bg-[#161b22] border border-gray-800 shadow-xl z-10"
            >
              <div className="flex flex-col items-center text-center gap-2">
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-full">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-xl">15</h3>
                <p className="text-xs text-gray-400">Stash Points Earned</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* Features Grid */}
      <section className="border-t border-gray-800 bg-[#0d1117]">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Core Features</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Everything you need to keep your student budget in check.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-[#161b22] border border-gray-800 hover:border-gray-700 transition-colors">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center mb-4">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Quick Logs</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Log expenses in seconds with categorized one-tap inputs for Food, Transport, and Shopping.
              </p>
            </div>
            
            <div className="p-6 rounded-xl bg-[#161b22] border border-gray-800 hover:border-gray-700 transition-colors">
              <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Smart Limits</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Set daily and monthly spending limits. Get visual indicators to help you stay on track.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#161b22] border border-gray-800 hover:border-gray-700 transition-colors">
              <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center mb-4">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Stash Points</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Earn points directly proportional to how much you save below your daily limit.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
