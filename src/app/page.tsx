"use client";

import { motion } from "framer-motion";
import { Wallet, Shield, Target, ArrowRight, TrendingUp, Flame, Trophy, Sparkles, Zap, PiggyBank } from "lucide-react";
import Link from "next/link";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: "easeOut" as const }
  })
};

export default function LandingPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stash-saver.vercel.app";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "name": "Stash Saver", "url": siteUrl, "logo": `${siteUrl}/stash-icon.svg` },
      { "@type": "WebSite", "name": "Stash Saver", "url": siteUrl },
      { "@type": "WebApplication", "name": "Stash Saver", "applicationCategory": "FinanceApplication", "operatingSystem": "Any", "description": "Gen-Z personal finance companion.", "url": siteUrl, "offers": { "@type": "Offer", "price": "0" } }
    ]
  };

  return (
    <div className="min-h-screen bg-[#0a0e17] text-[#f1f5f9] font-sans selection:bg-emerald-500/30 overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Navigation */}
      <nav className="w-full px-6 py-4 bg-[#0a0e17]/80 backdrop-blur-xl sticky top-0 z-50 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
              S
            </div>
            <span className="font-bold text-xl tracking-tight text-white">
              Stash<span className="text-emerald-400">Saver</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/auth/signin">
              <button className="px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                Log In
              </button>
            </Link>
            <Link href="/auth/signup">
              <button className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all hover:-translate-y-0.5">
                Get Started Free
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative">
        {/* Background orbs */}
        <div className="orb orb-emerald w-[600px] h-[600px] -top-40 -left-40 opacity-30" />
        <div className="orb orb-blue w-[500px] h-[500px] top-20 right-0 opacity-20" />
        <div className="orb orb-purple w-[400px] h-[400px] bottom-0 left-1/3 opacity-15" />

        <div className="max-w-7xl mx-auto px-6 pt-20 pb-32 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" animate="visible" className="space-y-8">
              <motion.div custom={0} variants={fadeUp} className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-semibold border border-emerald-500/20 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Your Gen-Z finance companion
              </motion.div>

              <motion.h1 custom={1} variants={fadeUp} className="text-5xl md:text-7xl font-extrabold text-white leading-[1.05] tracking-tight">
                Your money deserves{" "}
                <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  better habits.
                </span>
              </motion.h1>

              <motion.p custom={2} variants={fadeUp} className="text-lg md:text-xl text-slate-400 max-w-xl leading-relaxed">
                Stash Saver makes saving addictive. Track expenses, crush goals, earn rewards, and build the financial discipline you&apos;ve always wanted.
              </motion.p>

              <motion.div custom={3} variants={fadeUp} className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link href="/dashboard">
                  <button className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-emerald-500/25 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2.5 text-base">
                    Start Saving Today <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
                <button className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2.5 text-base backdrop-blur-sm">
                  <Sparkles className="w-5 h-5 text-emerald-400" /> See How It Works
                </button>
              </motion.div>

              <motion.div custom={4} variants={fadeUp} className="flex items-center gap-6 pt-4">
                <div className="flex -space-x-2">
                  {["bg-emerald-500", "bg-blue-500", "bg-purple-500", "bg-cyan-500"].map((bg, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full ${bg} border-2 border-[#0a0e17] flex items-center justify-center text-xs font-bold text-white`}>
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-slate-400"><span className="text-white font-semibold">2,500+</span> students already saving smarter</p>
              </motion.div>
            </motion.div>

            {/* Floating Cards */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.3 }} className="relative h-[520px] hidden lg:block">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-emerald-500/10 blur-[100px] rounded-full" />

              {/* Balance Card */}
              <motion.div animate={{ y: [-8, 8, -8] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-6 right-4 w-72 p-6 rounded-2xl glass-card-static glow-emerald z-20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-emerald-500/15 text-emerald-400 rounded-xl">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Monthly Savings</p>
                    <h3 className="font-bold text-white text-lg">৳12,450</h3>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                  <TrendingUp className="w-4 h-4" />
                  <span>+23% from last month</span>
                </div>
              </motion.div>

              {/* Streak Card */}
              <motion.div animate={{ y: [10, -10, 10] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-20 left-0 w-64 p-5 rounded-2xl glass-card-static glow-purple z-30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-orange-500/15 text-orange-400 rounded-xl">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Saving Streak</p>
                    <h3 className="font-bold text-white">🔥 14 Days</h3>
                  </div>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full w-[70%] bg-gradient-to-r from-orange-500 to-amber-400 rounded-full" />
                </div>
                <p className="text-xs text-slate-500 mt-2">6 more days to Gold badge!</p>
              </motion.div>

              {/* XP Card */}
              <motion.div animate={{ y: [-5, 5, -5] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute top-1/2 -right-2 w-52 p-5 rounded-2xl glass-card-static glow-cyan z-10">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="p-3 bg-cyan-500/15 text-cyan-400 rounded-full">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <h3 className="font-black text-white text-2xl">2,450</h3>
                  <p className="text-xs text-slate-400 font-medium">Stash Points Earned</p>
                  <div className="badge badge-cyan text-[10px]">
                    <Zap className="w-3 h-3" /> Level 8
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section className="relative border-t border-white/[0.06]">
        <div className="orb orb-indigo w-[400px] h-[400px] top-0 right-0 opacity-15" />
        <div className="max-w-7xl mx-auto px-6 py-28 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-20">
            <div className="badge badge-emerald mx-auto mb-6">
              <Sparkles className="w-3.5 h-3.5" /> Core Features
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5 tracking-tight">
              Everything to master your{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">money game</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">Built for students and first-time savers who want to build real financial habits.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Wallet, title: "Smart Expense Tracking", desc: "Log expenses in seconds with categorized one-tap inputs. Smart icons, color coding, and AI-powered spending insights.", color: "emerald", gradient: "from-emerald-500/20 to-emerald-500/5" },
              { icon: Target, title: "Savings Goals", desc: "Set goals for travel, gadgets, or emergencies. Watch beautiful progress rings fill up as you save.", color: "blue", gradient: "from-blue-500/20 to-blue-500/5" },
              { icon: Trophy, title: "Gamification & XP", desc: "Earn Stash Points, maintain streaks, unlock achievement badges, and climb the global leaderboard.", color: "purple", gradient: "from-purple-500/20 to-purple-500/5" },
              { icon: Shield, title: "Smart Budget Limits", desc: "Set daily and monthly spending limits. Get visual alerts and warnings before you overspend.", color: "cyan", gradient: "from-cyan-500/20 to-cyan-500/5" },
              { icon: Zap, title: "AI Financial Insights", desc: "Get personalized spending analysis, bad habit detection, and smart saving suggestions powered by AI.", color: "orange", gradient: "from-orange-500/20 to-orange-500/5" },
              { icon: PiggyBank, title: "Beautiful Analytics", desc: "Animated graphs, spending heatmaps, and financial trends that make data feel alive.", color: "emerald", gradient: "from-emerald-500/20 to-emerald-500/5" }
            ].map((feature, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
                className="glass-card p-7 group">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-6 h-6 text-${feature.color}-400`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Motivation CTA */}
      <section className="relative border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-6 py-28 text-center relative z-10">
          <div className="orb orb-emerald w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
              Turn small savings into{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">big wins.</span>
            </h2>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
              Every big fortune starts with one small stash. Start building your financial future today — it&apos;s free, fun, and addictive.
            </p>
            <Link href="/dashboard">
              <button className="px-10 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-emerald-500/25 transition-all hover:-translate-y-0.5 text-lg">
                Start Your Journey <ArrowRight className="w-5 h-5 inline ml-2" />
              </button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
