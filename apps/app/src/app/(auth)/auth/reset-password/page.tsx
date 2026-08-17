import Link from "next/link";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage(props: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await props.searchParams;

  if (!token) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 bg-destructive/10 border border-destructive/20 rounded-sm">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-destructive">
              Invalid Link
            </span>
          </div>

          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-ink mb-4">
            Link <em className="italic text-destructive not-italic">Expired</em>
          </h1>
          <p className="text-ink-muted text-sm leading-relaxed font-light max-w-[320px]">
            This password reset link is missing or has already been used. Reset links
            are single-use and expire after 1 hour.
          </p>
        </div>

        <Link
          href="/auth/forgot-password"
          className="inline-flex items-center justify-center w-full h-14 bg-sidebar dark:bg-accent-bright text-white dark:text-sidebar font-sans font-bold text-[11px] uppercase tracking-[0.2em] rounded-sm hover:opacity-95 transition-all shadow-xl active:scale-[0.98] no-underline"
        >
          Request New Reset Link
        </Link>

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

  return <ResetPasswordForm token={token} />;
}
