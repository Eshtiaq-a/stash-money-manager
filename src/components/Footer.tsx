"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

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
    setToast("Message Received");
    window.setTimeout(() => setToast(""), 3000);
  };

  return (
    <>
      <footer className="w-full bg-[#0a0d13] border-t border-gray-800 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Column 1: Brand */}
          <div className="flex flex-col items-start gap-4">
            <h3 className="font-bold text-white text-xl flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white text-lg font-bold">
                S
              </div>
              Stash
            </h3>
            <p className="text-gray-400 text-sm">
              Stash: AI-Powered Financial Awareness.
            </p>
          </div>

          {/* Column 2: Legal */}
          <div className="flex flex-col gap-2">
            <h4 className="font-semibold text-white mb-2">Legal</h4>
            <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">Terms & Conditions</a>
            <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">Security</a>
          </div>

          {/* Column 3: Support */}
          <div className="flex flex-col gap-2">
            <h4 className="font-semibold text-white mb-2">Support</h4>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="text-left text-blue-500 hover:text-blue-400 text-sm transition-colors font-medium"
            >
              Report Bug / Give Feedback
            </button>
          </div>

          {/* Column 4: Dev Info */}
          <div className="flex flex-col gap-2 md:items-end md:text-right">
            <h4 className="font-semibold text-white mb-2">Lead Developer</h4>
            <p className="text-gray-400 text-sm font-medium">
              Eshtiaq Ahmad
            </p>
            <p className="text-gray-500 text-xs">
              Department of Software Engineering
            </p>
            <p className="text-gray-500 text-xs">
              Daffodil International University
            </p>
          </div>

        </div>
      </footer>

      {/* Feedback Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#161b22] border border-gray-800 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Send Feedback</h2>
            {error && (
              <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}
            <label htmlFor="feedbackMessage" className="sr-only">Feedback Message</label>
            <textarea
              id="feedbackMessage"
              className="w-full bg-[#0d1117] border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 min-h-[120px] resize-none mb-4"
              placeholder="Tell us what's on your mind or report a bug..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              aria-label="Feedback message"
            />
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setError("");
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleFeedbackSubmit}
                disabled={isSubmitting || !message.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Sending..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg border border-green-500/30 bg-[#123020] px-5 py-3 text-sm font-semibold text-green-100 shadow-2xl">
          {toast}
        </div>
      )}
    </>
  );
}
