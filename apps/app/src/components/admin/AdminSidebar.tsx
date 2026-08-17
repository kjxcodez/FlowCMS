"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  Activity,
  Database,
  Lock,
  ArrowLeft,
  ChevronRight,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
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
} from "@/components/ui/sidebar";

const ADMIN_NAV = [
  {
    label: "Operations",
    items: [
      { href: "/admin/operations", label: "System Health", icon: Activity },
      { href: "/admin/logs", label: "Platform Logs", icon: Database },
    ]
  },
  {
    label: "Security",
    items: [
      { href: "/admin/roles", label: "Admin Roles", icon: Lock },
      { href: "/admin/flags", label: "Feature Flags", icon: Zap },
    ]
  }
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <SidebarComponent className="bg-sidebar border-r border-white/5 text-white/70">
      <SidebarHeader className="h-20 px-6 flex flex-row items-center border-b border-white/5">
        <div className="flex items-center gap-3 w-full">
          <div className="size-8 bg-accent-bright rounded-[4px] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(var(--accent-bright-rgb),0.3)]">
            <Shield className="size-5 text-sidebar" />
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] font-bold text-white leading-tight">Admin Portal</span>
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-accent-bright/60 mt-0.5">FlowCMS Internal</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-6">
        {ADMIN_NAV.map((group) => (
          <SidebarGroup key={group.label} className="mb-8 last:mb-0">
            <SidebarGroupLabel className="px-3 mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">
              {group.label}
            </SidebarGroupLabel>
            <SidebarMenu className="gap-1">
              {group.items.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-sm text-[13px] font-medium transition-all duration-300",
                        isActive 
                          ? "bg-accent-bright text-sidebar font-bold shadow-lg" 
                          : "text-white/50 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon className="size-4 shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {isActive && <ChevronRight className="size-3" />}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-6 border-t border-white/5">
        <Link 
          href="/dashboard"
          className="flex items-center justify-center gap-3 w-full py-3 bg-white/5 hover:bg-accent-bright hover:text-sidebar rounded-sm text-[11px] font-bold uppercase tracking-widest transition-all group no-underline text-white/60"
        >
          <ArrowLeft className="size-3.5 group-hover:-translate-x-1 transition-transform" />
          Exit to Dashboard
        </Link>
        <div className="mt-6 flex items-center justify-between opacity-30">
           <span className="font-mono text-[8px] uppercase tracking-tighter">BUILD_ID::V1.2.0</span>
           <div className="size-1.5 rounded-full bg-accent-bright" />
        </div>
      </SidebarFooter>
    </SidebarComponent>
  );
}
