"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Box, Calendar, Camera, Car, Coffee, Crosshair, Flame, LayoutDashboard, LogOut, MapPin, Medal, Navigation, RadioTower, Save, Settings, Shield, ShoppingBag, Trophy, Upload, Wallet, X, Sparkles, TrendingUp, Zap, Target, PiggyBank, ChevronRight, Plus, Star, Heart, BarChart3 } from "lucide-react";

interface Expense {
  id: string;
  amount: number;
  category: string;
  created_at: string;
}

interface HighExpenseZone {
  lat: number;
  lng: number;
  timestamp: string;
}

interface Profile {
  id: string;
  avatar_url?: string | null;
  full_name?: string | null;
  total_points?: number | null;
  last_points_awarded_on?: string | null;
  lives?: number | null;
  last_lives_reset?: string | null;
  last_streak_save_date?: string | null;
}

interface LeaderboardProfile extends Profile {
  rank: number;
}

interface ProviderIdentity {
  provider?: string;
  identity_data?: {
    avatar_url?: string;
    picture?: string;
  };
}

interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  saved: number;
  createdAt: string;
}

interface StashUserMetadata {
  avatar_url?: string;
  currency?: string;
  daily_limit?: number | string;
  display_name?: string;
  flag?: string;
  full_name?: string;
  hez_zones?: HighExpenseZone[];
  last_logged_date?: string;
  monthly_budget?: number | string;
  name?: string;
  savings_goals?: SavingsGoal[];
  picture?: string;
  provider_avatar_url?: string;
  total_points?: number | string;
  last_points_awarded_on?: string;
  streak_count?: number | string;
}

type StashUser = SupabaseUser & {
  identities?: ProviderIdentity[];
  user_metadata: StashUserMetadata;
};

const POINT_AWARD_SCALE = 100;
const MAX_DAILY_POINTS = 20;
const LIFELINE_COST = 50;
const MAX_LIVES = 3;

function getOperationalDate(date = new Date()) {
  return new Date(date.getTime() - (12 * 60 * 60 * 1000)).toISOString().split("T")[0];
}

const TIER_LIST = [
  { min: 25000, label: "Legendary", emoji: "👑", color: "from-yellow-400 to-amber-500", border: "border-yellow-400/60", bg: "bg-yellow-400/10", text: "text-yellow-300" },
  { min: 15000, label: "Mythic", emoji: "💎", color: "from-purple-400 to-pink-500", border: "border-purple-400/60", bg: "bg-purple-400/10", text: "text-purple-300" },
  { min: 10000, label: "Grandmaster", emoji: "🔥", color: "from-red-400 to-orange-500", border: "border-red-400/60", bg: "bg-red-400/10", text: "text-red-300" },
  { min: 5000, label: "Master", emoji: "⚡", color: "from-emerald-400 to-teal-500", border: "border-emerald-400/60", bg: "bg-emerald-400/10", text: "text-emerald-300" },
  { min: 2500, label: "Diamond", emoji: "💠", color: "from-cyan-400 to-blue-500", border: "border-cyan-400/60", bg: "bg-cyan-400/10", text: "text-cyan-300" },
  { min: 1000, label: "Gold", emoji: "🥇", color: "from-amber-400 to-yellow-500", border: "border-amber-400/60", bg: "bg-amber-400/10", text: "text-amber-300" },
  { min: 250, label: "Silver", emoji: "🥈", color: "from-slate-300 to-slate-400", border: "border-slate-400/60", bg: "bg-slate-400/10", text: "text-slate-300" },
  { min: 0, label: "Bronze", emoji: "🥉", color: "from-orange-300 to-amber-400", border: "border-orange-400/60", bg: "bg-orange-400/10", text: "text-orange-300" },
];

function getRankBadge(points: number) {
  const tier = TIER_LIST.find(t => points >= t.min) || TIER_LIST[TIER_LIST.length - 1];
  return { label: tier.label, className: `${tier.border} ${tier.bg} ${tier.text}`, emoji: tier.emoji, color: tier.color };
}

function getTierIndex(points: number) {
  return TIER_LIST.findIndex(t => points >= t.min);
}

function getNextTier(points: number) {
  const idx = getTierIndex(points);
  return idx > 0 ? TIER_LIST[idx - 1] : null;
}

