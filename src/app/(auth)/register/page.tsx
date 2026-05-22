"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUp } from "@/lib/auth-client";
import { APP_CONFIG } from "@/config/app";
import { RegisterSchema, RegisterFormValues } from "@/lib/validations/auth";
import {
  Field,
  FieldLabel,
  FieldContent,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SocialAuth } from "@/components/auth/social-auth";


import { Suspense } from "react";

function RegisterForm() {
  const router = useRouter();
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      workspaceName: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    setError(null);
    setLoading(true);

    try {
      // 1. Sign up user
      const result = await signUp.email({
        name: values.name,
        email: values.email,
        password: values.password,
      });

      if (result.error) {
        // EXPLICIT REDIRECT for hard errors (e.g. databaseHook rejection)
        // This ensures parity with Social Auth flow
        if (result.error.status === 403 || result.error.status === 422) {
          router.push(`/auth/error?code=AUTH_FAILED&message=${encodeURIComponent(result.error.message || "Registration blocked")}`);
          return;
        }
        
        setError(result.error.message ?? "Failed to create account.");
        setLoading(false);
        return;
      }

      // 2. Register workspace
      const wsResult = await fetch("/api/auth/register-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: values.workspaceName || `${values.name}'s Workspace` }),
      });

      if (!wsResult.ok) {
        console.error("Failed to create workspace");
      }

      // 3. Final Handoff: Force session refresh and navigation
      router.refresh(); // Refresh server components
      router.push("/dashboard");
    } catch (err) {
      console.error("Signup error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out">
      <div className="mb-12">
        <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-ink mb-4">
          Create <em className="italic text-accent not-italic">Account</em>
        </h1>
        <p className="text-ink-muted text-sm leading-relaxed font-light max-w-[320px]">
          Join {APP_CONFIG.name} and start orchestrating your content with industrial precision.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <Field data-invalid={!!errors.name}>
                <FieldLabel className="font-mono text-[10px] font-bold text-ink-muted uppercase tracking-[0.2em]">
                  Full Name
                </FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    placeholder="Jane Smith"
                    className="bg-transparent border-t-0 border-x-0 border-b border-border-strong rounded-none px-0 py-2.5 text-sm text-ink placeholder:text-ink-faint focus-visible:ring-0 focus-visible:border-accent transition-all shadow-none h-auto"
                  />
                  <FieldError errors={errors.name ? [errors.name] : []} className="text-[10px] font-bold uppercase tracking-wider mt-2" />
                </FieldContent>
              </Field>
            )}
          />
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
                    placeholder="jane@company.com"
                    className="bg-transparent border-t-0 border-x-0 border-b border-border-strong rounded-none px-0 py-2.5 text-sm text-ink placeholder:text-ink-faint focus-visible:ring-0 focus-visible:border-accent transition-all shadow-none h-auto"
                  />
                  <FieldError errors={errors.email ? [errors.email] : []} className="text-[10px] font-bold uppercase tracking-wider mt-2" />
                </FieldContent>
              </Field>
            )}
          />
        </div>

        <Controller
          control={control}
          name="workspaceName"
          render={({ field }) => (
            <Field data-invalid={!!errors.workspaceName}>
              <FieldLabel className="font-mono text-[10px] font-bold text-ink-muted uppercase tracking-[0.2em]">
                Workspace Name
              </FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  placeholder="e.g. My Content Hub"
                  className="bg-transparent border-t-0 border-x-0 border-b border-border-strong rounded-none px-0 py-2.5 text-sm text-ink placeholder:text-ink-faint focus-visible:ring-0 focus-visible:border-accent transition-all shadow-none h-auto"
                />
                <FieldError errors={errors.workspaceName ? [errors.workspaceName] : []} className="text-[10px] font-bold uppercase tracking-wider mt-2" />
              </FieldContent>
            </Field>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <Field data-invalid={!!errors.password}>
                <FieldLabel className="font-mono text-[10px] font-bold text-ink-muted uppercase tracking-[0.2em]">
                  Password
                </FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    type="password"
                    placeholder="••••••••"
                    className="bg-transparent border-t-0 border-x-0 border-b border-border-strong rounded-none px-0 py-2.5 text-sm text-ink placeholder:text-ink-faint focus-visible:ring-0 focus-visible:border-accent transition-all shadow-none h-auto"
                  />
                  <FieldError errors={errors.password ? [errors.password] : []} className="text-[10px] font-bold uppercase tracking-wider mt-2" />
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
                  Confirm
                </FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    type="password"
                    placeholder="••••••••"
                    className="bg-transparent border-t-0 border-x-0 border-b border-border-strong rounded-none px-0 py-2.5 text-sm text-ink placeholder:text-ink-faint focus-visible:ring-0 focus-visible:border-accent transition-all shadow-none h-auto"
                  />
                  <FieldError errors={errors.confirmPassword ? [errors.confirmPassword] : []} className="text-[10px] font-bold uppercase tracking-wider mt-2" />
                </FieldContent>
              </Field>
            )}
          />
        </div>

        {error && (
          <div className="p-4 bg-destructive/5 border border-destructive/20 text-destructive text-[11px] font-bold uppercase tracking-widest rounded-sm">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-14 bg-sidebar dark:bg-accent-bright text-white dark:text-sidebar font-sans font-bold text-[11px] uppercase tracking-[0.2em] rounded-sm hover:opacity-95 transition-all shadow-xl active:scale-[0.98] border-none"
        >
          {loading ? "Creating Account..." : "Create Free Account"}
        </Button>
      </form>

      <div className="mt-10">
        <SocialAuth />
      </div>

      <div className="my-16 py-10 border-t border-border">
        <p className="text-ink-muted text-xs font-light">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-ink font-bold hover:underline underline-offset-8 no-underline decoration-accent/40"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
