"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Coffee, Car, ShoppingBag, Settings, LayoutDashboard, Clock, Save, Target, Box, Wallet, User, MapPin, AlertTriangle, Navigation, Calendar, Flame } from "lucide-react";

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
  const [otherAmount, setOtherAmount] = useState("");

  // Phase 8 States
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [selectedHistoryDate, setSelectedHistoryDate] = useState("");
  const [uniqueDates, setUniqueDates] = useState<string[]>([]);

  const CURRENCY_SYMBOLS: Record<string, string> = {
    BDT: "৳",
    USD: "$",
    INR: "₹",
    SAR: "﷼"
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) {
          router.push("/auth/signin");
          return;
        }

        const u = session.user;
        setUser(u);

        if (u.user_metadata) {
          setDisplayName(u.user_metadata.display_name || u.user_metadata.full_name || u.user_metadata.name || "Student");
          setDailyLimit(Number(u.user_metadata.daily_limit) || 500);
          setMonthlyBudget(Number(u.user_metadata.monthly_budget) || 15000);
          setCurrency(u.user_metadata.currency || "৳");
        }

        await fetchExpenses(u.id);
      } catch (err) {
        console.error("Profile fetch error:", err);
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  const fetchExpenses = async (userId: string) => {
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', firstDayOfMonth.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setExpenses(data);
      }
    } catch (err) {
      console.error("Transaction fetch error:", err);
    } finally {
      setLoading(false);
    }
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

    // Gamification: Streak Logic
    const now = new Date();
    const todayStr = new Date(now.getTime() - (12 * 60 * 60 * 1000)).toISOString().split('T')[0];
    const lastLogged = user.user_metadata?.last_logged_date;
    let currentStreak = Number(user.user_metadata?.streak_count) || 0;

    if (lastLogged !== todayStr) {
      if (lastLogged) {
        const lastDate = new Date(lastLogged);
        const diffDays = Math.round((new Date(todayStr).getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) {
          currentStreak += 1;
        } else {
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }

      const { data: updateData } = await supabase.auth.updateUser({
        data: { streak_count: currentStreak, last_logged_date: todayStr }
      });
      if (updateData?.user) setUser(updateData.user);
    }

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

  // Loading state moved to bottom to prevent Hook rule violations

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > 400) { height = Math.round(height * 400 / width); width = 400; }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Compression failed"));
          }, 'image/jpeg', 0.7);
        };
      };
    });
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) return;
      setIsUploadingAvatar(true);
      const file = event.target.files[0];
      const compressedBlob = await compressImage(file);
      const fileName = `${user.id}-avatar-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, compressedBlob, { contentType: 'image/jpeg', upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const { data, error } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      if (!error && data.user) setUser(data.user);
    } catch (error: any) {
      alert(`Avatar Upload Error: ${error.message}`);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const markCurrentLocationAsHEZ = () => {
    if (typeof window === 'undefined' || !('navigator' in window) || !navigator.geolocation) return alert("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const newZone = { lat: pos.coords.latitude, lng: pos.coords.longitude, timestamp: new Date().toISOString() };
        const currentZones = user?.user_metadata?.hez_zones || [];
        const { data, error } = await supabase.auth.updateUser({ data: { hez_zones: [...currentZones, newZone] } });
        if (error) throw error;
        if (data.user) { setUser(data.user); alert("Marked as High Expense Zone!"); }
      } catch (err) {
        console.error("Error marking HEZ:", err);
        alert("Failed to mark location.");
      }
    });
  };

  const now = new Date();
  const resetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
  if (now.getTime() < resetTime.getTime()) resetTime.setDate(resetTime.getDate() - 1);
  const todayStart = resetTime.getTime();

  const dailyExpenses = expenses.filter(exp => new Date(exp.created_at).getTime() >= todayStart);

  const dailySpent = dailyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const monthlySpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Calculate Stash Points: Only award points for days where the user actively logged expenses.
  const expensesByDate = expenses.reduce((acc, exp) => {
    // Format date carefully to handle the 12 PM reset logic if needed, 
    // but a simple ISO string split works well for grouping by calendar day.
    const d = new Date(new Date(exp.created_at).getTime() - (12 * 60 * 60 * 1000)).toISOString().split('T')[0];
    acc[d] = (acc[d] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const stashPoints = Object.values(expensesByDate).reduce((total, dailyAmount) => {
    return total + Math.max(0, dailyLimit - dailyAmount);
  }, 0);

  const budgetPercentage = Math.min((dailySpent / dailyLimit) * 100, 100);
  const monthlyPercentage = monthlyBudget > 0 ? Math.min((monthlySpent / monthlyBudget) * 100, 100) : 0;

  useEffect(() => {
    const dates = expenses.map(exp => new Date(exp.created_at).toISOString().split('T')[0]);
    const unique = Array.from(new Set(dates));
    setUniqueDates(unique);
    if (!selectedHistoryDate && unique.length > 0) setSelectedHistoryDate(unique[0]);
  }, [expenses]);

  const filteredHistory = expenses.filter(exp => new Date(exp.created_at).toISOString().split('T')[0] === selectedHistoryDate);
  const filteredHistoryTotal = filteredHistory.reduce((sum, exp) => sum + exp.amount, 0);

  useEffect(() => {
    if (typeof window === 'undefined' || !('navigator' in window) || !navigator.geolocation) return;

    let watchId: number;
    const isLowFunds = dailySpent / dailyLimit > 0.6;
    const hezZones = user?.user_metadata?.hez_zones || [];

    if (isLowFunds && hezZones.length > 0) {
      if (Notification.permission === 'default') Notification.requestPermission();
      watchId = navigator.geolocation.watchPosition((pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          hezZones.forEach((zone: any) => {
            const R = 6371e3;
            const p1 = latitude * Math.PI / 180;
            const p2 = zone.lat * Math.PI / 180;
            const dp = (zone.lat - latitude) * Math.PI / 180;
            const dl = (zone.lng - longitude) * Math.PI / 180;
            const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
            const dist = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
            if (dist < 500 && Notification.permission === 'granted') {
              new Notification('⚠️ Warning: Entering a High Expense Zone with low funds.');
            }
          });
        } catch (err) {
          console.error("GPS Watch error:", err);
        }
      }, (err) => console.error("GPS Position Error:", err), { enableHighAccuracy: true });
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, [dailySpent, dailyLimit, user]);

  const flag = user?.user_metadata?.flag || "";
  const avatarUrl = user?.user_metadata?.avatar_url;
  const hezZones = user?.user_metadata?.hez_zones || [];
  const streakCount = user?.user_metadata?.streak_count || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] px-6 py-12 flex flex-col items-center">
        <div className="max-w-6xl w-full animate-pulse">
          <div className="h-10 w-48 bg-gray-800 rounded mb-4"></div>
          <div className="h-6 w-64 bg-gray-800 rounded mb-12"></div>

          <div className="h-48 w-full bg-gray-800 rounded-3xl mb-8"></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="h-48 bg-gray-800 rounded-3xl"></div>
            <div className="h-48 bg-gray-800 rounded-3xl"></div>
            <div className="h-48 bg-gray-800 rounded-3xl"></div>
          </div>

          <div className="h-64 w-full bg-gray-800 rounded-3xl"></div>
        </div>
      </div>
    );
  }

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
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              Welcome back, {displayName} <span className="text-2xl">{flag}</span>
            </h1>
            <p className="text-gray-400 mt-1">
              Track your expenses and grow your Stash Points.
            </p>
          </div>
          <div className="flex items-center gap-4">
            {streakCount > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-500 px-4 py-1.5 rounded-full font-bold shadow-[0_0_15px_rgba(249,115,22,0.2)]" aria-label={`Current streak: ${streakCount} days`}>
                <Flame className="w-5 h-5 fill-orange-500" />
                <span>{streakCount} <span className="text-sm opacity-80">Day Streak</span></span>
              </div>
            )}
            <div className="relative group">
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                onChange={handleAvatarUpload}
                title="Change Profile Picture"
                aria-label="Upload Profile Picture"
              />
              <div className="w-20 h-20 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center overflow-hidden group-hover:border-blue-500 transition-colors shadow-lg">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-gray-400 group-hover:text-blue-500 transition-colors" />
                )}
              </div>
              {isUploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                </div>
              )}
            </div>
          </div>
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
                      className={`h-full rounded-full transition-all duration-500 ${budgetPercentage > 90 ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' :
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
              <div className="grid md:grid-cols-3 gap-6">

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
                  <p className="text-sm text-gray-500 mt-2">1:1 ratio for savings.</p>
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
                    <span className="text-4xl font-bold text-white">{currency}{monthlySpent.toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-gray-500 font-medium mb-3">Limit: {currency}{monthlyBudget.toLocaleString()}</div>
                  <div className="h-3 w-full bg-gray-900 rounded-full overflow-hidden shadow-inner border border-gray-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${monthlyPercentage}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${monthlyPercentage > 90 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                        monthlyPercentage > 75 ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' :
                          'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                        }`}
                    />
                  </div>
                </div>

                {/* HEZ Radar Card */}
                <div className="bg-[#161b22] border-2 border-red-500/30 p-8 rounded-3xl shadow-lg relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute -right-6 -top-6 w-32 h-32 bg-red-500/10 rounded-full blur-2xl"></div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-400 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      HEZ Radar
                    </h3>
                    <div className="text-4xl font-bold text-white mb-2">{hezZones.length}</div>
                    <p className="text-sm text-gray-500">Active High Expense Zones</p>
                  </div>
                  <div className="mt-4 flex flex-col gap-2 relative z-10">
                    <Link href="/map" aria-label="Open Tactical Map page" className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 py-2 rounded-lg text-center text-sm font-medium transition-colors border border-red-500/20 flex items-center justify-center gap-2">
                      <MapPin className="w-4 h-4" /> Open Tactical Map
                    </Link>
                    <button onClick={markCurrentLocationAsHEZ} aria-label="Mark current GPS location as High Expense Zone" className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-center text-sm font-medium transition-colors border border-gray-700 flex items-center justify-center gap-2">
                      <Navigation className="w-4 h-4" /> Mark Current Loc
                    </button>
                  </div>
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
                      <div className="relative flex flex-col">
                        <label htmlFor="foodAmount" className="sr-only">Food Amount</label>
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">{currency}</span>
                        <input
                          id="foodAmount"
                          type="number"
                          value={foodAmount}
                          onChange={(e) => setFoodAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-[#0d1117] border border-gray-800 rounded-xl py-3 pl-8 pr-3 text-white focus:outline-none focus:border-green-500"
                          aria-label="Enter food expense amount"
                        />
                      </div>
                      <button
                        onClick={() => logExpense("Food", foodAmount, setFoodAmount)}
                        className="w-full bg-green-600/20 hover:bg-green-600 text-green-500 hover:text-white font-medium py-3 rounded-xl transition-colors border border-green-500/30"
                        aria-label="Log Food Expense"
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
                      <div className="relative flex flex-col">
                        <label htmlFor="transportAmount" className="sr-only">Transport Amount</label>
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">{currency}</span>
                        <input
                          id="transportAmount"
                          type="number"
                          value={transportAmount}
                          onChange={(e) => setTransportAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-[#0d1117] border border-gray-800 rounded-xl py-3 pl-8 pr-3 text-white focus:outline-none focus:border-blue-500"
                          aria-label="Enter transport expense amount"
                        />
                      </div>
                      <button
                        onClick={() => logExpense("Transport", transportAmount, setTransportAmount)}
                        className="w-full bg-blue-600/20 hover:bg-blue-600 text-blue-500 hover:text-white font-medium py-3 rounded-xl transition-colors border border-blue-500/30"
                        aria-label="Log Transport Expense"
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
                      <div className="relative flex flex-col">
                        <label htmlFor="shoppingAmount" className="sr-only">Shopping Amount</label>
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">{currency}</span>
                        <input
                          id="shoppingAmount"
                          type="number"
                          value={shoppingAmount}
                          onChange={(e) => setShoppingAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-[#0d1117] border border-gray-800 rounded-xl py-3 pl-8 pr-3 text-white focus:outline-none focus:border-purple-500"
                          aria-label="Enter shopping expense amount"
                        />
                      </div>
                      <button
                        onClick={() => logExpense("Shopping", shoppingAmount, setShoppingAmount)}
                        className="w-full bg-purple-600/20 hover:bg-purple-600 text-purple-500 hover:text-white font-medium py-3 rounded-xl transition-colors border border-purple-500/30"
                        aria-label="Log Shopping Expense"
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

              {/* Transaction History Archive */}
              <div className="bg-[#161b22] border border-gray-800 rounded-3xl overflow-hidden">
                <div className="p-8 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-6 h-6 text-blue-500" />
                    <h2 className="text-xl font-bold text-white">Historical Transaction Archive</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={selectedHistoryDate}
                      onChange={(e) => setSelectedHistoryDate(e.target.value)}
                      className="bg-[#0d1117] border border-gray-700 text-white text-sm rounded-lg py-2 px-3 focus:outline-none focus:border-blue-500"
                    >
                      {uniqueDates.length === 0 && <option value="">No history</option>}
                      {uniqueDates.map(date => (
                        <option key={date} value={date}>
                          {new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedHistoryDate && (
                  <div className="bg-blue-500/5 px-8 py-4 border-b border-gray-800 flex justify-between items-center">
                    <span className="text-gray-400 font-medium">Daily Total</span>
                    <span className="text-white font-bold text-xl">{currency}{filteredHistoryTotal.toLocaleString()}</span>
                  </div>
                )}

                <div className="divide-y divide-gray-800 max-h-[500px] overflow-y-auto">
                  {filteredHistory.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 font-medium">
                      No logs for this date.
                    </div>
                  ) : (
                    filteredHistory.map((exp) => (
                      <div key={exp.id} className="p-5 px-8 flex items-center justify-between hover:bg-gray-800/30 transition-colors">
                        <div className="flex items-center gap-5">
                          <div className={`p-3 rounded-full ${exp.category === 'Food' ? 'bg-green-500/10 text-green-500' :
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
                            <p className="text-sm text-gray-500">{new Date(exp.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
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
