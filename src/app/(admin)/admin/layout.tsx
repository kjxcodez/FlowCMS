import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { requireAdmin } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-canvas selection:bg-accent-bright/30 selection:text-white">
        <AdminSidebar />
        <SidebarInset className="flex flex-col bg-canvas">
          <main className="flex-1 overflow-auto bg-canvas/50">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
