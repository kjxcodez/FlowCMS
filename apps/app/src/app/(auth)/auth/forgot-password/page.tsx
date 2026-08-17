"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Field,
  FieldLabel,
  FieldContent,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ForgotSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});
type ForgotValues = z.infer<typeof ForgotSchema>;

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "submitted">("idle");
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotValues>({
    resolver: zodResolver(ForgotSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotValues) {
    setStatus("loading");
    setSubmittedEmail(values.email);

    // Call Better Auth's forget-password endpoint directly.
    // authClient.forgetPassword is not on the base client type in this version,
    // so we call the HTTP endpoint directly instead.
    try {
      await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }),
      });
    } catch {
      // Swallow — always show success to prevent account enumeration
    }

    setStatus("submitted");
  }

  if (status === "submitted") {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-sm">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-accent">
              Email Sent
            </span>
          </div>

          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-ink mb-4">
            Check Your <em className="italic text-accent not-italic">Inbox</em>
          </h1>
          <p className="text-ink-muted text-sm leading-relaxed font-light max-w-[320px]">
            If <span className="font-medium text-ink">{submittedEmail}</span> has
            a FlowCMS account, you&apos;ll receive a reset link within a few minutes.
          </p>
        </div>

        <div className="space-y-6 p-4 border border-border/50 rounded-sm bg-paper/50">
          <p className="font-mono text-[10px] font-bold text-ink-muted uppercase tracking-[0.2em]">
            What to do
          </p>
          <ol className="space-y-2">
            {[
              "Open the email from FlowCMS",
              "Click the reset link — it expires in 1 hour",
              "Choose a new password",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-xs text-ink-muted">
                <span className="font-mono font-bold text-accent shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-8">
          <p className="text-[10px] text-ink-faint">
            Didn&apos;t receive it? Check your spam folder, or{" "}
            <button
              onClick={() => setStatus("idle")}
              className="text-ink font-bold underline underline-offset-4 decoration-accent/40 bg-transparent border-none cursor-pointer"
            >
              request another link
            </button>
            .
          </p>
        </div>

        <div className="my-16 py-10 border-t border-border">
          <p className="text-ink-muted text-xs font-light">
            Remembered it?{" "}
            <Link
              href="/auth/login"
              className="text-ink font-bold hover:underline underline-offset-8 no-underline decoration-accent/40"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out">
      <div className="mb-12">
        <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-ink mb-4">
          Reset <em className="italic text-accent not-italic">Password</em>
        </h1>
        <p className="text-ink-muted text-sm leading-relaxed font-light max-w-[320px]">
          Enter your account email and we&apos;ll send you a secure reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <Field data-invalid={!!errors.email}>
              <FieldLabel className="font-mono text-[10px] font-bold text-ink-muted uppercase tracking-[0.2em]">
                Email Address
              </FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  type="email"
                  placeholder="name@company.com"
                  autoComplete="email"
                  className="bg-transparent border-t-0 border-x-0 border-b border-border-strong rounded-none px-0 py-2.5 text-sm text-ink placeholder:text-ink-faint focus-visible:ring-0 focus-visible:border-accent transition-all shadow-none h-auto"
                />
                <FieldError
                  errors={errors.email ? [errors.email] : []}
                  className="text-[10px] font-bold uppercase tracking-wider mt-2"
                />
              </FieldContent>
            </Field>
          )}
        />

        <Button
          type="submit"
          disabled={status === "loading"}
          className="w-full h-14 bg-sidebar dark:bg-accent-bright text-white dark:text-sidebar font-sans font-bold text-[11px] uppercase tracking-[0.2em] rounded-sm hover:opacity-95 transition-all shadow-xl active:scale-[0.98] border-none"
        >
          {status === "loading" ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>

      <div className="my-16 py-10 border-t border-border">
        <p className="text-ink-muted text-xs font-light">
          Remembered it?{" "}
          <Link
            href="/auth/login"
            className="text-ink font-bold hover:underline underline-offset-8 no-underline decoration-accent/40"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
