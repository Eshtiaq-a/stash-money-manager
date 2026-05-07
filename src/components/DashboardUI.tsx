"use client";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

export function StatCard({ icon: Icon, label, value, sub, color = "emerald", children }: {
  icon: LucideIcon; label: string; value: string | number; sub?: string; color?: string; children?: React.ReactNode;
}) {
  const colors: Record<string, string> = {
    emerald: "from-emerald-500/15 to-emerald-500/5 text-emerald-400 border-emerald-500/20",
    blue: "from-blue-500/15 to-blue-500/5 text-blue-400 border-blue-500/20",
    purple: "from-purple-500/15 to-purple-500/5 text-purple-400 border-purple-500/20",
    cyan: "from-cyan-500/15 to-cyan-500/5 text-cyan-400 border-cyan-500/20",
    orange: "from-orange-500/15 to-orange-500/5 text-orange-400 border-orange-500/20",
    red: "from-red-500/15 to-red-500/5 text-red-400 border-red-500/20",
  };
  const c = colors[color] || colors.emerald;
  return (
    <div className="glass-card p-6 relative overflow-hidden group">
      <div className={`absolute -right-6 -top-6 w-28 h-28 rounded-full bg-gradient-to-br ${c.split(" ")[0]} ${c.split(" ")[1]} blur-2xl opacity-60 group-hover:opacity-100 transition-opacity`} />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${c.split(" ")[0]} ${c.split(" ")[1]}`}>
            <Icon className={`w-5 h-5 ${c.split(" ")[2]}`} />
          </div>
          <span className="text-sm font-medium text-slate-400">{label}</span>
        </div>
        <p className="text-3xl font-black text-white tracking-tight">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1.5">{sub}</p>}
        {children}
      </div>
    </div>
  );
}

export function ProgressBar({ value, max, color = "emerald", height = "h-3" }: {
  value: number; max: number; color?: string; height?: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const barColor = pct > 90 ? "from-red-500 to-red-400" : pct > 75 ? "from-yellow-500 to-amber-400" : 
    color === "purple" ? "from-purple-500 to-violet-400" : color === "blue" ? "from-blue-500 to-cyan-400" : "from-emerald-500 to-cyan-400";
  const glowColor = pct > 90 ? "shadow-red-500/30" : pct > 75 ? "shadow-yellow-500/30" :
    color === "purple" ? "shadow-purple-500/30" : "shadow-emerald-500/30";
  return (
    <div className={`${height} w-full bg-white/5 rounded-full overflow-hidden`}>
      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: "easeOut" }}
        className={`h-full rounded-full bg-gradient-to-r ${barColor} shadow-lg ${glowColor}`} />
    </div>
  );
}

export function CategoryIcon({ category }: { category: string }) {
  const map: Record<string, { emoji: string; bg: string }> = {
    Food: { emoji: "🍔", bg: "bg-emerald-500/10" },
    Transport: { emoji: "🚗", bg: "bg-blue-500/10" },
    Shopping: { emoji: "🛍️", bg: "bg-purple-500/10" },
    Education: { emoji: "📚", bg: "bg-amber-500/10" },
    Entertainment: { emoji: "🎮", bg: "bg-cyan-500/10" },
    Subscriptions: { emoji: "💳", bg: "bg-pink-500/10" },
    Other: { emoji: "📦", bg: "bg-slate-500/10" },
  };
  const item = map[category] || map.Other;
  return (
    <div className={`w-11 h-11 rounded-xl ${item.bg} flex items-center justify-center text-lg`}>
      {item.emoji}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="min-h-screen bg-[#0a0e17] px-6 py-12 flex flex-col items-center">
      <div className="max-w-6xl w-full space-y-6">
        <div className="skeleton h-12 w-64 mb-2" />
        <div className="skeleton h-6 w-80 mb-8" />
        <div className="skeleton h-44 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="skeleton h-40 rounded-2xl" />
          <div className="skeleton h-40 rounded-2xl" />
          <div className="skeleton h-40 rounded-2xl" />
        </div>
        <div className="skeleton h-72 w-full rounded-2xl" />
      </div>
    </div>
  );
}
