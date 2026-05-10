"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRightIcon, CheckIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ROLES = [
  { value: "SOLO_DEV", label: "Solo Developer" },
  { value: "TEAM_DEV", label: "Dev at a Company" },
  { value: "AGENCY", label: "Agency / Freelancer" },
  { value: "FOUNDER", label: "Founder / Builder" },
  { value: "STUDENT", label: "Student" },
  { value: "OPEN_SOURCE_MAINTAINER", label: "OSS Maintainer" },
] as const;

const waitlistSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  name: z.string().min(2, "Name must be at least 2 characters.").optional().or(z.literal("")),
  role: z.enum(["SOLO_DEV", "TEAM_DEV", "AGENCY", "FOUNDER", "STUDENT", "OPEN_SOURCE_MAINTAINER"]).optional(),
  useCase: z.string().max(280, "Keep it under 280 characters.").optional().or(z.literal("")),
});

type WaitlistValues = z.infer<typeof waitlistSchema>;

export function WaitlistForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [entryData, setEntryData] = useState<{ position: number; referralUrl: string } | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<WaitlistValues>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      email: "",
      name: "",
      useCase: "",
    }
  });

  const onSubmit = async (values: WaitlistValues) => {
    setIsSubmitting(true);
    const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const source = searchParams?.get("utm_source") ?? "direct";
    const ref = searchParams?.get("ref") ?? undefined;

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, source, ref }),
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
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Something went wrong.";
      toast.error(msg);
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

  const inputClasses = "h-12 bg-paper/50 border-border rounded-sm px-4 text-sm font-ui placeholder:text-ink-faint focus-visible:ring-[3px] focus-visible:ring-accent/20 focus-visible:border-accent transition-all duration-200";

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
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-paper bg-sidebar flex items-center justify-center text-[10px] font-bold text-accent-bright ring-1 ring-border">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-paper bg-accent-bright flex items-center justify-center text-[10px] font-bold text-ink ring-1 ring-border">
                  +1k
                </div>
              </div>
              <p className="text-sm font-medium text-ink tracking-tight text-center">
                First 30 developers get 1 month of Pro free.
              </p>
              <p className="text-[10px] font-mono text-ink-muted uppercase tracking-[0.2em] mt-1.5 opacity-60">
                Join the queue
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Input
                  {...register("email")}
                  placeholder="Email address"
                  className={cn(
                    inputClasses,
                    errors.email && "border-destructive focus-visible:ring-destructive/20"
                  )}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-[10px] font-mono uppercase tracking-wider text-destructive pl-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-5 gap-3 h-12">
                <div className="col-span-2">
                  <Input
                    {...register("name")}
                    placeholder="Full name"
                    className={cn(inputClasses, "h-full w-full")}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="col-span-3">
                  <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className={cn(inputClasses, "min-h-12 w-full flex px-4")}>
                          <SelectValue placeholder="Your Role" />
                        </SelectTrigger>
                        <SelectContent className="border-border shadow-xl">
                          {ROLES.map((role) => (
                            <SelectItem key={role.value} value={role.value} className="text-sm font-ui">
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Textarea
                  {...register("useCase")}
                  placeholder="What are you building? (optional)"
                  className={cn(inputClasses, "min-h-[80px] py-3 resize-none")}
                  disabled={isSubmitting}
                />
                {errors.useCase && (
                  <p className="text-[10px] font-mono uppercase tracking-wider text-destructive pl-1">
                    {errors.useCase.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-accent-bright text-ink hover:bg-[#D6FF6A] rounded-sm font-bold uppercase tracking-[0.2em] text-[11px] shadow-xl transition-all active:scale-[0.98] border-none"
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

            <p className="mt-8 text-center text-[10px] font-mono uppercase tracking-[0.25em] text-ink-faint">
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
              <p className="text-sm text-ink-muted mb-4 font-light">
                Position: <span className="font-bold text-ink">#{entryData?.position}</span>. Check your email to confirm.
              </p>
              <p className="text-[11px] text-accent font-medium mb-10 leading-relaxed max-w-[280px] mx-auto bg-accent/5 py-2 px-4 border border-accent/10 rounded-sm">
                We&apos;re prioritizing developers building documentation hubs and developer tools first.
              </p>

              <div className="space-y-4">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">Jump the queue</p>
                <div className="flex gap-2">
                  <div className="flex-1 bg-canvas border border-border rounded-sm px-4 h-11 flex items-center overflow-hidden">
                    <code className="text-xs text-ink-muted truncate font-mono">{entryData?.referralUrl}</code>
                  </div>
                  <Button
                    variant="outline"
                    onClick={copyReferral}
                    className="h-11 px-6 rounded-sm border-border-strong font-bold uppercase tracking-widest text-[10px] hover:bg-paper"
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
