"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Wrench,
  ShieldCheck,
  Bell,
  Sparkles,
  ArrowRight,
  Radio,
  Server,
  Lock,
  RefreshCw,
} from "lucide-react";

export default function MaintenancePage() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setIsSubscribed(true);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0F1109] text-[#E8E5DB] font-['DM_Sans',sans-serif] selection:bg-[#CAFF4D] selection:text-[#18180F] flex flex-col justify-between">
      {/* Background Industrial Texture & Light Orbs Container (Clipped safely without creating inner scrollbars) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `
              linear-gradient(#2F3328 1px, transparent 1px),
              linear-gradient(90deg, #2F3328 1px, transparent 1px)
            `,
            backgroundSize: "32px 32px",
          }}
        />

        {/* Motion Floating Glow Orbs */}
        <motion.div
          animate={{
            x: [0, 40, -30, 0],
            y: [0, -40, 30, 0],
            scale: [1, 1.15, 0.95, 1],
            opacity: [0.15, 0.22, 0.15],
          }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-100px] left-[-80px] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full bg-[#4E7C59] blur-[100px] sm:blur-[150px]"
        />
        <motion.div
          animate={{
            x: [0, -50, 40, 0],
            y: [0, 50, -40, 0],
            scale: [1, 1.1, 1],
            opacity: [0.12, 0.2, 0.12],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-100px] right-[-80px] w-[320px] sm:w-[550px] h-[320px] sm:h-[550px] rounded-full bg-[#CAFF4D] blur-[120px] sm:blur-[170px]"
        />
      </div>

      {/* Header Bar */}
      <header className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#2A2C22]">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center space-x-3 text-center sm:text-left"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#161811] border border-[#3F4135] flex items-center justify-center text-[#CAFF4D] font-serif font-bold text-lg sm:text-xl shadow-sm shrink-0">
            F
          </div>
          <div>
            <span className="font-serif font-bold text-lg sm:text-xl text-[#E8E5DB] tracking-tight block">
              FlowCMS
            </span>
            <p className="text-[9px] sm:text-[10px] font-mono text-[#9F9C90] uppercase tracking-widest">
              System Operations
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center space-x-2 bg-[#161811] px-3 sm:px-3.5 py-1.5 border border-[#2A2C22] text-[11px] sm:text-xs font-mono text-[#9F9C90]"
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#CAFF4D] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#CAFF4D]"></span>
          </span>
          <span className="text-[#E8E5DB] whitespace-nowrap">MAINTENANCE IN PROGRESS</span>
        </motion.div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-16 flex flex-col items-center text-center">
        {/* Animated Gear & Radar Visual */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, type: "spring", stiffness: 90 }}
          className="relative mb-8 sm:mb-10"
        >
          {/* Outer Pulsing Motion Rings */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border border-dashed border-[#7CAC88]/30 flex items-center justify-center p-2.5 sm:p-3"
          >
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="w-full h-full rounded-full border border-[#CAFF4D]/40 border-t-[#CAFF4D] flex items-center justify-center"
            />
          </motion.div>

          {/* Center Industrial Wrench Emblem */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              whileHover={{ scale: 1.08 }}
              className="w-16 h-16 sm:w-20 sm:h-20 bg-[#161811] border-2 border-[#CAFF4D] shadow-[0_0_35px_rgba(202,255,77,0.22)] flex items-center justify-center text-[#CAFF4D]"
            >
              <motion.div
                animate={{ rotate: [0, 90, 180, 270, 360] }}
                transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
              >
                <Wrench className="w-7 h-7 sm:w-9 sm:h-9" />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Hero Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-3 sm:space-y-4 max-w-2xl mb-8 sm:mb-12 px-2"
        >
          <div className="inline-flex items-center space-x-2 px-3 sm:px-3.5 py-1 bg-[#1E3123] border border-[#2E4A35] text-[#CAFF4D] text-[11px] sm:text-xs font-mono uppercase tracking-widest">
            <Radio className="w-3.5 h-3.5 animate-pulse text-[#CAFF4D] shrink-0" />
            <span>Scheduled Maintenance</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold text-[#E8E5DB] tracking-tight leading-tight">
            We’re currently performing system updates.
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-[#9F9C90] font-light leading-relaxed">
            Our team is improving system infrastructure and performing critical updates. All application routes are temporarily paused and will return online as soon as the updates complete.
          </p>
        </motion.div>

        {/* Real Status Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full mb-8 sm:mb-12"
        >
          <div className="bg-[#161811] border border-[#2A2C22] p-5 sm:p-6 text-left space-y-2.5 sm:space-y-3">
            <div className="p-2.5 bg-[#0F1109] border border-[#2A2C22] w-fit text-[#CAFF4D]">
              <RefreshCw className="w-5 h-5 animate-spin" />
            </div>
            <h3 className="font-serif font-semibold text-base sm:text-lg text-[#E8E5DB]">
              System Upgrade
            </h3>
            <p className="text-xs text-[#9F9C90] leading-relaxed font-sans">
              Applying essential framework and server enhancements for smoother performance.
            </p>
          </div>

          <div className="bg-[#161811] border border-[#2A2C22] p-5 sm:p-6 text-left space-y-2.5 sm:space-y-3">
            <div className="p-2.5 bg-[#0F1109] border border-[#2A2C22] w-fit text-[#CAFF4D]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-semibold text-base sm:text-lg text-[#E8E5DB]">
              Data & Content Safe
            </h3>
            <p className="text-xs text-[#9F9C90] leading-relaxed font-sans">
              All databases, media assets, and configuration data remain secure and untouched.
            </p>
          </div>

          <div className="bg-[#161811] border border-[#2A2C22] p-5 sm:p-6 text-left space-y-2.5 sm:space-y-3 sm:col-span-2 md:col-span-1">
            <div className="p-2.5 bg-[#0F1109] border border-[#2A2C22] w-fit text-[#CAFF4D]">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-semibold text-base sm:text-lg text-[#E8E5DB]">
              Automated Restore
            </h3>
            <p className="text-xs text-[#9F9C90] leading-relaxed font-sans">
              Normal routing and access will automatically resume as soon as deployment finishes.
            </p>
          </div>
        </motion.div>

        {/* Email Notification Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-[#161811] border border-[#2A2C22] p-5 sm:p-8 text-center max-w-xl w-full relative overflow-hidden"
        >
          <div className="space-y-2 mb-5 sm:mb-6">
            <div className="inline-flex p-2.5 sm:p-3 bg-[#1E3123] border border-[#2E4A35] text-[#CAFF4D] mb-1 sm:mb-2">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="text-lg sm:text-xl font-serif font-bold text-[#E8E5DB]">
              Get Notified When We’re Back
            </h3>
            <p className="text-xs text-[#9F9C90]">
              Enter your email to receive an update as soon as service access is restored.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!isSubscribed ? (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubscribe}
                className="flex flex-col sm:flex-row gap-2.5 sm:gap-3"
              >
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 min-w-0 bg-[#0F1109] border border-[#2A2C22] px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm text-[#E8E5DB] placeholder-[#4D4B42] focus:outline-none focus:border-[#7CAC88] focus:ring-1 focus:ring-[#CAFF4D]"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="bg-[#CAFF4D] hover:bg-[#D6FF6A] text-[#18180F] font-mono text-xs uppercase font-bold tracking-wider px-5 sm:px-6 py-2.5 sm:py-3 border-none flex items-center justify-center space-x-2 transition-colors cursor-pointer shrink-0"
                >
                  <span>Notify Me</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </motion.form>
            ) : (
              <motion.div
                key="success"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[#1E3123] border border-[#2E4A35] p-3.5 sm:p-4 text-[#CAFF4D] font-mono text-xs uppercase tracking-wider flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Thank you! We'll send an update when services are live.</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#2A2C22] bg-[#080905] py-5 sm:py-6 px-4 sm:px-6 text-center text-xs font-mono text-[#4D4B42]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
          <div>
            © {new Date().getFullYear()} FlowCMS Infrastructure.
          </div>
          <div className="flex items-center space-x-2 text-[#9F9C90]">
            <Lock className="w-3.5 h-3.5 text-[#7CAC88] shrink-0" />
            <span>Secure System Standby Mode</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
