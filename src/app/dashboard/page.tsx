"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Coffee, Car, ShoppingBag, Settings, LayoutDashboard, Clock, Save, Target, Box, Wallet } from "lucide-react";

interface Expense {
  id: string;
  amount: number;
  category: string;
  created_at: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "settings">("dashboard");
  
  // Settings State
  const [displayName, setDisplayName] = useState("");
  const [dailyLimit, setDailyLimit] = useState(500);
  const [monthlyBudget, setMonthlyBudget] = useState(15000);
  const [currency, setCurrency] = useState("৳");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Expense State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Quick Log Inputs
  const [foodAmount, setFoodAmount] = useState("");
  const [transportAmount, setTransportAmount] = useState("");
  const [shoppingAmount, setShoppingAmount] = useState("");
  const [otherAmount, setOtherAmount] = useState(""); // Add Other

  const CURRENCY_SYMBOLS: Record<string, string> = {
    BDT: "৳",
    USD: "$",
    INR: "₹",
    SAR: "﷼"
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth/signin");
        return;
      }
      
      const u = session.user;
      setUser(u);
      
      // Load settings from metadata
      if (u.user_metadata) {
        setDisplayName(u.user_metadata.display_name || u.user_metadata.full_name || u.user_metadata.name || "Student");
        setDailyLimit(Number(u.user_metadata.daily_limit) || 500);
        setMonthlyBudget(Number(u.user_metadata.monthly_budget) || 15000);
        setCurrency(u.user_metadata.currency || "৳");
      }

