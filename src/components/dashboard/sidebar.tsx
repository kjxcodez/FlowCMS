"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Image,
  Key,
  Settings,
  LayoutDashboard,
  Layers,
  Webhook,
  Activity,
  Plus,
  ChevronDown,
  Sun,
  Moon,
  Monitor,
  GitBranch,
  Users,
  ClipboardList,
  CreditCard,
  Lock,
  Shield
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar";

const NAV_GROUPS = [
  {
    label: "Main",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    ]
  },
  {
    label: "Content",
    items: [
      { href: "/dashboard/collections", label: "Collections", icon: Layers },
      { href: "/dashboard/media", label: "Media Library", icon: Image },
    ]
  },
  {
    label: "Developers",
    items: [
      { href: "/dashboard/api-keys", label: "API Keys", icon: Key },
      { href: "/dashboard/webhooks", label: "Webhooks", icon: Webhook },
      { href: "/dashboard/environments", label: "Environments", icon: GitBranch },
      { href: "/dashboard/usage", label: "Usage & Logs", icon: Activity },
    ]
  },
  {
    label: "Team",
    items: [
      { href: "/dashboard/team", label: "Members", icon: Users },
      { href: "/dashboard/audit-logs", label: "Audit Logs", icon: ClipboardList },
    ]
  },
  {
    label: "Settings",
    items: [
      { href: "/dashboard/settings", label: "Workspace", icon: Settings },
      { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { data: workspaceData } = useWorkspace();

  useEffect(() => {
    setMounted(true);
  }, []);

  const themeOptions = [
    { key: "light", icon: <Sun className="size-3.5" />, label: "Light" },
    { key: "dark", icon: <Moon className="size-3.5" />, label: "Dark" },
    { key: "system", icon: <Monitor className="size-3.5" />, label: "System" },
  ];

  return (
    <SidebarComponent className="bg-sidebar border-r border-white/5 text-white/70">
      <SidebarHeader className="h-16 px-4 flex flex-row items-center border-b border-white/5">
        <div className="flex items-center gap-3 w-full group cursor-pointer">
          <div className="w-7 h-7 bg-accent-bright rounded-[4px] flex items-center justify-center shrink-0">
            <div className="w-2.5 h-2.5 bg-sidebar rounded-[1px]" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[13px] font-semibold text-white truncate leading-tight">
              {workspaceData?.name ?? "My Workspace"}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/30 truncate mt-0.5">
              {workspaceData?.plan ?? "Free Plan"}
            </span>
          </div>
          <ChevronDown className="size-3.5 ml-auto text-white/20 group-hover:text-white/40 transition-colors" />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4 no-scrollbar">
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label} className="mb-4 last:mb-0">
            <SidebarGroupLabel className="px-3 mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white/20">
              {group.label}
            </SidebarGroupLabel>
            <SidebarMenu className="gap-0.5">
              {group.items.map((item) => {
                const isActive = item.href === "/dashboard" 
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
                
                const isAuditLog = item.href === "/dashboard/audit-logs";
                const plan = workspaceData?.plan ?? "HOBBY";
                const isLocked = isAuditLog && (plan === "HOBBY" || plan === "PRO");

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      disabled={isLocked}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-sm text-[13px] font-medium transition-all duration-200",
                        isActive 
                          ? "bg-accent-dim text-accent-bright border-l-2 border-accent-bright rounded-none -ml-[8px] pl-[10px] hover:bg-accent-dim hover:text-accent-bright" 
                          : "text-white/60 hover:bg-white/5 hover:text-white",
                        isLocked && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-white/60"
                      )}
                    >
                      {isLocked ? (
                        <div className="flex items-center gap-3 w-full">
                          <item.icon className="size-4 text-white/30" />
                          <span>{item.label}</span>
                          <Lock className="size-3 ml-auto text-white/20" />
                        </div>
                      ) : (
                        <Link href={item.href}>
                          <item.icon className={cn(
                            "size-4 transition-colors",
                            isActive ? "text-accent-bright" : "text-white/30 group-hover:text-white/50"
                          )} />
                          <span>{item.label}</span>
                        </Link>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/5 flex flex-col gap-4">
        <Link 
          href="/dashboard/collections/new"
          className="flex items-center justify-center gap-2 w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-sm text-[11px] font-bold uppercase tracking-widest transition-colors border-none no-underline"
        >
          <Plus className="size-3.5" />
          Create Collection
        </Link>

        {mounted && (
          <div className="flex items-center bg-black/20 border border-white/5 rounded-sm p-1 gap-1" role="group" aria-label="Select color theme">
            {themeOptions.map(opt => (
              <button
                key={opt.key}
                className={cn(
                  "flex items-center justify-center flex-1 h-7 border-none bg-transparent text-white/40 cursor-pointer rounded-sm transition-all",
                  theme === opt.key && "bg-white/10 text-white shadow-sm"
                )}
                onClick={() => setTheme(opt.key)}
                aria-label={`${opt.label} theme`}
                aria-pressed={theme === opt.key}
                title={opt.label}
              >
                {opt.icon}
              </button>
            ))}
          </div>
        )}

        {workspaceData?.isAdmin && (
          <Link 
            href="/admin/operations"
            className="flex items-center justify-center gap-2 w-full py-2 bg-accent-bright/10 hover:bg-accent-bright/20 text-accent-bright rounded-sm text-[11px] font-bold uppercase tracking-widest transition-colors border border-accent-bright/20 no-underline"
          >
            <Shield className="size-3.5" />
            Admin Portal
          </Link>
        )}

        <div className="flex items-center justify-between opacity-50 px-2">
           <span className="font-mono text-[9px] uppercase tracking-tighter text-white/40">
             FlowCMS v1.0.0
           </span>
           <div className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(58,125,68,0.5)]" />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </SidebarComponent>
  );
}
