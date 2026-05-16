"use client";

import { useRouter, usePathname } from "next/navigation";
import { LogOut, User, Bell, Search, Globe, ChevronRight } from "lucide-react";
import { signOut, useSession } from "@/lib/auth-client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from "next/navigation";

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const env = searchParams.get("env") || "Production";
  const isProd = env.toLowerCase() === "production";

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  // Simple breadcrumb generator
  const paths = pathname.split("/").filter(Boolean);
  
  return (
    <header className="flex h-16 items-center justify-between px-6 bg-paper border-b border-border z-10 shrink-0">
      {/* --- Breadcrumbs --- */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-ink-muted hover:text-ink -ml-1.5" />
        <div className="h-4 w-[1px] bg-border mr-1 md:block hidden" />
        <Globe className="size-4 text-ink-faint mr-1 md:block hidden" />
        <div className="flex items-center text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">
          {paths.map((path, i) => {
            const isLast = i === paths.length - 1;
            const href = `/${paths.slice(0, i + 1).join("/")}`;
            const label = path.replace(/-/g, " ");
            
            return (
              <div key={path} className="flex items-center gap-2">
                {i > 0 && <ChevronRight className="size-3 text-ink-faint" />}
                <Link 
                  href={href}
                  className={cn(
                    "hover:text-ink transition-colors no-underline",
                    isLast ? "text-ink font-bold" : ""
                  )}
                >
                  {label}
                </Link>
              </div>
            );
          })}
        </div>
        <div className="h-4 w-[1px] bg-border mx-2 md:block hidden" />
        <Badge 
          variant="outline" 
          className={cn(
            "h-6 px-2 text-[9px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 rounded-sm",
            isProd 
              ? "bg-success/5 border-success/20 text-success" 
              : "bg-amber-500/5 border-amber-500/20 text-amber-500"
          )}
        >
          <div className={cn("size-1 rounded-full animate-pulse", isProd ? "bg-success" : "bg-amber-500")} />
          {env}
        </Badge>
      </div>

      {/* --- Actions --- */}
      <div className="flex items-center gap-6">
        {/* Search Toggle (Industrial style) */}
        <button 
          onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
          className="flex items-center gap-3 bg-canvas border border-border px-3 py-1.5 rounded-sm text-ink-faint hover:text-ink hover:border-border-strong transition-all cursor-pointer group"
        >
          <Search className="size-3.5" />
          <span className="text-[10px] font-mono uppercase tracking-widest hidden sm:inline">Search</span>
          <kbd className="hidden md:flex h-4 items-center gap-1 rounded bg-paper px-1.5 font-mono text-[9px] font-medium text-ink-faint group-hover:text-ink transition-colors">
            <span className="text-[10px]">⌘</span>K
          </kbd>
        </button>

        <button className="bg-transparent border-none relative p-2 text-ink-muted hover:text-ink transition-colors cursor-pointer">
          <Bell className="size-4.5" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-destructive rounded-full border border-paper" />
        </button>

        <div className="h-4 w-[1px] bg-border-strong mx-1" />

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-2">
          <div className="flex flex-col items-end">
            <span className="text-[12px] font-bold text-ink leading-tight">
              {session?.user?.name || "Member"}
            </span>
            <span className="text-[10px] font-mono text-ink-faint uppercase tracking-tighter">
              Admin
            </span>
          </div>
          
          <button 
            onClick={handleSignOut}
            className="group relative size-8 rounded-full bg-canvas border border-border-strong flex items-center justify-center overflow-hidden hover:border-accent transition-all cursor-pointer"
            title="Sign out"
          >
            <User className="size-4 text-ink-muted group-hover:opacity-0 transition-opacity" />
            <LogOut className="absolute inset-0 m-auto size-3.5 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>
    </header>
  );
}
