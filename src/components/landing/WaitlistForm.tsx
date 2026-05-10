"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRightIcon, CheckIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const waitlistSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  name: z.string().min(2, "Name must be at least 2 characters.").optional(),
});

type WaitlistValues = z.infer<typeof waitlistSchema>;

export function WaitlistForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [entryData, setEntryData] = useState<{ position: number; referralUrl: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WaitlistValues>({
    resolver: zodResolver(waitlistSchema),
  });

  const onSubmit = async (values: WaitlistValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to join waitlist.");
      }

      setEntryData({
        position: data.position,
        referralUrl: data.referralUrl,
      });
      setIsSuccess(true);
      toast.success("Successfully joined the waitlist!");
    } catch (error: any) {
      toast.error(error.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyReferral = () => {
    if (entryData?.referralUrl) {
      navigator.clipboard.writeText(entryData.referralUrl);
      toast.success("Referral link copied!");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {!isSuccess ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex flex-col items-center mb-8">
              <div className="flex -space-x-3 mb-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-paper bg-sidebar-mid flex items-center justify-center text-[10px] font-bold text-accent-bright ring-1 ring-border">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-paper bg-accent-bright flex items-center justify-center text-[10px] font-bold text-ink ring-1 ring-border">
                  +1k
                </div>
              </div>
              <p className="text-sm font-medium text-ink tracking-tight">
                First 200 developers get 6 months of Pro free.
              </p>
              <p className="text-[11px] text-ink-muted uppercase tracking-widest mt-1">
                Join the queue
              </p>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Input
                  {...register("email")}
                  placeholder="Email address"
                  className={cn(
                    "h-14 bg-paper border-border-strong rounded-sm px-6 text-base focus-visible:ring-accent/20",
                    errors.email && "border-destructive focus-visible:ring-destructive/20"
                  )}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-[11px] font-mono uppercase tracking-wider text-destructive pl-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Input
                  {...register("name")}
                  placeholder="Full name (optional)"
                  className="h-14 bg-paper border-border-strong rounded-sm px-6 text-base focus-visible:ring-accent/20"
                  disabled={isSubmitting}
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 bg-accent-bright text-ink hover:bg-accent-bright/90 rounded-sm font-bold uppercase tracking-[0.15em] text-[11px] shadow-xl transition-all active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <>
                    Join Waitlist <ArrowRightIcon className="ml-2 size-4" />
                  </>
                )}
              </Button>
            </form>
            <p className="mt-6 text-center text-[10px] font-mono uppercase tracking-[0.2em] text-ink-faint">
              No hype. No spam. Just priority access.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center bg-paper border border-border-strong p-10 rounded-sm shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 graph-bg opacity-5 z-0" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckIcon className="size-8 text-accent" />
              </div>
              <h3 className="font-display text-2xl font-bold text-ink mb-2">You&apos;re on the list</h3>
              <p className="text-sm text-ink-muted mb-10 font-light">
                Position: <span className="font-bold text-ink">#{entryData?.position}</span>. Check your email to confirm.
              </p>
              
              <div className="space-y-4">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">Jump the queue</p>
                <div className="flex gap-2">
                  <div className="flex-1 bg-canvas border border-border rounded-sm px-4 h-12 flex items-center overflow-hidden">
                    <code className="text-xs text-ink-muted truncate">{entryData?.referralUrl}</code>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={copyReferral}
                    className="h-12 px-6 rounded-sm border-border-strong font-bold uppercase tracking-widest text-[10px]"
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