function calculateMonthlyDisciplinePoints(totalBudget: number, spent: number) {
  if (totalBudget <= 0 || spent >= totalBudget) return 0;
  return Math.round(((totalBudget - spent) / totalBudget) * POINT_AWARD_SCALE);
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<StashUser | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "settings">("dashboard");
  const [dashboardMode, setDashboardMode] = useState<"expense" | "savings">("expense");
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [quickLogCategory, setQuickLogCategory] = useState("Food");
  const [quickLogAmount, setQuickLogAmount] = useState("");
  const [lives, setLives] = useState(MAX_LIVES);
  const [lastLivesReset, setLastLivesReset] = useState("");

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
  const [logDate, setLogDate] = useState(""); // for backdating expenses

  // Savings Mode State
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalAmount, setNewGoalAmount] = useState("");
  const [savingsContribAmount, setSavingsContribAmount] = useState("");

  // Phase 8 States
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [selectedHistoryDate, setSelectedHistoryDate] = useState("");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardProfile[]>([]);
  const [currentRank, setCurrentRank] = useState<number | null>(null);
  const [leaderboardError, setLeaderboardError] = useState("");
  const [pointsError, setPointsError] = useState("");
  const displayNameRef = useRef(displayName);
  const profileRef = useRef<Profile | null>(profile);
  const userRef = useRef<StashUser | null>(user);

  useEffect(() => {
    displayNameRef.current = displayName;
    profileRef.current = profile;
    userRef.current = user;
  }, [displayName, profile, user]);

  const CURRENCY_SYMBOLS: Record<string, string> = {
    BDT: "৳",
    USD: "$",
    INR: "₹",
    SAR: "﷼"
  };

  const fetchLeaderboard = useCallback(async (userId: string) => {
    setLeaderboardError("");
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .gt("total_points", 0)
      .order("total_points", { ascending: false })
      .limit(10);

    if (error) {
      setLeaderboardError("Leaderboard needs profiles.total_points access.");
      console.error("Leaderboard fetch error:", error);
      return;
    }

    const rankedProfiles = (data || []).map((item, index) => ({
      ...item,
      total_points: Number(item.total_points) || 0,
      rank: index + 1,
    }));
    setLeaderboard(rankedProfiles);

    const topRank = rankedProfiles.find((item) => item.id === userId)?.rank;
    if (topRank) {
      setCurrentRank(topRank);
      return;
    }

    // Current user not in top 10 — calculate their rank
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("total_points")
      .eq("id", userId)
      .single();
    const ownPoints = Number(currentProfile?.total_points) || 0;
    if (ownPoints > 0) {
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gt("total_points", ownPoints);
      setCurrentRank((count || 0) + 1);
    } else {
      setCurrentRank(null);
    }
  }, []);

  const fetchProfile = useCallback(async (u: StashUser) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", u.id)
      .single();

    if (error) {
      // Row doesn't exist yet — auto-create profile for new users
      if (error.code === 'PGRST116') {
        const name = u.user_metadata.display_name || u.user_metadata.full_name || u.user_metadata.name || "Student";
        const avatar = u.user_metadata.avatar_url || u.user_metadata.picture || null;
        const currentMonth = new Date().toISOString().slice(0, 7);
        const created = await syncProfile(u.id, {
          full_name: name,
          avatar_url: avatar,
          total_points: Number(u.user_metadata.total_points) || 0,
          lives: MAX_LIVES,
          last_lives_reset: currentMonth,
        });
        if (created) {
          setDisplayName(name);
          setLives(MAX_LIVES);
          setLastLivesReset(currentMonth);
        }
        return created;
      }
      console.error("Profile table fetch error:", error);
      return null;
    }

    setProfile(data);
    setDisplayName(data.full_name || u.user_metadata.display_name || u.user_metadata.full_name || u.user_metadata.name || "Student");
    // Load lives
    const currentMonth = new Date().toISOString().slice(0, 7);
    if (data.last_lives_reset !== currentMonth) {
      // Reset lives at start of new month
      setLives(MAX_LIVES);
      setLastLivesReset(currentMonth);
    } else {
      setLives(data.lives ?? MAX_LIVES);
      setLastLivesReset(data.last_lives_reset || currentMonth);
    }
    return data;
  }, []);

  const syncProfile = useCallback(async (userId: string, updates: Partial<Profile>) => {
    const currentProfile = profileRef.current;
    const currentUser = userRef.current;
    const payload = {
      id: userId,
      full_name: updates.full_name ?? displayNameRef.current,
      avatar_url: updates.avatar_url ?? currentProfile?.avatar_url ?? null,
      total_points: updates.total_points ?? currentProfile?.total_points ?? (Number(currentUser?.user_metadata?.total_points) || 0),
      last_points_awarded_on: updates.last_points_awarded_on ?? currentProfile?.last_points_awarded_on ?? currentUser?.user_metadata?.last_points_awarded_on ?? null,
      lives: updates.lives ?? currentProfile?.lives ?? MAX_LIVES,
      last_lives_reset: updates.last_lives_reset ?? currentProfile?.last_lives_reset ?? null,
      last_streak_save_date: updates.last_streak_save_date ?? currentProfile?.last_streak_save_date ?? null,
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload)
      .select("*")
      .single();

    if (error) {
      console.error("Profile sync error:", error);
      return null;
    }

    setProfile(data);
    return data;
  }, []);

  const awardDailyStashPoints = useCallback(async (u: StashUser, expenseList: Expense[], profileData: Profile | null) => {
    const today = getOperationalDate();
    const lastAwardDate = profileData?.last_points_awarded_on || u.user_metadata.last_points_awarded_on;
    if (lastAwardDate === today) return;

    const budget = Number(u.user_metadata.monthly_budget) || 15000;
    const spent = expenseList.reduce((sum, exp) => sum + exp.amount, 0);
    // New Point Economy: max 20 pts/day
    let dailyPoints = 0;
    // 10 pts for budget discipline (no overspending)
    const dailyExpToday = expenseList.filter(e => new Date(e.created_at).toISOString().split('T')[0] === today);
    const todaySpent = dailyExpToday.reduce((s, e) => s + e.amount, 0);
    const dl = Number(u.user_metadata.daily_limit) || 500;
    if (todaySpent <= dl) dailyPoints += 10;
    // 5 pts for logging activity (at least 1 expense logged today)
    if (dailyExpToday.length > 0) dailyPoints += 5;
    // 5 pts for savings goal contribution (check if any goal was contributed to today)
    const goals: SavingsGoal[] = u.user_metadata.savings_goals || [];
    if (goals.some(g => g.saved > 0)) dailyPoints += 5;
    const pointsToAward = Math.min(dailyPoints, MAX_DAILY_POINTS);
    const currentTotal = Number(profileData?.total_points ?? u.user_metadata.total_points) || 0;
    const nextTotal = currentTotal + pointsToAward;

    setPointsError("");
    const synced = await syncProfile(u.id, {
      total_points: nextTotal,
      last_points_awarded_on: today,
      full_name: displayNameRef.current || u.user_metadata.display_name || u.user_metadata.full_name || u.user_metadata.name || "Student",
    });

    const { data } = await supabase.auth.updateUser({
      data: {
        total_points: nextTotal,
        last_points_awarded_on: today,
      },
    });
    if (data?.user) setUser(data.user as StashUser);

    if (!synced) {
      setPointsError("Daily Stash Points could not sync to profiles.");
    }
    await fetchLeaderboard(u.id);
  }, [fetchLeaderboard, syncProfile]);

  async function fetchExpenses(userId: string) {
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
      if (data) setExpenses(data);
      return data || [];
    } catch (err) {
      console.error("Transaction fetch error:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) {
          router.push("/auth/signin");
          return;
        }

        const u = session.user as StashUser;

        if (u.user_metadata) {
          setDisplayName(u.user_metadata.display_name || u.user_metadata.full_name || u.user_metadata.name || "Student");
          setDailyLimit(Number(u.user_metadata.daily_limit) || 500);
          setMonthlyBudget(Number(u.user_metadata.monthly_budget) || 15000);
          setCurrency(u.user_metadata.currency || "৳");
          setSavingsGoals(u.user_metadata.savings_goals || []);
        }

        setUser(u);
        const [profileData, expenseData] = await Promise.all([
          fetchProfile(u),
          fetchExpenses(u.id),
          fetchLeaderboard(u.id),
        ]);
        await awardDailyStashPoints(u, expenseData, profileData);
      } catch (err) {
        console.error("Profile fetch error:", err);
        setLoading(false);
      }
    };

    checkUser();
  }, [awardDailyStashPoints, fetchLeaderboard, fetchProfile, router]);

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
      setUser(data.user as StashUser);
      await syncProfile(data.user.id, { full_name: displayName });
      await fetchLeaderboard(data.user.id);
      alert("Settings saved successfully!");
    }
    setIsSavingSettings(false);
  };

  const logExpense = async (category: string, amountStr: string, setter: (val: string) => void, customDate?: string) => {
    const amount = Number(amountStr);
    if (!amount || amount <= 0 || !user) return;

    // Gamification: Streak Logic (only for today's logs)
    const now = new Date();
    const todayStr = new Date(now.getTime() - (12 * 60 * 60 * 1000)).toISOString().split('T')[0];
    const isBackdated = customDate && customDate !== todayStr;

    if (!isBackdated) {
      const lastLogged = user.user_metadata?.last_logged_date;
      let currentStreak = Number(user.user_metadata?.streak_count) || 0;

      if (lastLogged !== todayStr) {
        if (lastLogged) {
          const lastDate = new Date(lastLogged);
          const diffDays = Math.round((new Date(todayStr).getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays <= 1) { currentStreak += 1; } else { currentStreak = 1; }
        } else { currentStreak = 1; }
        const { data: updateData } = await supabase.auth.updateUser({ data: { streak_count: currentStreak, last_logged_date: todayStr } });
        if (updateData?.user) setUser(updateData.user as StashUser);
      }
    }

    const expenseDate = customDate ? new Date(customDate + "T12:00:00").toISOString() : undefined;
    const newExpense: Record<string, unknown> = { user_id: user.id, amount, category };
    if (expenseDate) newExpense.created_at = expenseDate;

    const { data, error } = await supabase
      .from('expenses')
      .insert([newExpense])
      .select()
      .single();

    if (!error && data) {
      setExpenses([data, ...expenses]);
      setter("");
      if (customDate) setLogDate("");
    } else {
      console.error("Supabase insert error:", error);
      alert(`Error logging expense: ${error?.message || "Unknown database error"}`);
    }
  };

  // === Savings Goal Management ===
  const addSavingsGoal = async () => {
    if (!newGoalName.trim() || !newGoalAmount || !user) return;
    const goal: SavingsGoal = {
      id: Date.now().toString(),
      name: newGoalName.trim(),
      target: Number(newGoalAmount),
      saved: 0,
      createdAt: new Date().toISOString(),
    };
    const updated = [...savingsGoals, goal];
    setSavingsGoals(updated);
    setNewGoalName("");
    setNewGoalAmount("");
    await supabase.auth.updateUser({ data: { savings_goals: updated } });
  };

  const contributeToGoal = async (goalId: string) => {
    const amount = Number(savingsContribAmount);
    if (!amount || amount <= 0 || !user) return;
    const updated = savingsGoals.map(g => g.id === goalId ? { ...g, saved: Math.min(g.saved + amount, g.target) } : g);
    setSavingsGoals(updated);
    setSavingsContribAmount("");
    await supabase.auth.updateUser({ data: { savings_goals: updated } });
  };

  const removeSavingsGoal = async (goalId: string) => {
    const updated = savingsGoals.filter(g => g.id !== goalId);
    setSavingsGoals(updated);
    await supabase.auth.updateUser({ data: { savings_goals: updated } });
  };

  const totalSaved = savingsGoals.reduce((sum, g) => sum + g.saved, 0);
  const totalGoalTarget = savingsGoals.reduce((sum, g) => sum + g.target, 0);

  // === Lifeline Purchase ===
  const purchaseLifeline = async () => {
    if (!user || totalStashPoints < LIFELINE_COST) return;
    const newPoints = totalStashPoints - LIFELINE_COST;
    const newLives = Math.min(lives + 1, MAX_LIVES);
    setLives(newLives);
    const currentMonth = new Date().toISOString().slice(0, 7);
    await syncProfile(user.id, { total_points: newPoints, lives: newLives, last_lives_reset: currentMonth });
    await supabase.auth.updateUser({ data: { total_points: newPoints } });
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) setUser(data.session.user as StashUser);
    await fetchLeaderboard(user.id);
  };

  // === Quick Log Handler ===
  const handleQuickLog = async () => {
    if (!quickLogAmount || !user) return;
    const setter = () => { };
    await logExpense(quickLogCategory, quickLogAmount, setter, logDate || undefined);
    setQuickLogAmount("");
    setIsQuickLogOpen(false);
  };

  // === Streak Flame Helpers ===
  const getStreakFlameClass = (streak: number) => {
    if (streak >= 21) return "streak-flame-3 flame-god";
    if (streak >= 6) return "streak-flame-2 flame-blue";
    return "streak-flame-1 flame-orange";
  };
  const getStreakFlameColor = (streak: number) => {
    if (streak >= 21) return "text-emerald-400 fill-emerald-400";
    if (streak >= 6) return "text-blue-400 fill-blue-400";
    return "text-orange-400 fill-orange-400";
  };
  const getStreakGlowBg = (streak: number) => {
    if (streak >= 21) return "from-emerald-500/20 to-cyan-500/10 border-emerald-500/30";
    if (streak >= 6) return "from-blue-500/20 to-cyan-500/10 border-blue-500/30";
    return "from-orange-500/20 to-amber-500/10 border-orange-500/30";
  };

  // Loading state moved to bottom to prevent Hook rule violations

  const cropAvatarImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const size = Math.min(img.width, img.height);
          const sx = (img.width - size) / 2;
          const sy = (img.height - size) / 2;
          canvas.width = 512;
          canvas.height = 512;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, sx, sy, size, size, 0, 0, 512, 512);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Compression failed"));
          }, 'image/jpeg', 0.7);
        };
      };
    });
  };

  const handleAvatarFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const closeProfileModal = () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    setAvatarFile(null);
    setIsProfileModalOpen(false);
  };

  const handleAvatarUpload = async () => {
    try {
      if (!avatarFile || !user) return;
      setIsUploadingAvatar(true);
      const compressedBlob = await cropAvatarImage(avatarFile);
      const fileName = `${user.id}/avatar-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, compressedBlob, { contentType: 'image/jpeg', upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const { data, error } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      if (error) throw error;
      if (data.user) setUser(data.user as StashUser);
      await syncProfile(user.id, { avatar_url: publicUrl, full_name: displayName });
      await fetchLeaderboard(user.id);
      closeProfileModal();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown upload error";
      alert(`Avatar Upload Error: ${message}`);
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
        if (data.user) { setUser(data.user as StashUser); alert("Marked as High Expense Zone!"); }
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

  const budgetPercentage = Math.min((dailySpent / dailyLimit) * 100, 100);
  const monthlyPercentage = monthlyBudget > 0 ? Math.min((monthlySpent / monthlyBudget) * 100, 100) : 0;
  // New point economy projection
  let projectedDailyPoints = 0;
  if (dailySpent <= dailyLimit) projectedDailyPoints += 10;
  if (dailyExpenses.length > 0) projectedDailyPoints += 5;
  if (savingsGoals.some(g => g.saved > 0)) projectedDailyPoints += 5;
  projectedDailyPoints = Math.min(projectedDailyPoints, MAX_DAILY_POINTS);
  const totalStashPoints = Number(profile?.total_points ?? user?.user_metadata?.total_points) || 0;
  const rankBadge = getRankBadge(totalStashPoints);

  const uniqueDates = useMemo(() => {
    const dates = expenses.map(exp => new Date(exp.created_at).toISOString().split('T')[0]);
    return Array.from(new Set(dates));
  }, [expenses]);

  const activeHistoryDate = selectedHistoryDate || uniqueDates[0] || "";
  const filteredHistory = expenses.filter(exp => new Date(exp.created_at).toISOString().split('T')[0] === activeHistoryDate);
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
          hezZones.forEach((zone) => {
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
  const avatarUrl =
    profile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    user?.user_metadata?.provider_avatar_url ||
    user?.identities?.find((identity) => identity.provider === "google" || identity.provider === "github")?.identity_data?.avatar_url ||
    user?.identities?.find((identity) => identity.provider === "google" || identity.provider === "github")?.identity_data?.picture;
  const hezZones = user?.user_metadata?.hez_zones || [];
  const streakCount = Number(user?.user_metadata?.streak_count) || 0;

  if (loading) {
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

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-200 font-sans selection:bg-emerald-500/30 relative">
      {/* Background orbs */}
      <div className="orb orb-emerald w-[500px] h-[500px] -top-40 -left-40 opacity-15 fixed" />
      <div className="orb orb-blue w-[400px] h-[400px] top-1/3 right-0 opacity-10 fixed" />

      {/* Navbar */}
      <nav className="w-full px-4 sm:px-6 py-3 border-b border-white/[0.06] bg-[#0a0e17]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" onClick={() => setActiveTab('dashboard')} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
              S
            </div>
            <span className="font-bold text-xl tracking-tight text-white hidden sm:block">
              Stash<span className="text-emerald-400">Saver</span>
            </span>
          </Link>

          <div className="flex items-center gap-1.5 bg-white/[0.04] p-1 rounded-xl border border-white/[0.06]">
            <button onClick={() => setActiveTab('dashboard')} className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${activeTab === 'dashboard' ? 'bg-gradient-to-r from-emerald-500/15 to-cyan-500/10 text-emerald-400 shadow-sm border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
              <LayoutDashboard className="w-4 h-4" /> <span className="hidden sm:inline">Dashboard</span>
            </button>
            <button onClick={() => { setActiveTab('dashboard'); setTimeout(() => document.getElementById('leaderboard-section')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 text-slate-400 hover:text-white hover:bg-white/5">
              <BarChart3 className="w-4 h-4" /> <span className="hidden sm:inline">Leaderboard</span>
            </button>
            <button onClick={() => setActiveTab('settings')} className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${activeTab === 'settings' ? 'bg-gradient-to-r from-emerald-500/15 to-cyan-500/10 text-emerald-400 shadow-sm border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
              <Settings className="w-4 h-4" /> <span className="hidden sm:inline">Settings</span>
            </button>
          </div>

          {/* Quick Log Button */}
          <button onClick={() => setIsQuickLogOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 transition-all" aria-label="Quick Log Expense">
            <Zap className="w-4 h-4" /> <span className="hidden sm:inline">Quick Log</span>
          </button>
        </div>
      </nav>

      {/* Quick Log Modal */}
      <AnimatePresence>
        {isQuickLogOpen && (
          <motion.div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 quick-log-backdrop px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsQuickLogOpen(false)}>
            <motion.div className="glass-card-static w-full max-w-sm p-6" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><Zap className="w-5 h-5 text-emerald-400" /> Quick Log</h2>
                <button onClick={() => setIsQuickLogOpen(false)} className="text-slate-400 hover:text-white p-1"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 font-medium mb-1.5 block">Category</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[{ cat: 'Food', icon: '🍔' }, { cat: 'Transport', icon: '🚗' }, { cat: 'Shopping', icon: '🛍️' }, { cat: 'Other', icon: '📦' }].map(c => (
                      <button key={c.cat} onClick={() => setQuickLogCategory(c.cat)} className={`p-3 rounded-xl text-center transition-all ${quickLogCategory === c.cat ? 'bg-emerald-500/15 border border-emerald-500/30 text-white' : 'bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:bg-white/[0.06]'}`}>
                        <div className="text-lg mb-0.5">{c.icon}</div>
                        <div className="text-[10px] font-medium">{c.cat}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">{currency}</span>
                  <input type="number" value={quickLogAmount} onChange={e => setQuickLogAmount(e.target.value)} placeholder="0" className="input-field pl-8 text-2xl font-black py-4" autoFocus onKeyDown={e => e.key === 'Enter' && handleQuickLog()} />
                </div>
                <button onClick={handleQuickLog} disabled={!quickLogAmount || Number(quickLogAmount) <= 0} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40">
                  <Zap className="w-4 h-4" /> Log {quickLogCategory}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-6xl mx-auto px-6 py-8">

        {/* User Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-3 tracking-tight">
              Welcome back, {displayName} <span className="text-2xl">{flag}</span>
            </h1>
            <p className="text-slate-400 mt-1.5">Track expenses, crush goals, earn rewards.</p>
            {/* Tier Badge - prominently shown */}
            <button onClick={() => setIsTierModalOpen(true)} className={`mt-3 inline-flex items-center gap-2 badge ${rankBadge.className} px-4 py-1.5 cursor-pointer hover:scale-105 transition-transform`}>
              <span className="text-base">{rankBadge.emoji}</span>
              <span className="font-bold">{rankBadge.label}</span>
              <span className="opacity-60">·</span>
              <span>{totalStashPoints.toLocaleString()} pts</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            {/* Animated Streak Display */}
            {streakCount > 0 && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`hidden sm:flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-gradient-to-r ${getStreakGlowBg(streakCount)} border backdrop-blur-sm`}
                aria-label={`Current streak: ${streakCount} days`}
              >
                <motion.div className={getStreakFlameClass(streakCount)}>
                  <Flame className={`w-7 h-7 ${getStreakFlameColor(streakCount)}`} />
                </motion.div>
                <div>
                  <span className="text-xl font-black text-white">{streakCount}</span>
                  <span className="text-xs text-slate-400 ml-1.5">Day Streak</span>
                  {/* Lives */}
                  <div className="flex gap-1 mt-0.5">
                    {Array.from({ length: MAX_LIVES }).map((_, i) => (
                      <div key={i} className={`life-orb ${i >= lives ? 'used' : ''}`} />
                    ))}
                    <span className="text-[9px] text-slate-500 ml-1">{lives} lives</span>
                  </div>
                </div>
              </motion.div>
            )}
            <button type="button" onClick={() => setIsProfileModalOpen(true)} className="relative group" aria-label="Edit Profile">
              <div className="w-16 h-16 rounded-2xl bg-[#141c2b] border-2 border-white/10 flex items-center justify-center overflow-hidden group-hover:border-emerald-500/50 transition-all group-hover:shadow-lg group-hover:shadow-emerald-500/10">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-xl font-black text-emerald-300">
                    S
                  </div>
                )}
              </div>
              {isUploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-emerald-500/40 bg-[#0a0e17] text-emerald-400">
                <Camera className="h-3.5 w-3.5" />
              </span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isProfileModalOpen && (
            <motion.div
              className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="glass-card-static w-full max-w-md p-7 border-emerald-500/20"
                initial={{ scale: 0.96, y: 16 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.96, y: 16 }}
              >
                <div className="mb-6 flex items-center justify-between border-b border-white/[0.06] pb-4">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-emerald-400" />
                    <h2 className="text-xl font-bold text-white">Edit Profile</h2>
                  </div>
                  <button onClick={closeProfileModal} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors" aria-label="Close Edit Profile">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex flex-col items-center gap-5">
                  <div className="relative h-36 w-36 overflow-hidden rounded-2xl border-2 border-emerald-500/30 bg-[#0a0e17] shadow-lg shadow-emerald-500/10">
                    {(avatarPreview || avatarUrl) ? (
                      <img src={avatarPreview || avatarUrl} alt="Avatar preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-4xl font-black text-emerald-300">S</div>
                    )}
                    <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/10" />
                    <Crosshair className="pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-emerald-300/30" />
                  </div>

                  <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300 transition-all hover:bg-emerald-500/20 hover:border-emerald-500/30">
                    <Upload className="h-4 w-4" />
                    Choose Avatar
                    <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarFileSelect} />
                  </label>

                  <button
                    onClick={handleAvatarUpload}
                    disabled={!avatarFile || isUploadingAvatar}
                    className="btn-primary flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:transform-none"
                  >
                    <Save className="h-4 w-4" />
                    {isUploadingAvatar ? "Uploading..." : "Save Profile"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tier Board Modal */}
        <AnimatePresence>
          {isTierModalOpen && (
            <motion.div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsTierModalOpen(false)}>
              <motion.div className="glass-card-static w-full max-w-lg max-h-[85vh] overflow-y-auto p-7" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2"><Trophy className="w-5 h-5 text-emerald-400" /> Rank Tiers</h2>
                  <button onClick={() => setIsTierModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"><X className="h-5 w-5" /></button>
                </div>

                {/* Current Rank Hero */}
                <div className={`p-5 rounded-2xl bg-gradient-to-r ${rankBadge.color} mb-6 text-center relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="relative z-10">
                    <div className="text-4xl mb-2">{rankBadge.emoji}</div>
                    <h3 className="text-2xl font-black text-white">{rankBadge.label}</h3>
                    <p className="text-white/70 text-sm">{totalStashPoints.toLocaleString()} Stash Points</p>
                    {getNextTier(totalStashPoints) && (
                      <div className="mt-3">
                        <div className="h-2 bg-black/30 rounded-full overflow-hidden max-w-xs mx-auto">
                          <div className="h-full bg-white/80 rounded-full" style={{ width: `${Math.min(((totalStashPoints - (TIER_LIST[getTierIndex(totalStashPoints)]?.min || 0)) / ((getNextTier(totalStashPoints)?.min || 1) - (TIER_LIST[getTierIndex(totalStashPoints)]?.min || 0))) * 100, 100)}%` }} />
                        </div>
                        <p className="text-white/60 text-xs mt-1.5">{(getNextTier(totalStashPoints)!.min - totalStashPoints).toLocaleString()} pts to {getNextTier(totalStashPoints)!.label}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* All Tiers */}
                <div className="space-y-2">
                  {TIER_LIST.map((tier, i) => {
                    const isCurrentTier = getTierIndex(totalStashPoints) === i;
                    const isUnlocked = totalStashPoints >= tier.min;
                    return (
                      <div key={tier.label} className={`flex items-center gap-4 p-3.5 rounded-xl transition-all ${isCurrentTier ? `bg-gradient-to-r ${tier.color} bg-opacity-20 border border-white/20` : isUnlocked ? 'bg-white/[0.03]' : 'bg-white/[0.01] opacity-50'}`}>
                        <span className="text-2xl w-8 text-center">{tier.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold ${isCurrentTier ? 'text-white' : isUnlocked ? tier.text : 'text-slate-500'}`}>{tier.label}</p>
                          <p className="text-xs text-slate-500">{tier.min.toLocaleString()}+ pts required</p>
                        </div>
                        {isCurrentTier && <span className="badge badge-emerald text-[10px]">CURRENT</span>}
                        {isUnlocked && !isCurrentTier && <Star className="w-4 h-4 text-emerald-500 fill-emerald-500" />}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mode Toggle: Expense vs Savings */}
        <div className="mb-6 flex items-center gap-2 bg-white/[0.03] p-1.5 rounded-xl border border-white/[0.06] w-fit">
          <button onClick={() => setDashboardMode('expense')} className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${dashboardMode === 'expense' ? 'bg-gradient-to-r from-emerald-500/15 to-cyan-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white'}`}>
            <Wallet className="w-4 h-4" /> Expenses
          </button>
          <button onClick={() => setDashboardMode('savings')} className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${dashboardMode === 'savings' ? 'bg-gradient-to-r from-purple-500/15 to-pink-500/10 text-purple-400 border border-purple-500/20' : 'text-slate-400 hover:text-white'}`}>
            <PiggyBank className="w-4 h-4" /> Savings Goals
          </button>
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

              {/* DAILY BUDGET HEADER */}
              <div className="glass-card-static glow-emerald flex flex-col md:flex-row items-center gap-6 p-8 relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
                <div className="p-5 bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 rounded-2xl shadow-lg shadow-emerald-500/10 animate-pulse-glow">
                  <Wallet className="w-10 h-10 text-emerald-400" />
                </div>
                <div className="w-full flex-1">
                  <h2 className="text-sm text-emerald-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Today&apos;s Budget</h2>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-5xl md:text-6xl font-black text-white tracking-tight">{currency}{dailySpent.toLocaleString()}</span>
                    <span className="text-emerald-400/60 font-semibold text-lg">/ {currency}{dailyLimit}</span>
                  </div>
                  <div className="h-3 w-full max-w-xl bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${budgetPercentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full rounded-full ${budgetPercentage > 90 ? 'bg-gradient-to-r from-red-500 to-red-400 shadow-lg shadow-red-500/30' :
                        budgetPercentage > 75 ? 'bg-gradient-to-r from-yellow-500 to-amber-400 shadow-lg shadow-yellow-500/30' :
                          'bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-lg shadow-emerald-500/30'
                        }`}
                    />
                  </div>
                  {budgetPercentage >= 100 && (
                    <p className="text-red-400 text-sm mt-3 font-medium flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Daily limit exceeded — zero Stash Points this cycle.</p>
                  )}
                </div>
              </div>

              {/* Top Overview Cards */}
              <div className="grid md:grid-cols-3 gap-6">

                {/* Stash Points Card - clickable */}
                <button onClick={() => setIsTierModalOpen(true)} className="glass-card glow-emerald p-7 relative overflow-hidden text-left cursor-pointer hover:scale-[1.02] transition-transform w-full">
                  <div className="absolute -right-6 -top-6 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl" />
                  <h3 className="text-sm font-semibold text-slate-400 mb-5 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-emerald-400" />
                    Stash Points
                  </h3>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-5xl font-black text-white tracking-tight">{totalStashPoints}</span>
                    <span className="text-emerald-400 font-bold text-sm">pts</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-emerald-400/70 font-medium">
                    <span>{rankBadge.emoji} {rankBadge.label}</span>
                    <span className="opacity-40">·</span>
                    <span className="flex items-center gap-1">View Tiers <ChevronRight className="w-3 h-3" /></span>
                  </div>
                  <p className="text-xs text-slate-500">+{projectedDailyPoints} pts projected today</p>
                  {pointsError && <p className="mt-2 text-xs text-yellow-400">{pointsError}</p>}
                </button>

                {/* Monthly Budget Card */}
                <div className="glass-card glow-purple p-7 flex flex-col justify-center relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-sm font-semibold text-slate-400">Monthly Budget</h3>
                    <span className="badge badge-purple text-xs">
                      {Math.round(monthlyPercentage)}%
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-3xl font-black text-white">{currency}{monthlySpent.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium mb-4">of {currency}{monthlyBudget.toLocaleString()} limit</div>
                  <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${monthlyPercentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full rounded-full ${monthlyPercentage > 90 ? 'bg-gradient-to-r from-red-500 to-red-400 shadow-lg shadow-red-500/30' :
                        monthlyPercentage > 75 ? 'bg-gradient-to-r from-yellow-500 to-amber-400 shadow-lg shadow-yellow-500/30' :
                          'bg-gradient-to-r from-purple-500 to-violet-400 shadow-lg shadow-purple-500/30'
                        }`}
                    />
                  </div>
                </div>

                {/* HEZ Radar Card */}
                <div className="glass-card p-7 relative overflow-hidden flex flex-col justify-between border-red-500/15">
                  <div className="absolute -right-6 -top-6 w-28 h-28 bg-red-500/10 rounded-full blur-2xl" />
                  <div>
                    <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      HEZ Radar
                    </h3>
                    <div className="text-3xl font-black text-white mb-1">{hezZones.length}</div>
                    <p className="text-xs text-slate-500">High Expense Zones</p>
                  </div>
                  <div className="mt-4 flex flex-col gap-2 relative z-10">
                    <Link href="/map" aria-label="Open Tactical Map page" className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2.5 rounded-xl text-center text-sm font-semibold transition-all border border-red-500/15 flex items-center justify-center gap-2">
                      <MapPin className="w-4 h-4" /> Open Map
                    </Link>
                    <button onClick={markCurrentLocationAsHEZ} aria-label="Mark current GPS location as High Expense Zone" className="w-full bg-white/[0.03] hover:bg-white/[0.06] text-slate-300 py-2.5 rounded-xl text-center text-sm font-medium transition-all border border-white/[0.06] flex items-center justify-center gap-2">
                      <Navigation className="w-4 h-4" /> Mark Location
                    </button>
                  </div>
                </div>

              </div>

              {/* Quick-Log Section — moved above Leaderboard */}
              {dashboardMode === 'expense' && <>
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><Zap className="w-5 h-5 text-emerald-400" /> Quick Log</h2>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-400 font-medium">Backdate:</label>
                      <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)} max={new Date().toISOString().split('T')[0]} className="input-field py-1.5 px-2.5 text-xs w-auto" />
                      {logDate && <button onClick={() => setLogDate('')} className="text-xs text-red-400 hover:text-red-300"><X className="w-3.5 h-3.5" /></button>}
                    </div>
                  </div>
                  {logDate && <div className="mb-4 badge badge-blue text-xs"><Calendar className="w-3 h-3" /> Logging for: {new Date(logDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>}
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">

                    {/* Food Card */}
                    <div className="glass-card p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-lg">🍔</div>
                        <h3 className="font-semibold text-white text-sm">Food & Dining</h3>
                      </div>
                      <div className="flex flex-col gap-3">
                        <div className="relative flex flex-col">
                          <label htmlFor="foodAmount" className="sr-only">Food Amount</label>
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">{currency}</span>
                          <input id="foodAmount" type="number" value={foodAmount} onChange={(e) => setFoodAmount(e.target.value)} placeholder="0.00" className="input-field pl-8" aria-label="Enter food expense amount" />
                        </div>
                        <button onClick={() => logExpense("Food", foodAmount, setFoodAmount, logDate || undefined)} className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold py-2.5 rounded-xl transition-all border border-emerald-500/15 text-sm" aria-label="Log Food Expense">Log Food</button>
                      </div>
                    </div>

                    {/* Transport Card */}
                    <div className="glass-card p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-lg">🚗</div>
                        <h3 className="font-semibold text-white text-sm">Transport</h3>
                      </div>
                      <div className="flex flex-col gap-3">
                        <div className="relative flex flex-col">
                          <label htmlFor="transportAmount" className="sr-only">Transport Amount</label>
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">{currency}</span>
                          <input id="transportAmount" type="number" value={transportAmount} onChange={(e) => setTransportAmount(e.target.value)} placeholder="0.00" className="input-field pl-8" aria-label="Enter transport expense amount" />
                        </div>
                        <button onClick={() => logExpense("Transport", transportAmount, setTransportAmount, logDate || undefined)} className="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-semibold py-2.5 rounded-xl transition-all border border-blue-500/15 text-sm" aria-label="Log Transport Expense">Log Transport</button>
                      </div>
                    </div>

                    {/* Shopping Card */}
                    <div className="glass-card p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-lg">🛍️</div>
                        <h3 className="font-semibold text-white text-sm">Shopping</h3>
                      </div>
                      <div className="flex flex-col gap-3">
                        <div className="relative flex flex-col">
                          <label htmlFor="shoppingAmount" className="sr-only">Shopping Amount</label>
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">{currency}</span>
                          <input id="shoppingAmount" type="number" value={shoppingAmount} onChange={(e) => setShoppingAmount(e.target.value)} placeholder="0.00" className="input-field pl-8" aria-label="Enter shopping expense amount" />
                        </div>
                        <button onClick={() => logExpense("Shopping", shoppingAmount, setShoppingAmount, logDate || undefined)} className="w-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 font-semibold py-2.5 rounded-xl transition-all border border-purple-500/15 text-sm" aria-label="Log Shopping Expense">Log Shopping</button>
                      </div>
                    </div>

                    {/* Other Card */}
                    <div className="glass-card p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-500/10 flex items-center justify-center text-lg">📦</div>
                        <h3 className="font-semibold text-white text-sm">Other</h3>
                      </div>
                      <div className="flex flex-col gap-3">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">{currency}</span>
                          <input type="number" value={otherAmount} onChange={(e) => setOtherAmount(e.target.value)} placeholder="0.00" className="input-field pl-8" />
                        </div>
                        <button onClick={() => logExpense("Other", otherAmount, setOtherAmount, logDate || undefined)} className="w-full bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 font-semibold py-2.5 rounded-xl transition-all border border-white/[0.06] text-sm">Log Other</button>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Transaction History */}
                <div className="glass-card-static overflow-hidden">
                  <div className="p-6 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-blue-400" />
                      <h2 className="text-lg font-bold text-white">Transaction History</h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <select value={activeHistoryDate} onChange={(e) => setSelectedHistoryDate(e.target.value)} className="input-field py-2 px-3 text-sm w-auto">
                        {uniqueDates.length === 0 && <option value="">No history</option>}
                        {uniqueDates.map(date => (
                          <option key={date} value={date}>{new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {activeHistoryDate && (
                    <div className="bg-blue-500/[0.04] px-6 py-3 border-b border-white/[0.06] flex justify-between items-center">
                      <span className="text-slate-400 font-medium text-sm">Daily Total</span>
                      <span className="text-white font-bold text-lg">{currency}{filteredHistoryTotal.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="divide-y divide-white/[0.04] max-h-[400px] overflow-y-auto">
                    {filteredHistory.length === 0 ? (
                      <div className="p-12 text-center">
                        <p className="text-slate-500 font-medium">No transactions for this date</p>
                        <p className="text-slate-600 text-sm mt-1">Every big fortune starts with one small stash.</p>
                      </div>
                    ) : (
                      filteredHistory.map((exp) => (
                        <div key={exp.id} className="p-4 px-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${exp.category === 'Food' ? 'bg-emerald-500/10' : exp.category === 'Transport' ? 'bg-blue-500/10' : exp.category === 'Shopping' ? 'bg-purple-500/10' : 'bg-slate-500/10'}`}>
                              {exp.category === 'Food' && '🍔'}
                              {exp.category === 'Transport' && '🚗'}
                              {exp.category === 'Shopping' && '🛍️'}
                              {exp.category === 'Other' && '📦'}
                            </div>
                            <div>
                              <p className="font-semibold text-white text-sm">{exp.category}</p>
                              <p className="text-xs text-slate-500">{new Date(exp.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                          <div className="text-white font-bold">-{currency}{exp.amount.toLocaleString()}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </> /* end expense mode */}

              {/* Global Leaderboard */}
              <div id="leaderboard-section" className="glass-card-static overflow-hidden glow-emerald">
                <div className="flex flex-col gap-3 border-b border-white/[0.06] p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <RadioTower className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Global Leaderboard</h2>
                      <p className="text-xs text-slate-500">Ranked by total Stash Points</p>
                    </div>
                  </div>
                  <div className={`badge ${currentRank ? 'badge-emerald' : 'badge-orange'}`}>
                    {currentRank ? `🏆 Your Rank: #${currentRank}` : "⏳ Unranked — earn points to rank up!"}
                  </div>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {leaderboardError ? (
                    <div className="p-6 text-sm text-yellow-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> {leaderboardError}
                    </div>
                  ) : leaderboard.length === 0 ? (
                    <div className="p-10 text-center">
                      <div className="text-4xl mb-3">🏆</div>
                      <p className="text-slate-400 font-semibold mb-1">The leaderboard is empty</p>
                      <p className="text-slate-600 text-sm">Log expenses and stay under budget to earn your first Stash Points!</p>
                    </div>
                  ) : leaderboard.map((entry) => {
                    const entryPoints = Number(entry.total_points) || 0;
                    const entryBadge = getRankBadge(entryPoints);
                    const name = entry.full_name || "Stash User";
                    const isCurrentUser = entry.id === user?.id;
                    const rankMedal = entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`;
                    return (
                      <div key={entry.id} className={`flex items-center justify-between gap-4 p-4 px-6 transition-all hover:bg-white/[0.02] ${isCurrentUser ? "bg-emerald-500/[0.06] border-l-2 border-l-emerald-400" : ""}`}>
                        <div className="flex min-w-0 items-center gap-4">
                          <div className={`w-8 text-center font-black text-sm ${entry.rank <= 3 ? 'text-lg' : 'text-emerald-400'}`}>{rankMedal}</div>
                          <div className="h-10 w-10 overflow-hidden rounded-xl border border-white/10 bg-[#0a0e17] flex-shrink-0">
                            {entry.avatar_url ? (
                              <img src={entry.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center font-black text-emerald-300 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-sm">{name.charAt(0).toUpperCase()}</div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-white text-sm">
                              {name}{isCurrentUser && <span className="text-emerald-400 text-xs ml-1.5">(You)</span>}
                            </p>
                            <span className={`badge text-[10px] ${entryBadge.className}`}>
                              {entryBadge.emoji} {entryBadge.label}
                            </span>
                          </div>
                        </div>
                        <div className="text-right font-black text-white text-sm">{entryPoints.toLocaleString()} <span className="text-xs text-emerald-400">pts</span></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick-Log Section */}
              {dashboardMode === 'expense' && <>
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><Zap className="w-5 h-5 text-emerald-400" /> Quick Log</h2>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-400 font-medium">Backdate:</label>
                      <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)} max={new Date().toISOString().split('T')[0]} className="input-field py-1.5 px-2.5 text-xs w-auto" />
                      {logDate && <button onClick={() => setLogDate('')} className="text-xs text-red-400 hover:text-red-300"><X className="w-3.5 h-3.5" /></button>}
                    </div>
                  </div>
                  {logDate && <div className="mb-4 badge badge-blue text-xs"><Calendar className="w-3 h-3" /> Logging for: {new Date(logDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>}
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">

                    {/* Food Card */}
                    <div className="glass-card p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-lg">🍔</div>
                        <h3 className="font-semibold text-white text-sm">Food & Dining</h3>
                      </div>
                      <div className="flex flex-col gap-3">
                        <div className="relative flex flex-col">
                          <label htmlFor="foodAmount" className="sr-only">Food Amount</label>
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">{currency}</span>
                          <input
                            id="foodAmount"
                            type="number"
                            value={foodAmount}
                            onChange={(e) => setFoodAmount(e.target.value)}
                            placeholder="0.00"
                            className="input-field pl-8"
                            aria-label="Enter food expense amount"
                          />
                        </div>
                        <button
                          onClick={() => logExpense("Food", foodAmount, setFoodAmount, logDate || undefined)}
                          className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold py-2.5 rounded-xl transition-all border border-emerald-500/15 text-sm"
                          aria-label="Log Food Expense"
                        >
                          Log Food
                        </button>
                      </div>
                    </div>

                    {/* Transport Card */}
                    <div className="glass-card p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-lg">🚗</div>
                        <h3 className="font-semibold text-white text-sm">Transport</h3>
                      </div>
                      <div className="flex flex-col gap-3">
                        <div className="relative flex flex-col">
                          <label htmlFor="transportAmount" className="sr-only">Transport Amount</label>
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">{currency}</span>
                          <input
                            id="transportAmount"
                            type="number"
                            value={transportAmount}
                            onChange={(e) => setTransportAmount(e.target.value)}
                            placeholder="0.00"
                            className="input-field pl-8"
                            aria-label="Enter transport expense amount"
                          />
                        </div>
                        <button
                          onClick={() => logExpense("Transport", transportAmount, setTransportAmount, logDate || undefined)}
                          className="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-semibold py-2.5 rounded-xl transition-all border border-blue-500/15 text-sm"
                          aria-label="Log Transport Expense"
                        >
                          Log Transport
                        </button>
                      </div>
                    </div>

                    {/* Shopping Card */}
                    <div className="glass-card p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-lg">🛍️</div>
                        <h3 className="font-semibold text-white text-sm">Shopping</h3>
                      </div>
                      <div className="flex flex-col gap-3">
                        <div className="relative flex flex-col">
                          <label htmlFor="shoppingAmount" className="sr-only">Shopping Amount</label>
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">{currency}</span>
                          <input
                            id="shoppingAmount"
                            type="number"
                            value={shoppingAmount}
                            onChange={(e) => setShoppingAmount(e.target.value)}
                            placeholder="0.00"
                            className="input-field pl-8"
                            aria-label="Enter shopping expense amount"
                          />
                        </div>
                        <button
                          onClick={() => logExpense("Shopping", shoppingAmount, setShoppingAmount, logDate || undefined)}
                          className="w-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 font-semibold py-2.5 rounded-xl transition-all border border-purple-500/15 text-sm"
                          aria-label="Log Shopping Expense"
                        >
                          Log Shopping
                        </button>
                      </div>
                    </div>

                    {/* Other Card */}
                    <div className="glass-card p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-500/10 flex items-center justify-center text-lg">📦</div>
                        <h3 className="font-semibold text-white text-sm">Other</h3>
                      </div>
                      <div className="flex flex-col gap-3">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">{currency}</span>
                          <input
                            type="number"
                            value={otherAmount}
                            onChange={(e) => setOtherAmount(e.target.value)}
                            placeholder="0.00"
                            className="input-field pl-8"
                          />
                        </div>
                        <button
                          onClick={() => logExpense("Other", otherAmount, setOtherAmount, logDate || undefined)}
                          className="w-full bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 font-semibold py-2.5 rounded-xl transition-all border border-white/[0.06] text-sm"
                        >
                          Log Other
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Transaction History */}
                <div className="glass-card-static overflow-hidden">
                  <div className="p-6 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-blue-400" />
                      <h2 className="text-lg font-bold text-white">Transaction History</h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={activeHistoryDate}
                        onChange={(e) => setSelectedHistoryDate(e.target.value)}
                        className="input-field py-2 px-3 text-sm w-auto"
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

                  {activeHistoryDate && (
                    <div className="bg-blue-500/[0.04] px-6 py-3 border-b border-white/[0.06] flex justify-between items-center">
                      <span className="text-slate-400 font-medium text-sm">Daily Total</span>
                      <span className="text-white font-bold text-lg">{currency}{filteredHistoryTotal.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="divide-y divide-white/[0.04] max-h-[400px] overflow-y-auto">
                    {filteredHistory.length === 0 ? (
                      <div className="p-12 text-center">
                        <p className="text-slate-500 font-medium">No transactions for this date</p>
                        <p className="text-slate-600 text-sm mt-1">Every big fortune starts with one small stash.</p>
                      </div>
                    ) : (
                      filteredHistory.map((exp) => (
                        <div key={exp.id} className="p-4 px-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${exp.category === 'Food' ? 'bg-emerald-500/10' :
                              exp.category === 'Transport' ? 'bg-blue-500/10' :
                                exp.category === 'Shopping' ? 'bg-purple-500/10' :
                                  'bg-slate-500/10'
                              }`}>
                              {exp.category === 'Food' && '🍔'}
                              {exp.category === 'Transport' && '🚗'}
                              {exp.category === 'Shopping' && '🛍️'}
                              {exp.category === 'Other' && '📦'}
                            </div>
                            <div>
                              <p className="font-semibold text-white text-sm">{exp.category}</p>
                              <p className="text-xs text-slate-500">{new Date(exp.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                          <div className="text-white font-bold">
                            -{currency}{exp.amount.toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </> /* end expense mode */}

              {/* Savings Mode */}
              {dashboardMode === 'savings' && (
                <div className="space-y-6">
                  {/* Savings Overview */}
                  <div className="glass-card-static glow-purple p-7">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2"><PiggyBank className="w-5 h-5 text-purple-400" /> Savings Overview</h2>
                      <div className="badge badge-purple">{savingsGoals.length} Goals</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-5">
                      <div className="p-4 bg-white/[0.03] rounded-xl">
                        <p className="text-xs text-slate-500 mb-1">Total Saved</p>
                        <p className="text-2xl font-black text-white">{currency}{totalSaved.toLocaleString()}</p>
                      </div>
                      <div className="p-4 bg-white/[0.03] rounded-xl">
                        <p className="text-xs text-slate-500 mb-1">Total Target</p>
                        <p className="text-2xl font-black text-white">{currency}{totalGoalTarget.toLocaleString()}</p>
                      </div>
                    </div>
                    {totalGoalTarget > 0 && (
                      <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                          <span>Overall Progress</span>
                          <span>{Math.round((totalSaved / totalGoalTarget) * 100)}%</span>
                        </div>
                        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((totalSaved / totalGoalTarget) * 100, 100)}%` }} className="h-full bg-gradient-to-r from-purple-500 to-pink-400 rounded-full shadow-lg shadow-purple-500/30" />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Monthly budget remaining for savings: {currency}{Math.max(monthlyBudget - monthlySpent, 0).toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Add New Goal */}
                  <div className="glass-card p-6">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-purple-400" /> Add Savings Goal</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input type="text" value={newGoalName} onChange={e => setNewGoalName(e.target.value)} placeholder="e.g. Laptop, Travel..." className="input-field" />
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{currency}</span>
                        <input type="number" value={newGoalAmount} onChange={e => setNewGoalAmount(e.target.value)} placeholder="Target amount" className="input-field pl-8" />
                      </div>
                      <button onClick={addSavingsGoal} disabled={!newGoalName.trim() || !newGoalAmount} className="btn-primary flex items-center justify-center gap-2 text-sm disabled:opacity-40">
                        <Target className="w-4 h-4" /> Create Goal
                      </button>
                    </div>
                  </div>

                  {/* Goals List */}
                  {savingsGoals.length === 0 ? (
                    <div className="glass-card-static p-12 text-center">
                      <PiggyBank className="w-12 h-12 text-purple-400/30 mx-auto mb-4" />
                      <p className="text-slate-400 font-medium">No savings goals yet</p>
                      <p className="text-slate-600 text-sm mt-1">Set a goal and start building your future!</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {savingsGoals.map(goal => {
                        const pct = goal.target > 0 ? Math.min((goal.saved / goal.target) * 100, 100) : 0;
                        const isComplete = pct >= 100;
                        return (
                          <div key={goal.id} className={`glass-card p-6 ${isComplete ? 'glow-emerald' : 'glow-purple'}`}>
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h4 className="font-bold text-white text-lg flex items-center gap-2">
                                  {isComplete && <span className="text-lg">🎉</span>}
                                  {goal.name}
                                </h4>
                                <p className="text-xs text-slate-500 mt-0.5">{isComplete ? 'Goal completed!' : `${Math.round(pct)}% complete`}</p>
                              </div>
                              <button onClick={() => removeSavingsGoal(goal.id)} className="text-slate-500 hover:text-red-400 transition-colors p-1"><X className="w-4 h-4" /></button>
                            </div>
                            <div className="flex items-baseline gap-1 mb-3">
                              <span className="text-2xl font-black text-white">{currency}{goal.saved.toLocaleString()}</span>
                              <span className="text-slate-500 text-sm">/ {currency}{goal.target.toLocaleString()}</span>
                            </div>
                            <div className="h-2.5 bg-white/5 rounded-full overflow-hidden mb-4">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className={`h-full rounded-full ${isComplete ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' : 'bg-gradient-to-r from-purple-500 to-pink-400'} shadow-lg`} />
                            </div>
                            {!isComplete && (
                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">{currency}</span>
                                  <input type="number" value={savingsContribAmount} onChange={e => setSavingsContribAmount(e.target.value)} placeholder="Amount" className="input-field pl-7 py-2 text-sm" />
                                </div>
                                <button onClick={() => contributeToGoal(goal.id)} className="btn-primary px-4 py-2 text-sm flex items-center gap-1.5">
                                  <Plus className="w-3.5 h-3.5" /> Add
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

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
              <div className="glass-card-static p-7">
                <h2 className="text-xl font-bold text-white mb-6 border-b border-white/[0.06] pb-4">Profile & Settings</h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Username</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Daily Limit</label>
                      <input
                        type="number"
                        value={dailyLimit}
                        onChange={(e) => setDailyLimit(Number(e.target.value))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Monthly Budget</label>
                      <input
                        type="number"
                        value={monthlyBudget}
                        onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Preferred Currency</label>
                    <select
                      value={CURRENCY_SYMBOLS[currency] ? Object.keys(CURRENCY_SYMBOLS).find(k => CURRENCY_SYMBOLS[k] === currency) : "BDT"}
                      onChange={(e) => setCurrency(CURRENCY_SYMBOLS[e.target.value] || "৳")}
                      className="input-field appearance-none"
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
                    className="btn-primary w-full flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" /> {isSavingSettings ? "Saving..." : "Save Preferences"}
                  </button>
                  <button
                    onClick={() => setIsProfileModalOpen(true)}
                    className="btn-secondary w-full flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4" /> Edit Profile Avatar
                  </button>
                </div>
              </div>

              {/* Lifeline Shop */}
              <div className="glass-card-static p-7 glow-purple border-purple-500/10">
                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2"><Heart className="w-5 h-5 text-red-400" /> Streak Lifelines</h3>
                <p className="text-slate-500 text-sm mb-5">Protect your streak when you miss a day. Lives auto-refresh every month.</p>

                <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/[0.06] mb-4">
                  <div>
                    <p className="text-white font-bold text-sm">Current Lives</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {Array.from({ length: MAX_LIVES }).map((_, i) => (
                        <div key={i} className={`life-orb ${i >= lives ? 'used' : ''}`} style={{ width: '16px', height: '16px' }} />
                      ))}
                      <span className="text-sm text-slate-400 ml-1">{lives}/{MAX_LIVES}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Resets monthly</p>
                    <p className="text-xs text-slate-600">{lastLivesReset || 'This month'}</p>
                  </div>
                </div>

                <button
                  onClick={purchaseLifeline}
                  disabled={totalStashPoints < LIFELINE_COST || lives >= MAX_LIVES}
                  className="w-full p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-all flex items-center justify-between disabled:opacity-40 disabled:cursor-not-allowed group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-purple-500/20 transition-shadow">
                      <Shield className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-white text-sm">Emergency Streak Repair</p>
                      <p className="text-xs text-slate-500">Restore 1 life to protect your streak</p>
                    </div>
                  </div>
                  <div className="badge badge-purple text-xs font-bold">{LIFELINE_COST} pts</div>
                </button>

                {totalStashPoints < LIFELINE_COST && lives < MAX_LIVES && (
                  <p className="text-xs text-yellow-400 mt-3 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3" /> Need {LIFELINE_COST - totalStashPoints} more points
                  </p>
                )}

                {/* Point Economy Rules */}
                <div className="mt-5 p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                  <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-emerald-400" /> Daily Points (Max {MAX_DAILY_POINTS})</h4>
                  <div className="space-y-1.5 text-xs text-slate-500">
                    <div className="flex justify-between"><span>Stay within daily budget</span><span className="text-emerald-400 font-bold">+10</span></div>
                    <div className="flex justify-between"><span>Log at least 1 expense</span><span className="text-blue-400 font-bold">+5</span></div>
                    <div className="flex justify-between"><span>Contribute to savings goal</span><span className="text-purple-400 font-bold">+5</span></div>
                  </div>
                </div>
              </div>

              <div className="glass-card-static p-7 border-red-500/10">
                <h3 className="text-lg font-bold text-white mb-2">Account Access</h3>
                <p className="text-slate-500 text-sm mb-5">Securely log out of your account.</p>
                <button
                  onClick={handleSignOut}
                  className="bg-red-500/10 border border-red-500/15 text-red-400 hover:bg-red-500 hover:text-white font-semibold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2"
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
