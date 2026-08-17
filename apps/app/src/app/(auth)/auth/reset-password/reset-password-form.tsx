"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import {
  Field,
  FieldLabel,
  FieldContent,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ResetSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type ResetValues = z.infer<typeof ResetSchema>;

interface Props {
  token: string;
}

export function ResetPasswordForm({ token }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetValues>({
    resolver: zodResolver(ResetSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetValues) {
    setStatus("loading");
    setApiError(null);

    const result = await authClient.resetPassword({
      newPassword: values.newPassword,
      token,
    });

    if (result.error) {
      setApiError(
        result.error.status === 400
          ? "This reset link is invalid or has expired."
          : "Something went wrong. Please try again."
      );
      setStatus("error");
      return;
    }

    setStatus("success");
  }

  if (status === "success") {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-sm">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-accent">
              Password Updated
            </span>
          </div>

          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-ink mb-4">
            All <em className="italic text-accent not-italic">Done</em>
          </h1>
          <p className="text-ink-muted text-sm leading-relaxed font-light max-w-[320px]">
            Your password has been updated. All existing sessions have been signed out
            for your security.
          </p>
        </div>

        <Link
          href="/auth/login"
          className="inline-flex items-center justify-center w-full h-14 bg-sidebar dark:bg-accent-bright text-white dark:text-sidebar font-sans font-bold text-[11px] uppercase tracking-[0.2em] rounded-sm hover:opacity-95 transition-all shadow-xl active:scale-[0.98] no-underline"
        >
          Sign in with New Password
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out">
      <div className="mb-12">
        <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-ink mb-4">
          New <em className="italic text-accent not-italic">Password</em>
        </h1>
        <p className="text-ink-muted text-sm leading-relaxed font-light max-w-[320px]">
          Choose a strong password for your FlowCMS account.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
        <Controller
          control={control}
          name="newPassword"
          render={({ field }) => (
            <Field data-invalid={!!errors.newPassword}>
              <FieldLabel className="font-mono text-[10px] font-bold text-ink-muted uppercase tracking-[0.2em]">
                New Password
              </FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="bg-transparent border-t-0 border-x-0 border-b border-border-strong rounded-none px-0 py-2.5 text-sm text-ink placeholder:text-ink-faint focus-visible:ring-0 focus-visible:border-accent transition-all shadow-none h-auto"
                />
                <FieldError
                  errors={errors.newPassword ? [errors.newPassword] : []}
                  className="text-[10px] font-bold uppercase tracking-wider mt-2"
                />
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field }) => (
            <Field data-invalid={!!errors.confirmPassword}>
              <FieldLabel className="font-mono text-[10px] font-bold text-ink-muted uppercase tracking-[0.2em]">
                Confirm Password
              </FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="bg-transparent border-t-0 border-x-0 border-b border-border-strong rounded-none px-0 py-2.5 text-sm text-ink placeholder:text-ink-faint focus-visible:ring-0 focus-visible:border-accent transition-all shadow-none h-auto"
                />
                <FieldError
                  errors={errors.confirmPassword ? [errors.confirmPassword] : []}
                  className="text-[10px] font-bold uppercase tracking-wider mt-2"
                />
              </FieldContent>
            </Field>
          )}
        />

        {status === "error" && apiError && (
          <div className="p-4 bg-destructive/5 border border-destructive/20 text-destructive text-[11px] font-bold uppercase tracking-widest rounded-sm">
            {apiError}
            {" — "}
            <Link
              href="/auth/forgot-password"
              className="underline underline-offset-4 decoration-destructive/40"
            >
              Request a new link
            </Link>
          </div>
        )}

        <Button
          type="submit"
          disabled={status === "loading"}
          className="w-full h-14 bg-sidebar dark:bg-accent-bright text-white dark:text-sidebar font-sans font-bold text-[11px] uppercase tracking-[0.2em] rounded-sm hover:opacity-95 transition-all shadow-xl active:scale-[0.98] border-none"
        >
          {status === "loading" ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </div>
  );
}
