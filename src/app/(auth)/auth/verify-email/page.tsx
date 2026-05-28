import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ResendVerification } from "@/components/auth/resend-verification";

export default async function VerifyEmailPage() {
  const session = await getSession();

  if (!session) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { emailVerified: true, email: true, name: true },
  });

  if (user?.emailVerified) {
    redirect("/dashboard");
  }

  const email = user?.email ?? session.user.email;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out">
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-sm">
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-accent">
            Action Required
          </span>
        </div>

        <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-ink mb-4">
          Check Your <em className="italic text-accent not-italic">Inbox</em>
        </h1>
        <p className="text-ink-muted text-sm leading-relaxed font-light max-w-[320px]">
          We sent a verification link to your email address. Click it to activate your account and access your workspace.
        </p>
      </div>

      <div className="space-y-8">
        {/* Email display */}
        <div className="space-y-2">
          <p className="font-mono text-[10px] font-bold text-ink-muted uppercase tracking-[0.2em]">
            Sent to
          </p>
          <div className="px-4 py-3 bg-sidebar/5 border border-border rounded-sm">
            <p className="font-mono text-sm text-ink font-medium">{email}</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-2 p-4 border border-border/50 rounded-sm bg-paper/50">
          <p className="font-mono text-[10px] font-bold text-ink-muted uppercase tracking-[0.2em] mb-3">
            What to do
          </p>
          <ol className="space-y-2">
            {["Open the email from FlowCMS", "Click the verification link", "You'll be signed in automatically"].map(
              (step, i) => (
                <li key={i} className="flex items-start gap-3 text-xs text-ink-muted">
                  <span className="font-mono font-bold text-accent shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <span>{step}</span>
                </li>
              )
            )}
          </ol>
        </div>

        {/* Resend */}
        <div className="space-y-3">
          <p className="font-mono text-[10px] font-bold text-ink-muted uppercase tracking-[0.2em]">
            Didn&apos;t receive it?
          </p>
          <ResendVerification email={email} />
          <p className="text-[10px] text-ink-faint">
            Check your spam folder, or wait a minute and try again.
          </p>
        </div>
      </div>

      <div className="my-16 py-10 border-t border-border">
        <p className="text-ink-muted text-xs font-light">
          Wrong account?{" "}
          <Link
            href="/api/auth/sign-out?callbackURL=/auth/login"
            className="text-ink font-bold hover:underline underline-offset-8 no-underline decoration-accent/40"
          >
            Sign out
          </Link>
        </p>
      </div>
    </div>
  );
}
