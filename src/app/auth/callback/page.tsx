"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Wallet } from "lucide-react";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push("/dashboard");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/dashboard");
      } else if (window.location.hash.includes('error_description')) {
        router.push("/auth/signin?error=OAuthFailed");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 flex flex-col justify-center items-center p-4">
      <Wallet className="w-16 h-16 text-blue-500 animate-pulse" />
      <h1 className="mt-8 text-xl font-bold text-white tracking-wide">
        Setting up your Stash...
      </h1>
      <p className="mt-2 text-gray-400 text-sm">
        You will be redirected shortly.
      </p>
    </div>
  );
}
