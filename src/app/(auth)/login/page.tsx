"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "@/lib/auth-client";
import { LoginSchema, LoginFormValues } from "@/lib/validations/auth";
import {
  Field,
  FieldLabel,
  FieldContent,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setError(null);
    setLoading(true);

    try {
      const result = await signIn.email({
        email: values.email,
        password: values.password,
      });

      if (result.error) {
        setError(result.error.message ?? "Invalid email or password.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out">
      <div className="mb-12">
        <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-ink mb-4">
          Sign <em className="italic text-accent not-italic">in</em>
        </h1>
        <p className="text-ink-muted text-sm leading-relaxed font-light max-w-[280px]">
          Access your workspace to manage your content and delivery pipeline.
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
                  className="bg-transparent border-t-0 border-x-0 border-b border-border-strong rounded-none px-0 py-2.5 text-sm text-ink placeholder:text-ink-faint focus-visible:ring-0 focus-visible:border-accent transition-all shadow-none h-auto"
                />
                <FieldError errors={errors.email ? [errors.email] : []} className="text-[10px] font-bold uppercase tracking-wider mt-2" />
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <Field data-invalid={!!errors.password}>
              <div className="flex items-center justify-between">
                <FieldLabel className="font-mono text-[10px] font-bold text-ink-muted uppercase tracking-[0.2em]">
                  Password
                </FieldLabel>
                <Link
                  href="/forgot-password"
                  className="text-[10px] font-mono font-bold uppercase tracking-widest text-ink-faint hover:text-ink transition-colors no-underline"
                >
                  Forgot?
                </Link>
              </div>
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
          {loading ? "Authenticating..." : "Sign in to Dashboard"}
        </Button>
      </form>

      <div className="mt-16 pt-10 border-t border-border">
        <p className="text-ink-muted text-xs font-light">
          New to FlowCMS?{" "}
          <Link
            href="/register"
            className="text-ink font-bold hover:underline underline-offset-8 no-underline decoration-accent/40"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
