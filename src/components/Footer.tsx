"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Heart, MessageSquare, X, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Footer() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const handleFeedbackSubmit = async () => {
    if (!message.trim()) return;
    setIsSubmitting(true);
    setError("");

    const { error: feedbackError } = await supabase
      .from("feedback")
      .insert({ message: message.trim() });

    if (feedbackError) {
      setError(feedbackError.message || "Unable to send feedback right now.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    setIsModalOpen(false);
    setMessage("");
    setToast("Feedback sent! Thanks 💚");
    window.setTimeout(() => setToast(""), 3000);
  };

  return (
    <>
      <footer className="w-full bg-[#070b12] border-t border-white/[0.06] py-14 mt-auto relative overflow-hidden">
        <div className="orb orb-emerald w-[300px] h-[300px] -bottom-20 -right-20 opacity-10" />
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 relative z-10">
          
          {/* Brand */}
          <div className="flex flex-col items-start gap-4">
            <h3 className="font-bold text-white text-xl flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-emerald-500/20">
                S
              </div>
              Stash<span className="text-emerald-400">Saver</span>
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Your Gen-Z personal finance companion. Save smarter, spend wiser.
            </p>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-2.5">
            <h4 className="font-semibold text-white mb-1 text-sm uppercase tracking-wider">Legal</h4>
            <a href="#" className="text-slate-500 hover:text-emerald-400 text-sm transition-colors">Terms & Conditions</a>
            <a href="#" className="text-slate-500 hover:text-emerald-400 text-sm transition-colors">Privacy Policy</a>
            <a href="#" className="text-slate-500 hover:text-emerald-400 text-sm transition-colors">Security</a>
          </div>

          {/* Support */}
          <div className="flex flex-col gap-2.5">
            <h4 className="font-semibold text-white mb-1 text-sm uppercase tracking-wider">Support</h4>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="text-left text-emerald-400 hover:text-emerald-300 text-sm transition-colors font-medium flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" /> Send Feedback
            </button>
          </div>

          {/* Developer */}
          <div className="flex flex-col gap-2 md:items-end md:text-right">
            <h4 className="font-semibold text-white mb-1 text-sm uppercase tracking-wider">Made with <Heart className="w-3.5 h-3.5 inline text-red-400 fill-red-400" /></h4>
            <p className="text-slate-400 text-sm font-medium">Eshtiaq Ahmad</p>
            <p className="text-slate-600 text-xs">Dept. of Software Engineering</p>
            <p className="text-slate-600 text-xs">Daffodil International University</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-10 pt-6 border-t border-white/[0.04] relative z-10">
          <p className="text-slate-600 text-xs text-center">© {new Date().getFullYear()} Stash Saver. All rights reserved.</p>
        </div>
      </footer>

      {/* Feedback Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div 
              className="glass-card-static w-full max-w-md p-7 border-emerald-500/20"
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-400" /> Send Feedback
                </h2>
                <button onClick={() => { setIsModalOpen(false); setError(""); }} className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5" aria-label="Close Feedback">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {error && (
                <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                  {error}
                </div>
              )}
              
              <label htmlFor="feedbackMessage" className="sr-only">Feedback Message</label>
              <textarea
                id="feedbackMessage"
                className="input-field min-h-[140px] resize-none mb-4"
                placeholder="Tell us what's on your mind or report a bug..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                aria-label="Feedback message"
              />
              
              <div className="flex gap-3 justify-end">
                <button onClick={() => { setIsModalOpen(false); setError(""); }} className="btn-secondary px-5 py-2.5 text-sm">
                  Cancel
                </button>
                <button 
                  onClick={handleFeedbackSubmit}
                  disabled={isSubmitting || !message.trim()}
                  className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                >
                  <Send className="w-4 h-4" /> {isSubmitting ? "Sending..." : "Submit"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 rounded-xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-xl px-5 py-3 text-sm font-semibold text-emerald-300 shadow-2xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