      fetchExpenses(u.id);
    };

    checkUser();
  }, [router]);

  const fetchExpenses = async (userId: string) => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', firstDayOfMonth.toISOString())
      .order('created_at', { ascending: false });

    if (!error && data) {
      setExpenses(data);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/signin");
  };

  const saveSettings = async () => {
    setIsSavingSettings(true);
    const { data, error } = await supabase.auth.updateUser({
      data: { 
        display_name: displayName,
        daily_limit: dailyLimit,
        monthly_budget: monthlyBudget,
        currency: currency
      }
    });
    
    if (!error && data.user) {
      setUser(data.user);
      alert("Settings saved successfully!");
    }
    setIsSavingSettings(false);
  };

  const logExpense = async (category: string, amountStr: string, setter: (val: string) => void) => {
    const amount = Number(amountStr);
    if (!amount || amount <= 0 || !user) return;

    const newExpense = {
      user_id: user.id,
      amount,
      category,
    };

    const { data, error } = await supabase
      .from('expenses')
      .insert([newExpense])
      .select()
      .single();

    if (!error && data) {
      setExpenses([data, ...expenses]);
      setter(""); // clear input
    } else {
      console.error("Supabase insert error:", error);
      alert(`Error logging expense: ${error?.message || "Unknown database error"}`);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0d1117] flex items-center justify-center text-white font-sans">Loading Stash...</div>;
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  const dailyExpenses = expenses.filter(exp => new Date(exp.created_at).getTime() >= todayStart);
  
  const dailySpent = dailyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const monthlySpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const stashPoints = Math.max(0, dailyLimit - dailySpent);
  const budgetPercentage = Math.min((dailySpent / dailyLimit) * 100, 100);
  const monthlyPercentage = monthlyBudget > 0 ? Math.min((monthlySpent / monthlyBudget) * 100, 100) : 0;

  const flag = user?.user_metadata?.flag || "";

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 font-sans selection:bg-blue-500/30">
      
      {/* Navbar */}
      <nav className="w-full px-6 py-4 border-b border-gray-800 bg-[#161b22] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" onClick={() => setActiveTab('dashboard')} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-white text-xl">
              S
            </div>
            <span className="font-bold text-xl tracking-wide text-white">
              Stash
            </span>
          </Link>
          
          <div className="flex items-center gap-2 bg-gray-800/50 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <LayoutDashboard className="w-4 h-4" /> <span className="hidden sm:inline">My Dashboard</span>
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'settings' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Settings className="w-4 h-4" /> <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        
        {/* User Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            Welcome back, {displayName} <span className="text-2xl">{flag}</span>
          </h1>
          <p className="text-gray-400 mt-1">
            Track your expenses and grow your Stash Points.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              
              {/* DAILY BUDGET HEADER (Large & Prominent) */}
              <div className="flex flex-col md:flex-row items-center gap-6 p-8 bg-gradient-to-r from-blue-600/20 to-transparent border border-blue-500/30 rounded-3xl relative overflow-hidden shadow-[0_10px_40px_rgba(59,130,246,0.1)]">
                <div className="absolute -right-10 -top-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="p-5 bg-blue-500/20 rounded-full shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                  <Wallet className="w-10 h-10 text-blue-400" />
                </div>
                <div className="w-full flex-1">
                  <h2 className="text-lg text-blue-500 font-bold uppercase tracking-widest mb-1">Today's Daily Budget</h2>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-6xl md:text-7xl font-black text-white">{currency}{dailySpent.toLocaleString()}</span>
                    <span className="text-blue-400/80 font-medium text-xl">/ {currency}{dailyLimit}</span>
                  </div>
                  <div className="h-4 w-full max-w-xl bg-gray-900 rounded-full overflow-hidden shadow-inner border border-gray-800">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${budgetPercentage}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        budgetPercentage > 90 ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 
                        budgetPercentage > 75 ? 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 
                        'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                      }`}
                    />
                  </div>
                  {budgetPercentage >= 100 && (
                    <p className="text-red-400 text-sm mt-3 font-medium">Daily limit exceeded! No points earned today.</p>
                  )}
                </div>
              </div>

              {/* Top Overview Cards */}
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* Stash Points Card */}
                <div className="bg-[#161b22] border-2 border-green-500/30 p-8 rounded-3xl shadow-lg relative overflow-hidden">
                  <div className="absolute -right-6 -top-6 w-32 h-32 bg-green-500/10 rounded-full blur-2xl"></div>
                  <h3 className="text-lg font-medium text-gray-400 mb-6">Stash Points</h3>
                  <div className="flex flex-col mb-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-6xl font-black text-white tracking-tight">{stashPoints}</span>
                      <span className="text-green-500 font-bold">pts</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">1:1 ratio for every {currency} saved below today's limit.</p>
                </div>

                {/* Monthly Budget Card */}
                <div className="bg-[#161b22] border border-gray-800 p-8 rounded-3xl shadow-sm flex flex-col justify-center relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-medium text-gray-400">Monthly Budget Target</h3>
                    <span className="text-purple-400 font-bold bg-purple-500/10 px-3 py-1 rounded-lg text-sm border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                      {Math.round(monthlyPercentage)}%
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-5xl font-bold text-white">{currency}{monthlySpent.toLocaleString()}</span>
                    <span className="text-xl text-gray-500 font-medium">/ {currency}{monthlyBudget.toLocaleString()}</span>
                  </div>
                  <div className="h-3 w-full bg-gray-900 rounded-full overflow-hidden shadow-inner border border-gray-800">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${monthlyPercentage}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        monthlyPercentage > 90 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 
                        monthlyPercentage > 75 ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 
                        'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                      }`}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-4">Adjust this baseline in your Settings tab.</p>
                </div>

              </div>

              {/* Quick-Log Section */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Quick Log</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Food Card */}
                  <div className="bg-[#161b22] border border-gray-800 p-5 rounded-2xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-green-500/10 text-green-500 rounded-xl">
                        <Coffee className="w-5 h-5" />
                      </div>
                      <h3 className="font-semibold text-white">Food & Dining</h3>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">{currency}</span>
                        <input 
                          type="number" 
                          value={foodAmount}
                          onChange={(e) => setFoodAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-[#0d1117] border border-gray-800 rounded-xl py-3 pl-8 pr-3 text-white focus:outline-none focus:border-green-500"
                        />
                      </div>
                      <button 
                        onClick={() => logExpense("Food", foodAmount, setFoodAmount)}
                        className="w-full bg-green-600/20 hover:bg-green-600 text-green-500 hover:text-white font-medium py-3 rounded-xl transition-colors border border-green-500/30"
                      >
                        Log Food
                      </button>
                    </div>
                  </div>

                  {/* Transport Card */}
                  <div className="bg-[#161b22] border border-gray-800 p-5 rounded-2xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
                        <Car className="w-5 h-5" />
                      </div>
                      <h3 className="font-semibold text-white">Transport</h3>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">{currency}</span>
                        <input 
                          type="number" 
                          value={transportAmount}
                          onChange={(e) => setTransportAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-[#0d1117] border border-gray-800 rounded-xl py-3 pl-8 pr-3 text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <button 
                        onClick={() => logExpense("Transport", transportAmount, setTransportAmount)}
                        className="w-full bg-blue-600/20 hover:bg-blue-600 text-blue-500 hover:text-white font-medium py-3 rounded-xl transition-colors border border-blue-500/30"
                      >
                        Log Transport
                      </button>
                    </div>
                  </div>

                  {/* Shopping Card */}
                  <div className="bg-[#161b22] border border-gray-800 p-5 rounded-2xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <h3 className="font-semibold text-white">Shopping</h3>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">{currency}</span>
                        <input 
                          type="number" 
                          value={shoppingAmount}
                          onChange={(e) => setShoppingAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-[#0d1117] border border-gray-800 rounded-xl py-3 pl-8 pr-3 text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <button 
                        onClick={() => logExpense("Shopping", shoppingAmount, setShoppingAmount)}
                        className="w-full bg-purple-600/20 hover:bg-purple-600 text-purple-500 hover:text-white font-medium py-3 rounded-xl transition-colors border border-purple-500/30"
                      >
                        Log Shopping
                      </button>
                    </div>
                  </div>

                  {/* Other Card */}
                  <div className="bg-[#161b22] border border-gray-800 p-5 rounded-2xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-gray-500/10 text-gray-400 rounded-xl">
                        <Box className="w-5 h-5" />
                      </div>
                      <h3 className="font-semibold text-white">Other</h3>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">{currency}</span>
                        <input 
                          type="number" 
                          value={otherAmount}
                          onChange={(e) => setOtherAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-[#0d1117] border border-gray-800 rounded-xl py-3 pl-8 pr-3 text-white focus:outline-none focus:border-gray-500"
                        />
                      </div>
                      <button 
                        onClick={() => logExpense("Other", otherAmount, setOtherAmount)}
                        className="w-full bg-gray-600/20 hover:bg-gray-600 text-gray-300 hover:text-white font-medium py-3 rounded-xl transition-colors border border-gray-500/30"
                      >
                        Log Other
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Transaction History */}
              <div className="bg-[#161b22] border border-gray-800 rounded-3xl overflow-hidden">
                <div className="p-8 border-b border-gray-800 flex items-center gap-3">
                  <Clock className="w-6 h-6 text-gray-400" />
                  <h2 className="text-xl font-bold text-white">Transaction History</h2>
                </div>
                
                <div className="divide-y divide-gray-800">
                  {dailyExpenses.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 font-medium">
                      No logs for today yet. Use the Quick Log cards above to add an expense.
                    </div>
                  ) : (
                    dailyExpenses.map((exp) => (
                      <div key={exp.id} className="p-5 px-8 flex items-center justify-between hover:bg-gray-800/30 transition-colors">
                        <div className="flex items-center gap-5">
                          <div className={`p-3 rounded-full ${
                            exp.category === 'Food' ? 'bg-green-500/10 text-green-500' :
                            exp.category === 'Transport' ? 'bg-blue-500/10 text-blue-500' :
                            exp.category === 'Shopping' ? 'bg-purple-500/10 text-purple-500' :
                            'bg-gray-500/10 text-gray-400'
                          }`}>
                            {exp.category === 'Food' && <Coffee className="w-5 h-5" />}
                            {exp.category === 'Transport' && <Car className="w-5 h-5" />}
                            {exp.category === 'Shopping' && <ShoppingBag className="w-5 h-5" />}
                            {exp.category === 'Other' && <Box className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-bold text-white text-lg">{exp.category}</p>
                            <p className="text-sm text-gray-500">{new Date(exp.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                          </div>
                        </div>
                        <div className="text-white font-bold text-xl">
                          -{currency}{exp.amount.toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl mx-auto space-y-6"
            >
              <div className="bg-[#161b22] border border-gray-800 p-8 rounded-2xl">
                <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-800 pb-4">Profile & Settings</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
                    <input 
                      type="text" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-[#0d1117] border border-gray-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Daily Limit</label>
                      <input 
                        type="number" 
                        value={dailyLimit}
                        onChange={(e) => setDailyLimit(Number(e.target.value))}
                        className="w-full bg-[#0d1117] border border-gray-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Monthly Budget</label>
                      <input 
                        type="number" 
                        value={monthlyBudget}
                        onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                        className="w-full bg-[#0d1117] border border-gray-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Preferred Currency</label>
                    <select 
                      value={CURRENCY_SYMBOLS[currency] ? Object.keys(CURRENCY_SYMBOLS).find(k => CURRENCY_SYMBOLS[k] === currency) : "BDT"}
                      onChange={(e) => setCurrency(CURRENCY_SYMBOLS[e.target.value] || "৳")}
                      className="w-full bg-[#0d1117] border border-gray-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500 appearance-none"
                    >
                      <option value="BDT">BDT (৳)</option>
                      <option value="USD">USD ($)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="SAR">SAR (﷼)</option>
                    </select>
                  </div>

                  <button 
                    onClick={saveSettings}
                    disabled={isSavingSettings}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4"
                  >
                    <Save className="w-4 h-4" /> {isSavingSettings ? "Saving..." : "Save Preferences"}
                  </button>
                </div>
              </div>

              <div className="bg-[#161b22] border border-red-900/30 p-8 rounded-2xl">
                <h3 className="text-xl font-bold text-white mb-2">Account Access</h3>
                <p className="text-gray-400 text-sm mb-6">Securely log out of your Stash account.</p>
                <button 
                  onClick={handleSignOut}
                  className="bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white font-medium px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Log Out
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
